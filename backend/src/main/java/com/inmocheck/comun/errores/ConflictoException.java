package com.inmocheck.comun.errores;

import org.springframework.http.HttpStatus;

// 409: código duplicado, transición no permitida, conflicto de versión o
// inspección incompleta. El código dice cuál (p. ej. INSPECCION_INCOMPLETA).
public class ConflictoException extends ErrorDeApi {

	public ConflictoException(String detalle) {
		this(detalle, "CONFLICT");
	}

	public ConflictoException(String detalle, String codigo) {
		super(HttpStatus.CONFLICT, codigo, "Conflicto", detalle);
	}
}
