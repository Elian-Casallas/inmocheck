package com.inmocheck.comun.errores;

import com.inmocheck.comun.http.ErrorDeCampo;
import java.util.List;
import org.springframework.http.HttpStatus;

// 422 con errores por campo, cuando la validación no la puede hacer @Valid
// (por ejemplo, un PATCH donde solo se revisan los campos que llegaron).
public class DatosInvalidosException extends ErrorDeApi {

	private final List<ErrorDeCampo> errores;

	public DatosInvalidosException(List<ErrorDeCampo> errores) {
		super(HttpStatus.UNPROCESSABLE_CONTENT, "VALIDATION_ERROR", "Datos inválidos", "Revisa los campos marcados.");
		this.errores = List.copyOf(errores);
	}

	public List<ErrorDeCampo> errores() {
		return errores;
	}
}
