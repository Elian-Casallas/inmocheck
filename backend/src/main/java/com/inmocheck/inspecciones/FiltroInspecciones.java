package com.inmocheck.inspecciones;

import com.inmocheck.inspecciones.InspeccionesDtos.EstadoInspeccion;
import com.inmocheck.inspecciones.InspeccionesDtos.TipoInspeccion;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

// Filtros de GET /inspecciones (inspeccionesFiltroSchema + estado múltiple e
// inspectorId, ver docs/contratos/api.md). Los valores llegan ya validados.
public record FiltroInspecciones(
		List<EstadoInspeccion> estados,
		TipoInspeccion tipo,
		UUID inmuebleId,
		UUID inspectorId,
		LocalDate desde,
		LocalDate hasta) {

	public static FiltroInspecciones de(
			String estado, String tipo, UUID inmuebleId, UUID inspectorId, LocalDate desde, LocalDate hasta) {
		List<EstadoInspeccion> estados = estado == null ? List.of()
				: Arrays.stream(estado.split(",")).map(EstadoInspeccion::valueOf).distinct().toList();
		return new FiltroInspecciones(estados, tipo == null ? null : TipoInspeccion.valueOf(tipo),
				inmuebleId, inspectorId, desde, hasta);
	}

	// Lo pendiente se ordena de lo más próximo a lo más lejano; lo cerrado, al revés.
	boolean soloCerradas() {
		return !estados.isEmpty() && estados.stream().allMatch(EstadoInspeccion::cerrado);
	}
}
