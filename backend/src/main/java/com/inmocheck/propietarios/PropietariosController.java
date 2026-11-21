package com.inmocheck.propietarios;

import com.inmocheck.comun.http.Datos;
import com.inmocheck.comun.http.Pagina;
import com.inmocheck.comun.http.ParametrosPagina;
import com.inmocheck.comun.sesion.Actor;
import com.inmocheck.comun.sesion.Rol;
import jakarta.validation.Valid;
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

// /api/v1/propietarios (docs/contratos/api.md, "Personal y propietarios").
// Solo el administrador. Recibe, exige el rol, valida y responde: las reglas
// están en PropietariosService.
@RestController
@RequestMapping("/api/v1/propietarios")
public class PropietariosController {

	private static final String RUTA = "/api/v1/propietarios/";

	private final PropietariosService servicio;

	public PropietariosController(PropietariosService servicio) {
		this.servicio = servicio;
	}

	@GetMapping
	Pagina<PropietarioRespuesta> listar(
			Actor actor,
			@Valid ParametrosPagina pagina,
			@RequestParam(required = false)
			@Size(max = 80, message = "La búsqueda puede tener máximo 80 caracteres.") String search,
			@RequestParam(required = false) String inmuebles) {
		actor.exigirRol(Rol.ADMIN);
		return servicio.listar(actor, FiltroPropietarios.de(search, inmuebles), pagina);
	}

	@PostMapping
	ResponseEntity<Datos<PropietarioRespuesta>> crear(Actor actor, @Valid @RequestBody CrearPropietario datos) {
		actor.exigirRol(Rol.ADMIN);
		PropietarioRespuesta propietario = servicio.crear(actor, datos);
		return ResponseEntity.created(URI.create(RUTA + propietario.id())).body(Datos.de(propietario));
	}

	@GetMapping("/{id}")
	Datos<PropietarioRespuesta> obtener(Actor actor, @PathVariable UUID id) {
		actor.exigirRol(Rol.ADMIN);
		return Datos.de(servicio.obtener(actor, id));
	}

	// El cuerpo llega como JSON crudo para distinguir "no vino" de "vino en null".
	@PatchMapping("/{id}")
	Datos<PropietarioRespuesta> editar(Actor actor, @PathVariable UUID id, @RequestBody JsonNode cuerpo) {
		actor.exigirRol(Rol.ADMIN);
		return Datos.de(servicio.editar(actor, id, EditarPropietario.desde(cuerpo)));
	}
}
