package com.inmocheck.config;

import com.inmocheck.comun.http.EscritorProblemas;
import com.inmocheck.comun.http.Problema;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

// 401: no llegó token, o llegó uno inválido (mal firmado, vencido, de otro
// proyecto). El motivo exacto no se le dice al cliente.
@Component
class RespuestaNoAutenticado implements AuthenticationEntryPoint {

	private final EscritorProblemas escritor;

	RespuestaNoAutenticado(EscritorProblemas escritor) {
		this.escritor = escritor;
	}

	@Override
	public void commence(HttpServletRequest peticion, HttpServletResponse respuesta, AuthenticationException error)
			throws IOException {
		respuesta.setHeader(HttpHeaders.WWW_AUTHENTICATE, "Bearer");
		escritor.escribir(respuesta, Problema.de(
				HttpStatus.UNAUTHORIZED,
				"UNAUTHENTICATED",
				"No autenticado",
				"Debes iniciar sesión.",
				peticion.getRequestURI()));
	}
}
