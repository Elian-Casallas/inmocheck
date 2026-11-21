package com.inmocheck.comun.http;

import com.inmocheck.comun.errores.ErrorDeApi;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

// Convierte los errores en application/problem+json.
// Por ahora solo los errores de negocio (ErrorDeApi); la tarea 5.5 agrega
// validación (422), JSON mal formado (400), 404 y el error inesperado (500).
@RestControllerAdvice
public class ManejadorErrores {

	@ExceptionHandler(ErrorDeApi.class)
	ResponseEntity<Problema> errorDeNegocio(ErrorDeApi error, HttpServletRequest peticion) {
		Problema problema = Problema.de(
				error.estado(), error.codigo(), error.titulo(), error.getMessage(), peticion.getRequestURI());
		return ResponseEntity.status(error.estado())
				.contentType(MediaType.parseMediaType(Problema.TIPO_CONTENIDO))
				.body(problema);
	}
}
