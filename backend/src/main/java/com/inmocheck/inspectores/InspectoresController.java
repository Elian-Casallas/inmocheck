package com.inmocheck.inspectores;

import com.inmocheck.comun.Textos;
import com.inmocheck.comun.http.Datos;
import com.inmocheck.comun.http.Pagina;
import com.inmocheck.comun.http.ParametrosPagina;
import com.inmocheck.comun.sesion.Actor;
import com.inmocheck.comun.sesion.Rol;
import com.inmocheck.inspectores.InspectoresDtos.InspectorInvitado;
import com.inmocheck.inspectores.InspectoresDtos.InspectorRespuesta;
import com.inmocheck.inspectores.InspectoresDtos.InvitarInspector;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;

// /api/v1/inspectores (docs/contratos/api.md, "Personal y propietarios").
// Todo es solo para el administrador.
@RestController
@RequestMapping("/api/v1/inspectores")
public class InspectoresController {

	private final InspectoresService servicio;

	public InspectoresController(InspectoresService servicio) {
		this.servicio = servicio;
	}

	@GetMapping
	Pagina<InspectorRespuesta> listar(
			Actor actor,
			@Valid ParametrosPagina pagina,
			@RequestParam(required = false)
			@Size(max = 80, message = "La búsqueda puede tener máximo 80 caracteres.") String search,
			@RequestParam(required = false)
			@Pattern(regexp = "true|false", message = "Debe ser true o false.") String activo) {
		actor.exigirRol(Rol.ADMIN);
		String busqueda = Textos.recortar(search);
		return servicio.listar(actor,
				busqueda == null || busqueda.isEmpty() ? null : busqueda,
				activo == null ? null : Boolean.valueOf(activo),
				pagina);
	}

	@PostMapping("/invitaciones")
	ResponseEntity<Datos<InspectorInvitado>> invitar(Actor actor, @Valid @RequestBody InvitarInspector datos) {
		actor.exigirRol(Rol.ADMIN);
		InspectorInvitado inspector = servicio.invitar(actor, datos);
		return ResponseEntity.created(URI.create("/api/v1/inspectores/" + inspector.id())).body(Datos.de(inspector));
	}

	@PatchMapping("/{id}")
	Datos<InspectorRespuesta> editar(Actor actor, @PathVariable UUID id, @RequestBody JsonNode cuerpo) {
		actor.exigirRol(Rol.ADMIN);
		return Datos.de(servicio.editar(actor, id, cuerpo));
	}

	// Envía al inspector un enlace nuevo para crear su contraseña. El cuerpo
	// se ignora (el front manda "{}"); la protección CSRF la hace el proxy.
	@PostMapping("/{id}/acceso")
	ResponseEntity<Void> reenviarAcceso(Actor actor, @PathVariable UUID id) {
		actor.exigirRol(Rol.ADMIN);
		servicio.reenviarAcceso(actor, id);
		return ResponseEntity.noContent().build();
	}
}
