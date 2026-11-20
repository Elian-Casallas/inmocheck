package com.inmocheck.config;

import com.inmocheck.comun.http.EscritorProblemas;
import com.inmocheck.comun.http.Problema;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

// 403: el token es válido, pero el usuario no tiene permiso.
@Component
class RespuestaSinPermiso implements AccessDeniedHandler {

	private final EscritorProblemas escritor;

	RespuestaSinPermiso(EscritorProblemas escritor) {
		this.escritor = escritor;
	}

	@Override
	public void handle(HttpServletRequest peticion, HttpServletResponse respuesta, AccessDeniedException error)
			throws IOException {
		escritor.escribir(respuesta, Problema.de(
				HttpStatus.FORBIDDEN,
				"FORBIDDEN",
				"Sin permiso",
				"No tienes permiso para realizar esta acción.",
				peticion.getRequestURI()));
	}
}
