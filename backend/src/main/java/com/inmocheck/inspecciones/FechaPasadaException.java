package com.inmocheck.inspecciones;

import com.inmocheck.comun.errores.ErrorDeApi;
import org.springframework.http.HttpStatus;

// 422 FECHA_PASADA: el plazo para iniciar esa fecha ya pasó (RN-16). Mismo
// código y mensaje que el BFF: el formulario lo muestra bajo el campo de fecha.
class FechaPasadaException extends ErrorDeApi {

	FechaPasadaException() {
		super(HttpStatus.UNPROCESSABLE_CONTENT, "FECHA_PASADA", "Fecha inválida",
				"Esa fecha ya pasó. Elige hoy antes de las 7:00 p. m. o un día posterior.");
	}
}
