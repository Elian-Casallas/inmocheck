package com.inmocheck.dashboard;

import com.inmocheck.comun.http.Datos;
import com.inmocheck.comun.sesion.Actor;
import com.inmocheck.comun.sesion.Rol;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// GET /api/v1/dashboard/resumen (docs/contratos/api.md). Solo el administrador.
@RestController
public class DashboardController {

	private final DashboardService servicio;

	public DashboardController(DashboardService servicio) {
		this.servicio = servicio;
	}

	@GetMapping("/api/v1/dashboard/resumen")
	Datos<DashboardService.Resumen> resumen(
			Actor actor,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
		actor.exigirRol(Rol.ADMIN);
		return Datos.de(servicio.resumen(actor, desde, hasta));
	}
}
