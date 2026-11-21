package com.inmocheck.comun.errores;

import org.springframework.http.HttpStatus;

// 403: hay sesión, pero no hay permiso (rol equivocado o cuenta desactivada).
public class SinPermisoException extends ErrorDeApi {

	public SinPermisoException() {
		this("No tienes permiso para realizar esta acción.", "FORBIDDEN");
	}

	public SinPermisoException(String detalle, String codigo) {
		super(HttpStatus.FORBIDDEN, codigo, "Sin permiso", detalle);
	}

	public static SinPermisoException cuentaInactiva() {
		return new SinPermisoException("Tu cuenta está desactivada.", "CUENTA_INACTIVA");
	}
}
