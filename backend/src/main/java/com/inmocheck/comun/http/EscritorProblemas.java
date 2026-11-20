package com.inmocheck.comun.http;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

// Escribe un Problema directamente en la respuesta. Lo usan los filtros de
// seguridad, que responden antes de llegar a un controller.
@Component
public class EscritorProblemas {

	private final JsonMapper json;

	public EscritorProblemas(JsonMapper json) {
		this.json = json;
	}

	public void escribir(HttpServletResponse respuesta, Problema problema) throws IOException {
		respuesta.setStatus(problema.status());
		respuesta.setContentType(Problema.TIPO_CONTENIDO);
		respuesta.setCharacterEncoding(StandardCharsets.UTF_8.name());
		json.writeValue(respuesta.getOutputStream(), problema);
	}
}
