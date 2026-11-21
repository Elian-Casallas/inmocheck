package com.inmocheck.comun.errores;

import org.springframework.http.HttpStatus;

// Error de negocio que ya sabe cómo responder. El servicio solo dice QUÉ pasó
// (throw new SinPermisoException(...)) y ManejadorErrores arma el problem+json.
// Equivale a AppError de server/http/errores.ts.
public abstract class ErrorDeApi extends RuntimeException {

	private final HttpStatus estado;
	private final String codigo;
	private final String titulo;

	protected ErrorDeApi(HttpStatus estado, String codigo, String titulo, String detalle) {
		super(detalle);
		this.estado = estado;
		this.codigo = codigo;
		this.titulo = titulo;
	}

	public HttpStatus estado() {
		return estado;
	}

	public String codigo() {
		return codigo;
	}

	public String titulo() {
		return titulo;
	}
}
