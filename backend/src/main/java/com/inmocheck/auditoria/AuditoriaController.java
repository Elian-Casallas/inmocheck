package com.inmocheck.auditoria;

import com.inmocheck.auditoria.AuditoriaRepository.Evento;
import com.inmocheck.auditoria.AuditoriaRepository.Filtro;
import com.inmocheck.comun.http.Pagina;
import com.inmocheck.comun.http.ParametrosPagina;
import com.inmocheck.comun.sesion.Actor;
import com.inmocheck.comun.sesion.Rol;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// GET /api/v1/auditoria (docs/contratos/api.md). Solo lectura y solo para el
// administrador: no hay endpoints de escritura; la llenan los triggers y las
// funciones SQL.
@RestController
public class AuditoriaController {

	private final AuditoriaService servicio;

	public AuditoriaController(AuditoriaService servicio) {
		this.servicio = servicio;
	}

	@GetMapping("/api/v1/auditoria")
	Pagina<Evento> listar(
			Actor actor,
			@Valid ParametrosPagina pagina,
			@RequestParam(required = false)
			@Pattern(regexp = "INMUEBLE|ESPACIO|ELEMENTO|PROPIETARIO|INSPECTOR|INSPECCION",
					message = "Recurso no válido.") String recurso,
			@RequestParam(required = false) UUID recursoId,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
		actor.exigirRol(Rol.ADMIN);
		return servicio.listar(actor, new Filtro(recurso, recursoId, desde, hasta), pagina);
	}
}
