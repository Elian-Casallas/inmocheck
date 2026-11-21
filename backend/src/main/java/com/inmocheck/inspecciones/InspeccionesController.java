package com.inmocheck.inspecciones;

import com.inmocheck.comun.http.Datos;
import com.inmocheck.comun.http.Pagina;
import com.inmocheck.comun.http.ParametrosPagina;
import com.inmocheck.comun.sesion.Actor;
import com.inmocheck.comun.sesion.Rol;
import com.inmocheck.inspecciones.InspeccionesDtos.Cancelar;
import com.inmocheck.inspecciones.InspeccionesDtos.ConVersion;
import com.inmocheck.inspecciones.InspeccionesDtos.CrearInspeccion;
import com.inmocheck.inspecciones.InspeccionesDtos.DetalleGuardado;
import com.inmocheck.inspecciones.InspeccionesDtos.GuardarDetalle;
import com.inmocheck.inspecciones.InspeccionesDtos.InspeccionRespuesta;
import com.inmocheck.inspecciones.InspeccionesDtos.ListaDetalles;
import com.inmocheck.inspecciones.InspeccionesDtos.Reasignar;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import java.net.URI;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
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

// /api/v1/inspecciones (docs/contratos/api.md, "Inspecciones").
// Las transiciones son acciones POST sobre un subrecurso (/inicio,
// /cancelacion…): no son un simple cambio de campo, tienen reglas propias.
@RestController
@RequestMapping("/api/v1/inspecciones")
public class InspeccionesController {

	private static final String ESTADOS = "(PENDIENTE|EN_PROCESO|FINALIZADA|CANCELADA)";

	private final InspeccionesService servicio;

	public InspeccionesController(InspeccionesService servicio) {
		this.servicio = servicio;
	}

	// Admin: todas las de su organización. Inspector: solo las suyas (RLS).
	@GetMapping
	Pagina<InspeccionResumen> listar(
			Actor actor,
			@Valid ParametrosPagina pagina,
			@RequestParam(required = false)
			@Pattern(regexp = ESTADOS + "(," + ESTADOS + ")*", message = "Estado no válido.") String estado,
			@RequestParam(required = false)
			@Pattern(regexp = "ENTRADA|SALIDA|SEGUIMIENTO", message = "Tipo no válido.") String tipo,
			@RequestParam(required = false) UUID inmuebleId,
			@RequestParam(required = false) UUID inspectorId,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
		return servicio.listar(actor, FiltroInspecciones.de(estado, tipo, inmuebleId, inspectorId, desde, hasta), pagina);
	}

	@PostMapping
	ResponseEntity<Datos<InspeccionRespuesta>> crear(Actor actor, @Valid @RequestBody CrearInspeccion datos) {
		actor.exigirRol(Rol.ADMIN);
		InspeccionRespuesta inspeccion = servicio.crear(actor, datos);
		return ResponseEntity.created(URI.create("/api/v1/inspecciones/" + inspeccion.id())).body(Datos.de(inspeccion));
	}

	@GetMapping("/{id}")
	Datos<InspeccionRespuesta> obtener(Actor actor, @PathVariable UUID id) {
		return Datos.de(servicio.obtener(actor, id));
	}

	// Reprogramar: solo fecha o nota, solo mientras está pendiente, con versión.
	@PatchMapping("/{id}")
	Datos<InspeccionRespuesta> editar(Actor actor, @PathVariable UUID id, @RequestBody JsonNode cuerpo) {
		actor.exigirRol(Rol.ADMIN);
		return Datos.de(servicio.editar(actor, id, cuerpo));
	}

	@PostMapping("/{id}/inicio")
	Datos<InspeccionRespuesta> iniciar(Actor actor, @PathVariable UUID id, @Valid @RequestBody ConVersion datos) {
		actor.exigirRol(Rol.INSPECTOR);
		return Datos.de(servicio.iniciar(actor, id, datos.version()));
	}

	// ---------- Realizar la inspección (inspector asignado) ----------

	@GetMapping("/{id}/detalles")
	ListaDetalles detalles(Actor actor, @PathVariable UUID id) {
		return servicio.detalles(actor, id);
	}

	// Guarda la evaluación de un elemento. Exige la versión que el cliente
	// tenía: si ya cambió, 409 VERSION_CONFLICT en lugar de pisar el cambio.
	@PatchMapping("/{id}/detalles/{detalleId}")
	Datos<DetalleGuardado> guardarDetalle(
			Actor actor, @PathVariable UUID id, @PathVariable UUID detalleId, @Valid @RequestBody GuardarDetalle datos) {
		actor.exigirRol(Rol.INSPECTOR);
		return Datos.de(servicio.guardarDetalle(actor, id, detalleId, datos));
	}

	@PostMapping("/{id}/finalizacion")
	Datos<InspeccionRespuesta> finalizar(Actor actor, @PathVariable UUID id, @Valid @RequestBody ConVersion datos) {
		actor.exigirRol(Rol.INSPECTOR);
		return Datos.de(servicio.finalizar(actor, id, datos.version()));
	}

	@PostMapping("/{id}/reasignaciones")
	Datos<InspeccionRespuesta> reasignar(Actor actor, @PathVariable UUID id, @Valid @RequestBody Reasignar datos) {
		actor.exigirRol(Rol.ADMIN);
		return Datos.de(servicio.reasignar(actor, id, datos));
	}

	@PostMapping("/{id}/cancelacion")
	Datos<InspeccionRespuesta> cancelar(Actor actor, @PathVariable UUID id, @Valid @RequestBody Cancelar datos) {
		actor.exigirRol(Rol.ADMIN);
		return Datos.de(servicio.cancelar(actor, id, datos));
	}
}
