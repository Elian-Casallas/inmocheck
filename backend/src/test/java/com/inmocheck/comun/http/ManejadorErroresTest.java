package com.inmocheck.comun.http;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.inmocheck.comun.errores.ConflictoException;
import com.inmocheck.comun.errores.NoEncontradoException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

// Cada error del contrato (docs/contratos/api.md) responde con su código HTTP,
// su "code" y la forma problem+json del BFF.
@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Import(ManejadorErroresTest.Configuracion.class)
class ManejadorErroresTest {

	private static final String BASE = "/api/v1/prueba/errores";

	@Autowired
	private MockMvc mockMvc;

	@Test
	void noEncontradoResponde404() throws Exception {
		hacer(get(BASE + "/no-encontrado"))
				.andExpect(status().isNotFound())
				.andExpect(content().contentTypeCompatibleWith("application/problem+json"))
				.andExpect(jsonPath("$.code").value("NOT_FOUND"))
				.andExpect(jsonPath("$.type").value("https://inmocheck.example/errors/not-found"))
				.andExpect(jsonPath("$.instance").value(BASE + "/no-encontrado"))
				.andExpect(jsonPath("$.traceId").isNotEmpty())
				.andExpect(jsonPath("$.errors").doesNotExist());
	}

	@Test
	void conflictoResponde409ConSuCodigo() throws Exception {
		hacer(get(BASE + "/conflicto"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("INSPECCION_INCOMPLETA"))
				.andExpect(jsonPath("$.detail").value("Hay 2 elementos obligatorios sin evaluar."));
	}

	@Test
	void cuerpoInvalidoResponde422ConErroresPorCampo() throws Exception {
		hacer(post(BASE + "/cuerpo").contentType(MediaType.APPLICATION_JSON)
				.content("{\"nombre\":\"\",\"email\":\"no-es-correo\",\"telefono\":\"\"}"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
				.andExpect(jsonPath("$.detail").value("Revisa los campos marcados."))
				.andExpect(jsonPath("$.errors[*].field").value(containsInAnyOrder("nombre", "email", "telefono")))
				.andExpect(jsonPath("$.errors[?(@.field=='nombre')].message").value("Escribe el nombre."))
				.andExpect(jsonPath("$.errors[?(@.field=='email')].message").value("Escribe un correo válido."));
	}

	@Test
	void unaReglaSinMensajePropioRespondeEnEspanol() throws Exception {
		hacer(post(BASE + "/cuerpo").contentType(MediaType.APPLICATION_JSON)
				.content("{\"nombre\":\"Ana\",\"email\":\"ana@prueba.co\",\"telefono\":\"\"}"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[0].field").value("telefono"))
				.andExpect(jsonPath("$.errors[0].message").value("no debe estar vacío"));
	}

	@Test
	void jsonRotoResponde400() throws Exception {
		hacer(post(BASE + "/cuerpo").contentType(MediaType.APPLICATION_JSON).content("{nombre:"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("BAD_REQUEST"))
				.andExpect(jsonPath("$.detail").value("El cuerpo debe ser JSON válido."));
	}

	@Test
	void idQueNoEsUuidResponde404SinRevelarNada() throws Exception {
		hacer(get(BASE + "/recursos/abc"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.code").value("NOT_FOUND"));
	}

	@Test
	void parametroDeBusquedaMalEscritoResponde400() throws Exception {
		hacer(get(BASE + "/numero").param("valor", "abc"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("BAD_REQUEST"));
	}

	@Test
	void rutaInexistenteResponde404() throws Exception {
		hacer(get("/api/v1/no-existe"))
				.andExpect(status().isNotFound())
				.andExpect(content().contentTypeCompatibleWith("application/problem+json"))
				.andExpect(jsonPath("$.code").value("NOT_FOUND"));
	}

	@Test
	void metodoEquivocadoResponde405() throws Exception {
		hacer(post(BASE + "/no-encontrado"))
				.andExpect(status().isMethodNotAllowed())
				.andExpect(jsonPath("$.code").value("METHOD_NOT_ALLOWED"));
	}

	@Test
	void formatoEquivocadoResponde415() throws Exception {
		hacer(post(BASE + "/cuerpo").contentType(MediaType.TEXT_PLAIN).content("hola"))
				.andExpect(status().isUnsupportedMediaType())
				.andExpect(jsonPath("$.code").value("UNSUPPORTED_MEDIA_TYPE"));
	}

	@Test
	void archivoDemasiadoGrandeResponde413() throws Exception {
		hacer(get(BASE + "/archivo-grande"))
				.andExpect(status().isContentTooLarge())
				.andExpect(jsonPath("$.code").value("FILE_TOO_LARGE"))
				.andExpect(jsonPath("$.detail").value("Cada foto puede pesar máximo 10 MB."));
	}

	@Test
	void errorInesperadoResponde500SinFiltrarElDetalleInterno() throws Exception {
		hacer(get(BASE + "/inesperado"))
				.andExpect(status().isInternalServerError())
				.andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
				.andExpect(jsonPath("$.detail").value("Ocurrió un error inesperado. Intenta de nuevo."))
				.andExpect(content().string(not(containsString("select"))));
	}

	// ---------- Paginación ----------

	@Test
	void paginaConDataYMeta() throws Exception {
		hacer(get(BASE + "/lista").param("page", "3").param("pageSize", "5"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.length()").value(2))
				.andExpect(jsonPath("$.data[0]").value(11))
				.andExpect(jsonPath("$.meta.page").value(3))
				.andExpect(jsonPath("$.meta.pageSize").value(5))
				.andExpect(jsonPath("$.meta.total").value(12))
				.andExpect(jsonPath("$.meta.totalPages").value(3));
	}

	@Test
	void sinParametrosUsaPagina1De20() throws Exception {
		hacer(get(BASE + "/lista"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.meta.page").value(1))
				.andExpect(jsonPath("$.meta.pageSize").value(20))
				.andExpect(jsonPath("$.data.length()").value(12));
	}

	@Test
	void paginaFueraDeRangoEs200ConListaVacia() throws Exception {
		hacer(get(BASE + "/lista").param("page", "9"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.length()").value(0));
	}

	@Test
	void tamanoDePaginaMayorA100Responde422() throws Exception {
		hacer(get(BASE + "/lista").param("pageSize", "101"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[0].field").value("pageSize"))
				.andExpect(jsonPath("$.errors[0].message").value("El tamaño de página puede ser máximo 100."));
	}

	@Test
	void paginaQueNoEsNumeroResponde422ConMensajeClaro() throws Exception {
		hacer(get(BASE + "/lista").param("page", "abc"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[0].field").value("page"))
				.andExpect(jsonPath("$.errors[0].message").value("El valor no es válido."));
	}

	private ResultActions hacer(MockHttpServletRequestBuilder peticion) throws Exception {
		return mockMvc.perform(peticion.with(jwt()));
	}

	@TestConfiguration
	static class Configuracion {

		@Bean
		RutasDeErrores rutasDeErrores() {
			return new RutasDeErrores();
		}
	}

	record DatosDePrueba(
			@NotBlank(message = "Escribe el nombre.") String nombre,
			@NotBlank(message = "Escribe el correo.") @Email(message = "Escribe un correo válido.") String email,
			// Sin mensaje propio: prueba que el de defecto sale en español.
			@NotBlank String telefono) {
	}

	@RestController
	static class RutasDeErrores {

		private static final List<Integer> NUMEROS = IntStream.rangeClosed(1, 12).boxed().toList();

		@GetMapping(BASE + "/no-encontrado")
		void noEncontrado() {
			throw new NoEncontradoException();
		}

		@GetMapping(BASE + "/conflicto")
		void conflicto() {
			throw new ConflictoException("Hay 2 elementos obligatorios sin evaluar.", "INSPECCION_INCOMPLETA");
		}

		@PostMapping(BASE + "/cuerpo")
		DatosDePrueba cuerpo(@Valid @RequestBody DatosDePrueba datos) {
			return datos;
		}

		@GetMapping(BASE + "/recursos/{id}")
		String recurso(@PathVariable UUID id) {
			return id.toString();
		}

		@GetMapping(BASE + "/numero")
		int numero(@RequestParam int valor) {
			return valor;
		}

		@GetMapping(BASE + "/archivo-grande")
		void archivoGrande() {
			throw new MaxUploadSizeExceededException(10L * 1024 * 1024);
		}

		@GetMapping(BASE + "/inesperado")
		void inesperado() {
			throw new IllegalStateException("select * from perfiles falló en la línea 3");
		}

		@GetMapping(BASE + "/lista")
		Pagina<Integer> lista(@Valid ParametrosPagina pagina) {
			List<Integer> filas = NUMEROS.stream()
					.skip(pagina.desde())
					.limit(pagina.pageSize())
					.toList();
			return Pagina.de(filas, NUMEROS.size(), pagina);
		}
	}
}
