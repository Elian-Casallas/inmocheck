package com.inmocheck.comun.http;

import com.inmocheck.comun.Limites;
import com.inmocheck.comun.errores.DatosInvalidosException;
import com.inmocheck.comun.errores.ErrorDeApi;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.ErrorResponse;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import tools.jackson.databind.exc.UnrecognizedPropertyException;

// Convierte CUALQUIER error en application/problem+json con la misma forma y
// los mismos códigos que el BFF (server/http/problem.ts). Ningún controller
// necesita try/catch: lanzan la excepción y este manejador responde.
@RestControllerAdvice
public class ManejadorErrores {

	private static final Logger log = LoggerFactory.getLogger(ManejadorErrores.class);

	// ---------- Errores de negocio (lanzados por los servicios) ----------

	@ExceptionHandler(ErrorDeApi.class)
	ResponseEntity<Problema> errorDeNegocio(ErrorDeApi error, HttpServletRequest peticion) {
		Problema problema = Problema.de(
				error.estado(), error.codigo(), error.titulo(), error.getMessage(), peticion.getRequestURI());
		if (error instanceof DatosInvalidosException invalidos) {
			problema = problema.conErrores(invalidos.errores());
		}
		return responder(problema);
	}

	// ---------- 422: los datos no cumplen las reglas (equivale a ZodError) ----------

	// @Valid en el cuerpo JSON o en los parámetros de la URL (paginación, filtros).
	@ExceptionHandler(BindException.class)
	ResponseEntity<Problema> datosInvalidos(BindException error, HttpServletRequest peticion) {
		List<ErrorDeCampo> errores = error.getFieldErrors().stream()
				.map(ManejadorErrores::errorDeCampo)
				.toList();
		return responder(validacion(peticion).conErrores(errores));
	}

	// Restricciones puestas directo sobre un parámetro (@RequestParam @Max(...)).
	@ExceptionHandler(HandlerMethodValidationException.class)
	ResponseEntity<Problema> parametrosInvalidos(HandlerMethodValidationException error, HttpServletRequest peticion) {
		List<ErrorDeCampo> errores = error.getParameterValidationResults().stream()
				.flatMap(resultado -> resultado.getResolvableErrors().stream()
						.map(detalle -> new ErrorDeCampo(
								resultado.getMethodParameter().getParameterName(),
								detalle.getDefaultMessage())))
				.toList();
		return responder(validacion(peticion).conErrores(errores));
	}

	@ExceptionHandler(ConstraintViolationException.class)
	ResponseEntity<Problema> restriccionesInvalidas(ConstraintViolationException error, HttpServletRequest peticion) {
		List<ErrorDeCampo> errores = error.getConstraintViolations().stream()
				.map(violacion -> new ErrorDeCampo(violacion.getPropertyPath().toString(), violacion.getMessage()))
				.toList();
		return responder(validacion(peticion).conErrores(errores));
	}

	// ---------- 400 y 404 por la forma de la petición ----------

	// Un campo que el esquema no conoce (p. ej. "organizacionId" u "organizacion_id")
	// es 422, como .strict() de Zod: nadie cuela datos que el servidor no espera.
	@ExceptionHandler(HttpMessageNotReadableException.class)
	ResponseEntity<Problema> jsonInvalido(HttpMessageNotReadableException error, HttpServletRequest peticion) {
		if (error.getCause() instanceof UnrecognizedPropertyException campoDesconocido) {
			return responder(validacion(peticion).conErrores(List.of(
					new ErrorDeCampo(campoDesconocido.getPropertyName(), "Este campo no está permitido."))));
		}
		return responder(Problema.de(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "Solicitud inválida",
				"El cuerpo debe ser JSON válido.", peticion.getRequestURI()));
	}

	// Un id de la ruta que no es UUID no puede existir: 404, igual que
	// validarId() del BFF. Un parámetro de búsqueda mal escrito: 400.
	@ExceptionHandler(MethodArgumentTypeMismatchException.class)
	ResponseEntity<Problema> tipoEquivocado(MethodArgumentTypeMismatchException error, HttpServletRequest peticion) {
		if (error.getParameter().hasParameterAnnotation(PathVariable.class)) {
			return noEncontrado(peticion);
		}
		return responder(Problema.de(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "Solicitud inválida",
				"El parámetro " + error.getName() + " no tiene un valor válido.", peticion.getRequestURI()));
	}

	@ExceptionHandler(MissingServletRequestParameterException.class)
	ResponseEntity<Problema> parametroFaltante(MissingServletRequestParameterException error, HttpServletRequest peticion) {
		return responder(Problema.de(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "Solicitud inválida",
				"Falta el parámetro " + error.getParameterName() + ".", peticion.getRequestURI()));
	}

	// Ruta que no existe en la API.
	@ExceptionHandler(NoResourceFoundException.class)
	ResponseEntity<Problema> rutaInexistente(HttpServletRequest peticion) {
		return noEncontrado(peticion);
	}

	@ExceptionHandler(HttpRequestMethodNotSupportedException.class)
	ResponseEntity<Problema> metodoNoPermitido(HttpServletRequest peticion) {
		return responder(Problema.de(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED", "Método no permitido",
				"Esta ruta no admite el método " + peticion.getMethod() + ".", peticion.getRequestURI()));
	}

	// ---------- 413 y 415: archivos ----------

	@ExceptionHandler(MaxUploadSizeExceededException.class)
	ResponseEntity<Problema> archivoDemasiadoGrande(HttpServletRequest peticion) {
		return responder(Problema.de(HttpStatus.CONTENT_TOO_LARGE, "FILE_TOO_LARGE", "Archivo demasiado grande",
				"Cada foto puede pesar máximo " + Limites.FOTO_TAMANO_MAXIMO_MB + " MB.", peticion.getRequestURI()));
	}

	@ExceptionHandler(HttpMediaTypeNotSupportedException.class)
	ResponseEntity<Problema> tipoNoAdmitido(HttpServletRequest peticion) {
		return responder(Problema.de(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "UNSUPPORTED_MEDIA_TYPE",
				"Tipo de contenido no admitido", "El formato enviado no es el que espera esta ruta.",
				peticion.getRequestURI()));
	}

	// ---------- 500: lo inesperado ----------

	// El detalle real va al log con el traceId; al cliente nunca le llega SQL,
	// stack trace ni el mensaje interno.
	@ExceptionHandler(Exception.class)
	ResponseEntity<Problema> inesperado(Exception error, HttpServletRequest peticion) {
		if (error instanceof ErrorResponse respuestaDeSpring && respuestaDeSpring.getStatusCode().is4xxClientError()) {
			return errorDeSpring(respuestaDeSpring.getStatusCode(), peticion);
		}
		Problema problema = Problema.de(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Error interno",
				"Ocurrió un error inesperado. Intenta de nuevo.", peticion.getRequestURI());
		log.error("[{}] {} {}", problema.traceId(), peticion.getMethod(), peticion.getRequestURI(), error);
		return responder(problema);
	}

	// ---------- Ayudas ----------

	private static Problema validacion(HttpServletRequest peticion) {
		return Problema.de(HttpStatus.UNPROCESSABLE_CONTENT, "VALIDATION_ERROR", "Datos inválidos",
				"Revisa los campos marcados.", peticion.getRequestURI());
	}

	// Si el valor ni siquiera se pudo convertir (texto donde va un número), el
	// mensaje de Spring es técnico: se cambia por uno claro.
	private static ErrorDeCampo errorDeCampo(FieldError error) {
		String mensaje = error.isBindingFailure() ? "El valor no es válido." : error.getDefaultMessage();
		return new ErrorDeCampo(error.getField(), mensaje);
	}

	private static ResponseEntity<Problema> noEncontrado(HttpServletRequest peticion) {
		return responder(Problema.de(HttpStatus.NOT_FOUND, "NOT_FOUND", "No encontrado",
				"El recurso no existe o no está disponible.", peticion.getRequestURI()));
	}

	private static ResponseEntity<Problema> errorDeSpring(HttpStatusCode estado, HttpServletRequest peticion) {
		HttpStatus conocido = HttpStatus.valueOf(estado.value());
		return responder(Problema.de(conocido, "HTTP_ERROR", conocido.getReasonPhrase(),
				"No se pudo completar la solicitud.", peticion.getRequestURI()));
	}

	private static ResponseEntity<Problema> responder(Problema problema) {
		return ResponseEntity.status(problema.status())
				.contentType(MediaType.parseMediaType(Problema.TIPO_CONTENIDO))
				.body(problema);
	}
}
