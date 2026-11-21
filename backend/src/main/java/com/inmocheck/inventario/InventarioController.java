package com.inmocheck.inventario;

import com.inmocheck.comun.http.Datos;
import com.inmocheck.comun.sesion.Actor;
import com.inmocheck.comun.sesion.Rol;
import com.inmocheck.inventario.InventarioDtos.CrearElemento;
import com.inmocheck.inventario.InventarioDtos.CrearEspacio;
import com.inmocheck.inventario.InventarioDtos.ElementoRespuesta;
import com.inmocheck.inventario.InventarioDtos.EspacioRespuesta;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;

// Inventario (docs/contratos/api.md, "Inmuebles e inventario"):
//   GET  /inmuebles/{id}/espacios   admin e inspector (RLS decide)
//   POST /inmuebles/{id}/espacios   admin
//   PATCH /espacios/{id}            admin
//   POST /espacios/{id}/elementos   admin
//   PATCH /elementos/{id}           admin
@RestController
public class InventarioController {

	private final InventarioService servicio;

	public InventarioController(InventarioService servicio) {
		this.servicio = servicio;
	}

	@GetMapping("/api/v1/inmuebles/{id}/espacios")
	Datos<List<EspacioRespuesta>> listarEspacios(Actor actor, @PathVariable UUID id) {
		return Datos.de(servicio.listarEspacios(actor, id));
	}

	@PostMapping("/api/v1/inmuebles/{id}/espacios")
	ResponseEntity<Datos<EspacioRespuesta>> crearEspacio(
			Actor actor, @PathVariable UUID id, @Valid @RequestBody CrearEspacio datos) {
		actor.exigirRol(Rol.ADMIN);
		EspacioRespuesta espacio = servicio.crearEspacio(actor, id, datos);
		return ResponseEntity.created(URI.create("/api/v1/espacios/" + espacio.id())).body(Datos.de(espacio));
	}

	@PatchMapping("/api/v1/espacios/{id}")
	Datos<EspacioRespuesta> editarEspacio(Actor actor, @PathVariable UUID id, @RequestBody JsonNode cuerpo) {
		actor.exigirRol(Rol.ADMIN);
		return Datos.de(servicio.editarEspacio(actor, id, cuerpo));
	}

	@PostMapping("/api/v1/espacios/{id}/elementos")
	ResponseEntity<Datos<ElementoRespuesta>> crearElemento(
			Actor actor, @PathVariable UUID id, @Valid @RequestBody CrearElemento datos) {
		actor.exigirRol(Rol.ADMIN);
		ElementoRespuesta elemento = servicio.crearElemento(actor, id, datos);
		return ResponseEntity.created(URI.create("/api/v1/elementos/" + elemento.id())).body(Datos.de(elemento));
	}

	@PatchMapping("/api/v1/elementos/{id}")
	Datos<ElementoRespuesta> editarElemento(Actor actor, @PathVariable UUID id, @RequestBody JsonNode cuerpo) {
		actor.exigirRol(Rol.ADMIN);
		return Datos.de(servicio.editarElemento(actor, id, cuerpo));
	}
}
