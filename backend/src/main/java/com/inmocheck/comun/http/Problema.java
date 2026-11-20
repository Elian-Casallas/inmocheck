package com.inmocheck.comun.http;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;

// Cuerpo de error application/problem+json (RFC 9457) con la MISMA forma que
// el BFF de Next.js (server/http/problem.ts), para que el front no note el
// cambio: type, title, status, detail, instance, code, traceId y errors.
@JsonInclude(JsonInclude.Include.NON_NULL)
public record Problema(
		String type,
		String title,
		int status,
		String detail,
		String instance,
		String code,
		String traceId,
		List<ErrorDeCampo> errors) {

	public static final String TIPO_CONTENIDO = "application/problem+json";
	private static final String BASE_TIPOS = "https://inmocheck.example/errors/";

	public static Problema de(HttpStatus estado, String codigo, String titulo, String detalle, String ruta) {
		return new Problema(
				BASE_TIPOS + codigo.toLowerCase(Locale.ROOT).replace('_', '-'),
				titulo,
				estado.value(),
				detalle,
				ruta,
				codigo,
				UUID.randomUUID().toString(),
				null);
	}
}
