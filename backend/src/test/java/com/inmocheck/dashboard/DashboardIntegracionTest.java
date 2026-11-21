package com.inmocheck.dashboard;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
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
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

// Resumen del administrador contra la base REAL, en transacciones que se deshacen.
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@EnabledIf("com.inmocheck.BaseDePrueba#hayBaseConfigurada")
class DashboardIntegracionTest {

	private static final String RUTA = "/api/v1/dashboard/resumen";
	private static final String ADMIN_PINOS = "a1000000-0000-4000-8000-000000000001";
	private static final String ADMIN_ANDES = "b1000000-0000-4000-8000-000000000001";
	private static final String LAURA = "a1000000-0000-4000-8000-000000000002";
	private static final String APT_302_PINOS = "a3000000-0000-4000-8000-000000000001";

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private JdbcClient jdbcSinRls;

	@Test
	void unaInspeccionProgramadaSumaAPendientesYApareceEnProximas() throws Exception {
		int antes = pendientes(ADMIN_PINOS);
		String id = programar();

		assertThat(pendientes(ADMIN_PINOS)).isEqualTo(antes + 1);
		como(ADMIN_PINOS, get(RUTA))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.inmueblesActivos").isNumber())
				.andExpect(jsonPath("$.data.inspectoresActivos").isNumber())
				.andExpect(jsonPath("$.data.noRealizadas[*].id").value(not(hasItem(id))));
		// Otra inmobiliaria no la cuenta ni la ve.
		como(ADMIN_ANDES, get(RUTA))
				.andExpect(jsonPath("$.data.proximas[*].id").value(not(hasItem(id))))
				.andExpect(jsonPath("$.data.noRealizadas[*].id").value(not(hasItem(id))));
	}

	@Test
	void unaPendienteCuyoPlazoPasoVaEnNoRealizadasYNoEnProximas() throws Exception {
		String id = programar();
		// La API no deja programar en el pasado (RN-16): se mueve a mano.
		jdbcSinRls.sql("reset role").update();
		jdbcSinRls.sql("update public.inspecciones set programada_para = now() - interval '2 days' where id = :id::uuid")
				.param("id", id).update();

		como(ADMIN_PINOS, get(RUTA))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.noRealizadas[*].id").value(hasItem(id)))
				.andExpect(jsonPath("$.data.proximas[*].id").value(not(hasItem(id))))
				.andExpect(jsonPath("$.data.noRealizadas[?(@.id=='" + id + "')].inmueble.codigo").value("APT-302"));
	}

	@Test
	void elRangoDeFechasFiltraLosConteos() throws Exception {
		String manana = OffsetDateTime.now(ZoneOffset.UTC).plusDays(1).toLocalDate().toString();
		int antes = pendientesEntre(manana);
		programar();
		assertThat(pendientesEntre(manana)).isEqualTo(antes + 1);
		// Un rango que no incluye mañana no la cuenta.
		como(ADMIN_PINOS, get(RUTA).param("desde", "2020-01-01").param("hasta", "2020-01-31"))
				.andExpect(jsonPath("$.data.inspecciones.pendientes").value(0));
	}

	@Test
	void elInspectorNoVeElResumen() throws Exception {
		como(LAURA, get(RUTA)).andExpect(status().isForbidden());
	}

	@Test
	void unaFechaMalEscritaEs400() throws Exception {
		// docs/contratos/api.md: un parámetro mal formado es 400.
		como(ADMIN_PINOS, get(RUTA).param("desde", "ayer"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("BAD_REQUEST"));
	}

	// ---------- Ayudas ----------

	private int pendientes(String usuario) throws Exception {
		return JsonPath.read(como(usuario, get(RUTA)).andReturn().getResponse().getContentAsString(),
				"$.data.inspecciones.pendientes");
	}

	private int pendientesEntre(String dia) throws Exception {
		return JsonPath.read(como(ADMIN_PINOS, get(RUTA).param("desde", dia).param("hasta", dia))
				.andReturn().getResponse().getContentAsString(), "$.data.inspecciones.pendientes");
	}

	private String programar() throws Exception {
		return JsonPath.read(como(ADMIN_PINOS, post("/api/v1/inspecciones").contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"inmuebleId":"%s","inspectorId":"%s","tipo":"SALIDA","programadaPara":"%s"}"""
								.formatted(APT_302_PINOS, LAURA,
										OffsetDateTime.now(ZoneOffset.UTC).plusDays(1).withHour(15).withMinute(0))))
				.andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.data.id");
	}

	private ResultActions como(String usuario, MockHttpServletRequestBuilder peticion) throws Exception {
		return mockMvc.perform(peticion.with(jwt().jwt(token -> token
				.subject(usuario)
				.claim("role", "authenticated"))));
	}
}
