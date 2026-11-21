package com.inmocheck.comun.errores;

import org.springframework.http.HttpStatus;

// 404: no existe, o es de otra organización. Se responde igual en ambos casos
// para no revelar que el recurso existe.
public class NoEncontradoException extends ErrorDeApi {

	public NoEncontradoException() {
		super(HttpStatus.NOT_FOUND, "NOT_FOUND", "No encontrado", "El recurso no existe o no está disponible.");
	}
}
