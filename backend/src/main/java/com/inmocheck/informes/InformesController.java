package com.inmocheck.informes;

import com.inmocheck.comun.Textos;
import com.inmocheck.comun.http.Datos;
import com.inmocheck.comun.http.Pagina;
import com.inmocheck.comun.http.ParametrosPagina;
import com.inmocheck.comun.sesion.Actor;
import com.inmocheck.informes.InformesRepository.Informe;
import com.inmocheck.informes.InformesRepository.InformeConInspeccion;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// Informes (docs/contratos/api.md). Administrador e inspector, cada uno con
// lo que RLS le deja ver; registrar_informe exige admin o inspector asignado.
@RestController
public class InformesController {

	private final InformesService servicio;

	public InformesController(InformesService servicio) {
		this.servicio = servicio;
	}

	// Cuerpo de POST (informeCrearSchema): el acta y, opcional, qué fotos lleva.
	record CrearInforme(
			@Pattern(regexp = "ACTA", message = "El único tipo de informe es ACTA.") String tipo,
			@Size(max = InformesService.FOTOS_MAXIMAS_EN_INFORME, message = "El acta lleva máximo 60 fotos.")
			List<UUID> evidenciaIds) {
	}

	@GetMapping("/api/v1/inspecciones/{id}/informes")
	Datos<List<Informe>> versiones(Actor actor, @PathVariable UUID id) {
		return Datos.de(servicio.listarDeInspeccion(actor, id));
	}

	// Genera una versión nueva del acta. Se puede reintentar: nunca cambia la inspección.
	@PostMapping("/api/v1/inspecciones/{id}/informes")
	ResponseEntity<Datos<Informe>> generar(Actor actor, @PathVariable UUID id, @Valid @RequestBody CrearInforme datos) {
		Informe informe = servicio.generar(actor, id, datos.evidenciaIds());
		return ResponseEntity.created(URI.create("/api/v1/informes/" + informe.id() + "/descarga")).body(Datos.de(informe));
	}

	// Biblioteca de informes y resumen del administrador.
	@GetMapping("/api/v1/informes")
	Pagina<InformeConInspeccion> listar(
			Actor actor,
			@Valid ParametrosPagina pagina,
			@RequestParam(required = false)
			@Size(max = 80, message = "La búsqueda puede tener máximo 80 caracteres.") String search,
			@RequestParam(required = false)
			@Pattern(regexp = "ENTRADA|SALIDA|SEGUIMIENTO", message = "Tipo no válido.") String tipo) {
		String busqueda = Textos.recortar(search);
		return servicio.listar(actor, busqueda == null || busqueda.isEmpty() ? null : busqueda, tipo, pagina);
	}

	// 302 hacia un enlace firmado de 60 s. El PDF es privado: cada descarga
	// vuelve a pasar por la autorización.
	@GetMapping("/api/v1/informes/{id}/descarga")
	ResponseEntity<Void> descargar(Actor actor, @PathVariable UUID id) {
		return ResponseEntity.status(HttpStatus.FOUND)
				.location(URI.create(servicio.enlaceDeDescarga(actor, id)))
				.cacheControl(CacheControl.noStore().cachePrivate())
				.build();
	}
}
