package com.inmocheck.comun.datos;

import java.sql.SQLException;

// Reconoce los errores de PostgreSQL que la app traduce a respuestas HTTP
// (equivale a server/repositories/utilidades.ts). La base es quien garantiza
// las reglas (UNIQUE, llaves foráneas); el servicio solo traduce su error.
public final class ErroresSql {

	private static final String VIOLACION_UNICA = "23505";
	private static final String LLAVE_FORANEA_INVALIDA = "23503";

	private ErroresSql() {
	}

	public static boolean esViolacionUnica(Throwable error) {
		return VIOLACION_UNICA.equals(codigoSql(error));
	}

	public static boolean esLlaveForaneaInvalida(Throwable error) {
		return LLAVE_FORANEA_INVALIDA.equals(codigoSql(error));
	}

	// Spring envuelve el error de PostgreSQL: se busca en la cadena de causas.
	private static String codigoSql(Throwable error) {
		for (Throwable actual = error; actual != null; actual = actual.getCause()) {
			if (actual instanceof SQLException sql && sql.getSQLState() != null) {
				return sql.getSQLState();
			}
		}
		return null;
	}
}
