package com.inmocheck.comun.errores;

import org.springframework.http.HttpStatus;

// 503: un servicio del que dependemos no está disponible o no está configurado.
public class ServicioNoDisponibleException extends ErrorDeApi {

	public ServicioNoDisponibleException(String detalle) {
		this(detalle, "DEPENDENCY_UNAVAILABLE");
	}

	public ServicioNoDisponibleException(String detalle, String codigo) {
		super(HttpStatus.SERVICE_UNAVAILABLE, codigo, "Servicio no disponible", detalle);
	}
}
