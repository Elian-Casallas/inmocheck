package com.inmocheck.comun.errores;

import org.springframework.http.HttpStatus;

// 400: la petición no tiene la forma esperada (JSON roto, parámetro mal escrito).
public class SolicitudInvalidaException extends ErrorDeApi {

	public SolicitudInvalidaException() {
		this("La solicitud no tiene el formato esperado.");
	}

	public SolicitudInvalidaException(String detalle) {
		super(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "Solicitud inválida", detalle);
	}
}
