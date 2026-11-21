package com.inmocheck.comun.datos;

import java.sql.SQLException;
import java.util.Optional;
import org.postgresql.util.PSQLException;
import org.postgresql.util.ServerErrorMessage;

// Reconoce los errores de PostgreSQL que la app traduce a respuestas HTTP
// (equivale a server/repositories/utilidades.ts). La base es quien garantiza
// las reglas (UNIQUE, llaves foráneas, funciones del flujo); el servicio solo
// traduce su error.
public final class ErroresSql {

	private static final String VIOLACION_UNICA = "23505";
	private static final String LLAVE_FORANEA_INVALIDA = "23503";
	// SQLSTATE de "raise exception 'CODIGO'" en PL/pgSQL.
	private static final String RAISE_EXCEPTION = "P0001";

	private ErroresSql() {
	}

	// Código y detalle que lanzó una función SQL (p. ej. "VERSION_CONFLICT").
	public record ErrorDeFuncion(String codigo, String detalle) {
	}

	public static boolean esViolacionUnica(Throwable error) {
		return VIOLACION_UNICA.equals(codigoSql(error));
	}

	public static boolean esLlaveForaneaInvalida(Throwable error) {
		return LLAVE_FORANEA_INVALIDA.equals(codigoSql(error));
	}

	public static Optional<ErrorDeFuncion> errorDeFuncion(Throwable error) {
		for (Throwable actual = error; actual != null; actual = actual.getCause()) {
			if (actual instanceof PSQLException psql && RAISE_EXCEPTION.equals(psql.getSQLState())) {
				ServerErrorMessage mensaje = psql.getServerErrorMessage();
				if (mensaje != null) {
					return Optional.of(new ErrorDeFuncion(mensaje.getMessage(), mensaje.getDetail()));
				}
			}
		}
		return Optional.empty();
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
