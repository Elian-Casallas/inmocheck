package com.inmocheck.auditoria;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
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

// Auditoría contra la base REAL: los eventos los escribe la función SQL al
// crear la inspección; la API solo los lee. Transacciones que se deshacen.
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@EnabledIf("com.inmocheck.BaseDePrueba#hayBaseConfigurada")
class AuditoriaIntegracionTest {

	private static final String RUTA = "/api/v1/auditoria";
	private static final String ADMIN_PINOS = "a1000000-0000-4000-8000-000000000001";
	private static final String ADMIN_ANDES = "b1000000-0000-4000-8000-000000000001";
	private static final String LAURA = "a1000000-0000-4000-8000-000000000002";
	private static final String APT_302_PINOS = "a3000000-0000-4000-8000-000000000001";

	@Autowired
	private MockMvc mockMvc;

	@Test
	void crearUnaInspeccionQuedaAuditadoConQuienLoHizo() throws Exception {
		String id = programar();

		como(ADMIN_PINOS, get(RUTA).param("recursoId", id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.meta.total").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)))
				.andExpect(jsonPath("$.data[0].recurso").value("INSPECCION"))
				.andExpect(jsonPath("$.data[0].recursoId").value(id))
				.andExpect(jsonPath("$.data[0].accion").isNotEmpty())
				.andExpect(jsonPath("$.data[0].fecha").isNotEmpty())
				.andExpect(jsonPath("$.data[0].actor.nombre").value("Andrea Pinzón"));
	}

	@Test
	void filtraPorRecursoYFecha() throws Exception {
		String id = programar();
		String hoy = OffsetDateTime.now(ZoneOffset.UTC).toLocalDate().toString();

		como(ADMIN_PINOS, get(RUTA).param("recurso", "INSPECCION").param("recursoId", id)
						.param("desde", hoy).param("hasta", hoy))
				.andExpect(jsonPath("$.meta.total").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
		como(ADMIN_PINOS, get(RUTA).param("recurso", "INMUEBLE").param("recursoId", id))
				.andExpect(jsonPath("$.meta.total").value(0));
		como(ADMIN_PINOS, get(RUTA).param("recursoId", id).param("hasta", "2020-01-01"))
				.andExpect(jsonPath("$.meta.total").value(0));
	}

	@Test
	void otraInmobiliariaNoVeElEvento() throws Exception {
		String id = programar();
		como(ADMIN_ANDES, get(RUTA).param("recursoId", id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.meta.total").value(0));
	}

	@Test
	void elInspectorNoVeLaAuditoria() throws Exception {
		como(LAURA, get(RUTA)).andExpect(status().isForbidden());
	}

	@Test
	void unRecursoDesconocidoEs422() throws Exception {
		como(ADMIN_PINOS, get(RUTA).param("recurso", "INFORME"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[0].field").value("recurso"));
	}

	@Test
	void laAuditoriaNoSeEscribePorLaApi() throws Exception {
		como(ADMIN_PINOS, post(RUTA).contentType(MediaType.APPLICATION_JSON).content("{}"))
				.andExpect(status().isMethodNotAllowed());
	}

	// ---------- Ayudas ----------

	private String programar() throws Exception {
		return JsonPath.read(como(ADMIN_PINOS, post("/api/v1/inspecciones").contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"inmuebleId":"%s","inspectorId":"%s","tipo":"SALIDA","programadaPara":"%s"}"""
								.formatted(APT_302_PINOS, LAURA, OffsetDateTime.now(ZoneOffset.UTC).plusDays(1))))
				.andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.data.id");
	}

	private ResultActions como(String usuario, MockHttpServletRequestBuilder peticion) throws Exception {
		return mockMvc.perform(peticion.with(jwt().jwt(token -> token
				.subject(usuario)
				.claim("role", "authenticated"))));
	}
}
