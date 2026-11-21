package com.inmocheck.inspecciones;

import com.inmocheck.comun.datos.ErroresSql;
import com.inmocheck.comun.datos.ErroresSql.ErrorDeFuncion;
import com.inmocheck.comun.errores.ConflictoException;
import com.inmocheck.comun.errores.NoEncontradoException;
import com.inmocheck.comun.errores.SinPermisoException;
import java.util.Map;
import java.util.function.Supplier;

// Las reglas del flujo (transiciones, versión, plazo, obligatorios) viven en
// las funciones SQL de flujo_inspecciones.sql. Cuando una regla no se cumple,
// la función hace "raise exception 'CODIGO'". Aquí se traduce ese código a
// una respuesta HTTP con un mensaje claro (equivale a traducirErrorDeFlujo
// de inspecciones.service.ts).
final class ErroresDeFlujo {

	private static final Map<String, String> CONFLICTOS = Map.ofEntries(
			Map.entry("VERSION_CONFLICT", "Alguien más modificó estos datos. Recarga para ver la versión actual."),
			Map.entry("TRANSICION_INVALIDA", "La inspección ya no está en un estado que permita esta acción."),
			Map.entry("INSPECCION_CERRADA", "La inspección ya está cerrada y no se puede modificar."),
			Map.entry("INSPECCION_NO_INICIADA", "Primero debes iniciar la inspección."),
			Map.entry("INSPECCION_VENCIDA",
					"El plazo para iniciar esta inspección ya venció. Pide al administrador que la reprograme."),
			Map.entry("INVENTARIO_VACIO",
					"El inmueble no tiene inventario. Agrega espacios y elementos antes de programar."),
			Map.entry("INMUEBLE_NO_DISPONIBLE", "El inmueble no existe o está inactivo."),
			Map.entry("INSPECTOR_NO_DISPONIBLE", "El inspector no existe o está inactivo."),
			Map.entry("MISMO_INSPECTOR", "La inspección ya está asignada a ese inspector."),
			Map.entry("MOTIVO_REQUERIDO", "Escribe el motivo."),
			Map.entry("OBSERVACION_REQUERIDA", "Explica por qué este elemento obligatorio no aplica."));

	private ErroresDeFlujo() {
	}

	// Ejecuta una acción que llama funciones SQL y traduce sus errores.
	static <T> T traducir(Supplier<T> accion) {
		try {
			return accion.get();
		} catch (RuntimeException error) {
			RuntimeException traducido = ErroresSql.errorDeFuncion(error).map(ErroresDeFlujo::traducir).orElse(null);
			throw traducido != null ? traducido : error;
		}
	}

	private static RuntimeException traducir(ErrorDeFuncion error) {
		return switch (error.codigo()) {
			case "NO_ENCONTRADA" -> new NoEncontradoException();
			case "SIN_PERMISO" -> new SinPermisoException();
			case "INSPECCION_INCOMPLETA" -> new ConflictoException(
					"Hay " + (error.detalle() != null ? error.detalle() : "algunos") + " elementos obligatorios sin evaluar.",
					"INSPECCION_INCOMPLETA");
			default -> CONFLICTOS.containsKey(error.codigo())
					? new ConflictoException(CONFLICTOS.get(error.codigo()), error.codigo())
					: null;
		};
	}
}
