package com.inmocheck.inspecciones;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

// Realizar una inspección (detalles y finalización) contra la base REAL y
// sus funciones SQL guardar_detalle y finalizar_inspeccion. Cada prueba
// programa e inicia su propia inspección y todo se DESHACE al final.
// Cuando una función SQL falla la transacción queda anulada: la petición que
// debe fallar va de última en cada prueba.
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@EnabledIf("com.inmocheck.BaseDePrueba#hayBaseConfigurada")
class RealizarInspeccionIntegracionTest {

	private static final String RUTA = "/api/v1/inspecciones";
	private static final String ADMIN_PINOS = "a1000000-0000-4000-8000-000000000001";
	private static final String LAURA = "a1000000-0000-4000-8000-000000000002";
	private static final String CARLOS = "a1000000-0000-4000-8000-000000000003";
	private static final String APT_302_PINOS = "a3000000-0000-4000-8000-000000000001";

	@Autowired
	private MockMvc mockMvc;

	// ---------- Ver los elementos ----------

	@Test
	void laInspectoraVeLosElementosConElProgreso() throws Exception {
		String id = programarEIniciar();
		como(LAURA, get(RUTA + "/" + id + "/detalles"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.length()").value(greaterThan(0)))
				.andExpect(jsonPath("$.data[0].espacioNombre").isNotEmpty())
				.andExpect(jsonPath("$.data[0].version").value(1))
				.andExpect(jsonPath("$.data[0].evidencias.length()").value(0))
				.andExpect(jsonPath("$.meta.evaluados").value(0))
				.andExpect(jsonPath("$.meta.obligatoriosPendientes").value(greaterThan(0)));
		como(ADMIN_PINOS, get(RUTA + "/" + id + "/detalles")).andExpect(status().isOk());
	}

	@Test
	void otroInspectorNoVeLosElementos() throws Exception {
		String id = programarEIniciar();
		como(CARLOS, get(RUTA + "/" + id + "/detalles")).andExpect(status().isNotFound());
	}

	// ---------- Guardar un elemento (guardar_detalle) ----------

	@Test
	void guardaUnElementoYSubeLaVersion() throws Exception {
		String id = programarEIniciar();
		String detalle = detalles(id).get(0).get("id").toString();

		como(LAURA, patch(RUTA + "/" + id + "/detalles/" + detalle).contentType(MediaType.APPLICATION_JSON)
						.content("{\"estado\":\"BUENO\",\"observacion\":\"  Sin novedad  \",\"version\":1}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.id").value(detalle))
				.andExpect(jsonPath("$.data.estado").value("BUENO"))
				.andExpect(jsonPath("$.data.observacion").value("Sin novedad"))
				.andExpect(jsonPath("$.data.version").value(2));

		// Otra pestaña con la versión vieja no pisa el cambio.
		como(LAURA, patch(RUTA + "/" + id + "/detalles/" + detalle).contentType(MediaType.APPLICATION_JSON)
						.content("{\"estado\":\"DANADO\",\"version\":1}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("VERSION_CONFLICT"));
	}

	@Test
	void unObligatorioNoAplicaExigeObservacion() throws Exception {
		String id = programarEIniciar();
		String obligatorio = detalles(id).stream()
				.filter(detalle -> Boolean.TRUE.equals(detalle.get("obligatorio")))
				.findFirst().orElseThrow().get("id").toString();

		como(LAURA, patch(RUTA + "/" + id + "/detalles/" + obligatorio).contentType(MediaType.APPLICATION_JSON)
						.content("{\"estado\":\"NO_APLICA\",\"observacion\":\"   \",\"version\":1}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("OBSERVACION_REQUERIDA"));
	}

	@Test
	void noSeEvaluaSinIniciar() throws Exception {
		String id = programar();
		String detalle = detalles(id).get(0).get("id").toString();
		como(LAURA, patch(RUTA + "/" + id + "/detalles/" + detalle).contentType(MediaType.APPLICATION_JSON)
						.content("{\"estado\":\"BUENO\",\"version\":1}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("INSPECCION_NO_INICIADA"));
	}

	@Test
	void unEstadoInvalidoOSinEstadoEs422() throws Exception {
		String id = programarEIniciar();
		String detalle = detalles(id).get(0).get("id").toString();
		como(LAURA, patch(RUTA + "/" + id + "/detalles/" + detalle).contentType(MediaType.APPLICATION_JSON)
						.content("{\"version\":1}"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[0].message").value("Selecciona un estado."));
		como(LAURA, patch(RUTA + "/" + id + "/detalles/" + detalle).contentType(MediaType.APPLICATION_JSON)
						.content("{\"estado\":\"ROTO\",\"version\":1}"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[0].field").value("estado"));
	}

	@Test
	void elAdminNoEvaluaYOtroInspectorTampoco() throws Exception {
		String id = programarEIniciar();
		String detalle = detalles(id).get(0).get("id").toString();
		como(ADMIN_PINOS, patch(RUTA + "/" + id + "/detalles/" + detalle).contentType(MediaType.APPLICATION_JSON)
						.content("{\"estado\":\"BUENO\",\"version\":1}"))
				.andExpect(status().isForbidden());
		como(CARLOS, patch(RUTA + "/" + id + "/detalles/" + detalle).contentType(MediaType.APPLICATION_JSON)
						.content("{\"estado\":\"BUENO\",\"version\":1}"))
				.andExpect(status().isNotFound());
	}

	// ---------- Finalizar (finalizar_inspeccion) ----------

	@Test
	void noSeFinalizaConObligatoriosPendientes() throws Exception {
		String id = programarEIniciar();
		int pendientes = JsonPath.read(como(LAURA, get(RUTA + "/" + id + "/detalles"))
				.andReturn().getResponse().getContentAsString(), "$.meta.obligatoriosPendientes");

		como(LAURA, post(RUTA + "/" + id + "/finalizacion").contentType(MediaType.APPLICATION_JSON).content("{\"version\":2}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("INSPECCION_INCOMPLETA"))
				.andExpect(jsonPath("$.detail").value("Hay " + pendientes + " elementos obligatorios sin evaluar."));
	}

	@Test
	void finalizaCuandoTodoEstaEvaluadoYLuegoQuedaCerrada() throws Exception {
		String id = programarEIniciar();
		List<Map<String, Object>> elementos = detalles(id);
		for (Map<String, Object> detalle : elementos) {
			como(LAURA, patch(RUTA + "/" + id + "/detalles/" + detalle.get("id")).contentType(MediaType.APPLICATION_JSON)
							.content("{\"estado\":\"BUENO\",\"version\":1}"))
					.andExpect(status().isOk());
		}

		como(LAURA, post(RUTA + "/" + id + "/finalizacion").contentType(MediaType.APPLICATION_JSON).content("{\"version\":2}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.estado").value("FINALIZADA"))
				.andExpect(jsonPath("$.data.finalizadaEn").isNotEmpty())
				.andExpect(jsonPath("$.data.progreso.obligatoriosPendientes").value(0))
				.andExpect(jsonPath("$.data.progreso.evaluados").value(elementos.size()));

		// Una inspección cerrada no se modifica, ni con una petición manual (CA-10).
		como(LAURA, patch(RUTA + "/" + id + "/detalles/" + elementos.get(0).get("id")).contentType(MediaType.APPLICATION_JSON)
						.content("{\"estado\":\"DANADO\",\"version\":2}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("INSPECCION_CERRADA"));
	}

	@Test
	void elAdminNoPuedeFinalizar() throws Exception {
		String id = programarEIniciar();
		como(ADMIN_PINOS, post(RUTA + "/" + id + "/finalizacion").contentType(MediaType.APPLICATION_JSON).content("{\"version\":2}"))
				.andExpect(status().isForbidden());
	}

	// ---------- Ayudas ----------

	private String programar() throws Exception {
		String cuerpo = como(ADMIN_PINOS, post(RUTA).contentType(MediaType.APPLICATION_JSON).content("""
						{"inmuebleId":"%s","inspectorId":"%s","tipo":"SALIDA","programadaPara":"%s"}"""
						.formatted(APT_302_PINOS, LAURA, OffsetDateTime.now(ZoneOffset.UTC).plusDays(1))))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		return JsonPath.read(cuerpo, "$.data.id");
	}

	private String programarEIniciar() throws Exception {
		String id = programar();
		como(LAURA, post(RUTA + "/" + id + "/inicio").contentType(MediaType.APPLICATION_JSON).content("{\"version\":1}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.estado").value(startsWith("EN_PROCESO")));
		return id;
	}

	private List<Map<String, Object>> detalles(String id) throws Exception {
		String cuerpo = como(LAURA, get(RUTA + "/" + id + "/detalles"))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
		return JsonPath.read(cuerpo, "$.data");
	}

	private ResultActions como(String usuario, MockHttpServletRequestBuilder peticion) throws Exception {
		return mockMvc.perform(peticion.with(jwt().jwt(token -> token
				.subject(usuario)
				.claim("role", "authenticated"))));
	}
}
