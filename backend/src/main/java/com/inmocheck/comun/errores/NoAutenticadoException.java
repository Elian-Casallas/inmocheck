package com.inmocheck.comun.errores;

import org.springframework.http.HttpStatus;

// 401: no hay sesión válida.
public class NoAutenticadoException extends ErrorDeApi {

	public NoAutenticadoException() {
		super(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "No autenticado", "Debes iniciar sesión.");
	}
}
