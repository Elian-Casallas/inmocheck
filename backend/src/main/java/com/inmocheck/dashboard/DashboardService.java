package com.inmocheck.dashboard;

import com.inmocheck.comun.datos.EjecutorRls;
import com.inmocheck.comun.sesion.Actor;
import com.inmocheck.inspecciones.InspeccionResumen;
import com.inmocheck.inspecciones.InspeccionesDtos.EstadoInspeccion;
import com.inmocheck.inspecciones.InspeccionesRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

// Resumen del administrador (equivale a dashboard.service.ts). Todo sale de
// una sola transacción RLS: no hace falta filtrar por organización.
@Service
public class DashboardService {

	static final int PROXIMAS_EN_EL_RESUMEN = 5;

	private final EjecutorRls ejecutor;
	private final DashboardRepository repositorio;
	private final InspeccionesRepository inspecciones;

	public DashboardService(EjecutorRls ejecutor, DashboardRepository repositorio, InspeccionesRepository inspecciones) {
		this.ejecutor = ejecutor;
		this.repositorio = repositorio;
		this.inspecciones = inspecciones;
	}

	public record Resumen(
			// Actuales, no históricos: cuántos hay activos hoy.
			long inmueblesActivos,
			long inspectoresActivos,
			ConteoInspecciones inspecciones,
			List<InspeccionResumen> proximas,
			// Pendientes que no se iniciaron antes del cierre de su día: el
			// administrador las reprograma, reasigna o cancela.
			List<InspeccionResumen> noRealizadas) {
	}

	public record ConteoInspecciones(long pendientes, long enProceso, long finalizadas, long canceladas) {
	}

	// desde / hasta: rango sobre la fecha programada (solo para los conteos por estado).
	public Resumen resumen(Actor actor, LocalDate desde, LocalDate hasta) {
		return ejecutor.ejecutar(actor.token(), jdbc -> {
			Map<EstadoInspeccion, Long> conteo = inspecciones.contarPorEstado(jdbc, desde, hasta);
			return new Resumen(
					repositorio.contarInmueblesActivos(jdbc),
					repositorio.contarInspectoresActivos(jdbc),
					new ConteoInspecciones(
							conteo.get(EstadoInspeccion.PENDIENTE),
							conteo.get(EstadoInspeccion.EN_PROCESO),
							conteo.get(EstadoInspeccion.FINALIZADA),
							conteo.get(EstadoInspeccion.CANCELADA)),
					inspecciones.listarProximas(jdbc, PROXIMAS_EN_EL_RESUMEN),
					inspecciones.listarNoRealizadas(jdbc));
		});
	}
}
