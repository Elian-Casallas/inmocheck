package com.inmocheck.evidencias;

import com.inmocheck.comun.Limites;
import com.inmocheck.comun.Textos;
import com.inmocheck.comun.http.Datos;
import com.inmocheck.comun.sesion.Actor;
import com.inmocheck.comun.sesion.Rol;
import com.inmocheck.evidencias.EvidenciasService.Acceso;
import com.inmocheck.evidencias.EvidenciasService.EvidenciaSubida;
import java.io.IOException;
import java.net.URI;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

// Fotos (docs/contratos/api.md, "Fotos, comparación, informes y panel").
@RestController
public class EvidenciasController {

	private final EvidenciasService servicio;

	public EvidenciasController(EvidenciasService servicio) {
		this.servicio = servicio;
	}

	// multipart/form-data con el campo "archivo" y "descripcion" opcional.
	// No se devuelve la ruta del archivo ni un enlace permanente.
	@PostMapping(value = "/api/v1/inspecciones/{id}/detalles/{detalleId}/evidencias",
			consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	ResponseEntity<Datos<EvidenciaSubida>> subir(
			Actor actor,
			@PathVariable UUID id,
			@PathVariable UUID detalleId,
			@RequestPart("archivo") MultipartFile archivo,
			@RequestParam(required = false) String descripcion) throws IOException {
		actor.exigirRol(Rol.INSPECTOR);
		EvidenciaSubida evidencia = servicio.subir(actor, id, detalleId, archivo.getBytes(), limpiar(descripcion));
		return ResponseEntity.created(URI.create("/api/v1/evidencias/" + evidencia.id() + "/acceso"))
				.body(Datos.de(evidencia));
	}

	// { data: { url, expiresIn } }. Con ?redirigir=1 responde 302 hacia el
	// enlace firmado: así <img src="…"> funciona directo y cada carga de la
	// imagen vuelve a pasar por la autorización.
	@GetMapping("/api/v1/evidencias/{id}/acceso")
	ResponseEntity<Datos<Acceso>> acceso(
			Actor actor, @PathVariable UUID id, @RequestParam(required = false) String redirigir) {
		Acceso acceso = servicio.acceso(actor, id);
		if (redirigir != null) {
			return ResponseEntity.status(HttpStatus.FOUND)
					.location(URI.create(acceso.url()))
					.cacheControl(CacheControl.noStore().cachePrivate())
					.build();
		}
		return ResponseEntity.ok(Datos.de(acceso));
	}

	// Retira una foto, solo mientras la inspección está en proceso.
	@DeleteMapping("/api/v1/evidencias/{id}")
	ResponseEntity<Void> eliminar(Actor actor, @PathVariable UUID id) {
		actor.exigirRol(Rol.INSPECTOR);
		servicio.eliminar(actor, id);
		return ResponseEntity.noContent().build();
	}

	// Descripción recortada; vacía cuenta como sin descripción; máximo 300.
	private static String limpiar(String descripcion) {
		String texto = Textos.recortar(descripcion);
		if (texto == null || texto.isEmpty()) return null;
		return texto.length() > Limites.FOTO_DESCRIPCION_MAXIMA ? texto.substring(0, Limites.FOTO_DESCRIPCION_MAXIMA) : texto;
	}
}
