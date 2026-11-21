package com.inmocheck.comparacion;

import com.inmocheck.inspecciones.InspeccionesDtos.DetalleRespuesta;
import com.inmocheck.inspecciones.InspeccionesDtos.EstadoElemento;
import com.inmocheck.inspecciones.InspeccionesDtos.Evidencia;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

// Compara los elementos de una entrada y una salida del mismo inmueble.
// Función pura: no toca la base ni HTTP, igual que lib/comparacion.ts.
//
// Empareja por elementoId (el id estable del elemento del inventario):
//   - está en las dos y el estado es igual      → SIN_CAMBIO
//   - está en las dos y el estado es distinto   → CAMBIO
//   - está solo en una (se agregó o se retiró)  → NO_COMPARABLE
// Un CAMBIO es solo "el estado registrado difiere": NO dice quién lo causó (RN-13).
final class Comparador {

	enum Resultado { SIN_CAMBIO, CAMBIO, NO_COMPARABLE }

	record Lado(EstadoElemento estado, String observacion, List<UUID> evidenciaIds) {
	}

	record ElementoComparado(UUID elementoId, String espacio, String nombre, Lado entrada, Lado salida,
			Resultado resultado) {
	}

	record Resumen(int elementosComparados, int cambios, int noComparables) {
	}

	record Comparacion(Resumen resumen, List<ElementoComparado> elementos) {
	}

	private Comparador() {
	}

	static Comparacion comparar(List<DetalleRespuesta> entrada, List<DetalleRespuesta> salida) {
		Map<UUID, DetalleRespuesta> entradaPorElemento = new LinkedHashMap<>();
		entrada.forEach(detalle -> entradaPorElemento.put(detalle.elementoId(), detalle));
		Set<UUID> idsEnSalida = salida.stream().map(DetalleRespuesta::elementoId).collect(Collectors.toSet());

		List<ElementoComparado> elementos = new ArrayList<>();
		for (DetalleRespuesta detalleSalida : salida) {
			DetalleRespuesta detalleEntrada = entradaPorElemento.get(detalleSalida.elementoId());
			Resultado resultado = detalleEntrada == null ? Resultado.NO_COMPARABLE
					: detalleEntrada.estado() == detalleSalida.estado() ? Resultado.SIN_CAMBIO : Resultado.CAMBIO;
			elementos.add(new ElementoComparado(detalleSalida.elementoId(), detalleSalida.espacioNombre(),
					detalleSalida.elementoNombre(), detalleEntrada == null ? null : lado(detalleEntrada),
					lado(detalleSalida), resultado));
		}

		// Elementos que estaban en la entrada y ya no están en la salida.
		for (DetalleRespuesta detalleEntrada : entrada) {
			if (!idsEnSalida.contains(detalleEntrada.elementoId())) {
				elementos.add(new ElementoComparado(detalleEntrada.elementoId(), detalleEntrada.espacioNombre(),
						detalleEntrada.elementoNombre(), lado(detalleEntrada), null, Resultado.NO_COMPARABLE));
			}
		}

		int cambios = contar(elementos, Resultado.CAMBIO);
		int noComparables = contar(elementos, Resultado.NO_COMPARABLE);
		return new Comparacion(new Resumen(elementos.size() - noComparables, cambios, noComparables), elementos);
	}

	private static Lado lado(DetalleRespuesta detalle) {
		return new Lado(detalle.estado(), detalle.observacion(),
				detalle.evidencias().stream().map(Evidencia::id).toList());
	}

	private static int contar(List<ElementoComparado> elementos, Resultado resultado) {
		return (int) elementos.stream().filter(elemento -> elemento.resultado() == resultado).count();
	}
}
