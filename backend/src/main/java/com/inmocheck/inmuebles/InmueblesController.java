package com.inmocheck.inmuebles;

import com.inmocheck.comun.http.Datos;
import com.inmocheck.comun.http.Pagina;
import com.inmocheck.comun.http.ParametrosPagina;
import com.inmocheck.comun.sesion.Actor;
import com.inmocheck.comun.sesion.Rol;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;

// /api/v1/inmuebles (docs/contratos/api.md, "Inmuebles e inventario").
// Listar, consultar e historial: administrador e inspector (RLS decide qué ve
// cada uno). Crear, editar y desactivar: solo el administrador.
@RestController
@RequestMapping("/api/v1/inmuebles")
public class InmueblesController {

	private static final String RUTA = "/api/v1/inmuebles/";

	private final InmueblesService servicio;

	public InmueblesController(InmueblesService servicio) {
		this.servicio = servicio;
	}

	@GetMapping
	Pagina<InmuebleRespuesta> listar(
			Actor actor,
			@Valid ParametrosPagina pagina,
			@RequestParam(required = false)
			@Size(max = 80, message = "La búsqueda puede tener máximo 80 caracteres.") String search,
			@RequestParam(required = false)
			@Pattern(regexp = "APARTAMENTO|CASA|OTRO", message = "Tipo de inmueble no válido.") String tipo,
			@RequestParam(required = false)
			@Pattern(regexp = "true|false", message = "Debe ser true o false.") String activo,
			@RequestParam(required = false)
			@Pattern(regexp = "-?(codigo|createdAt)", message = "Orden no válido.") String sort) {
		return servicio.listar(actor, FiltroInmuebles.de(search, tipo, activo, sort), pagina);
	}

	@PostMapping
	ResponseEntity<Datos<InmuebleRespuesta>> crear(Actor actor, @Valid @RequestBody CrearInmueble datos) {
		actor.exigirRol(Rol.ADMIN);
		InmuebleRespuesta inmueble = servicio.crear(actor, datos);
		return ResponseEntity.created(URI.create(RUTA + inmueble.id())).body(Datos.de(inmueble));
	}

	@GetMapping("/{id}")
	Datos<InmuebleRespuesta> obtener(Actor actor, @PathVariable UUID id) {
		return Datos.de(servicio.obtener(actor, id));
	}

	// El cuerpo llega como JSON crudo para distinguir "no vino" de "vino en null".
	@PatchMapping("/{id}")
	Datos<InmuebleRespuesta> editar(Actor actor, @PathVariable UUID id, @RequestBody JsonNode cuerpo) {
		actor.exigirRol(Rol.ADMIN);
		return Datos.de(servicio.editar(actor, id, EditarInmueble.desde(cuerpo)));
	}

	// DELETE no borra la fila: la desactiva y conserva el historial.
	@DeleteMapping("/{id}")
	ResponseEntity<Void> desactivar(Actor actor, @PathVariable UUID id) {
		actor.exigirRol(Rol.ADMIN);
		servicio.desactivar(actor, id);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/{id}/historial")
	Datos<List<InspeccionResumen>> historial(Actor actor, @PathVariable UUID id) {
		return Datos.de(servicio.historial(actor, id));
	}
}
