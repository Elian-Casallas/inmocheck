package com.inmocheck.comparacion;

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
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

// Comparación contra la base REAL. Cada prueba arma una entrada y una salida
// finalizadas del mismo inmueble (en una transacción que se DESHACE al final)
// y compara: en la salida, el primer elemento queda "Dañado".
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@EnabledIf("com.inmocheck.BaseDePrueba#hayBaseConfigurada")
class ComparacionIntegracionTest {

	private static final String RUTA = "/api/v1/inspecciones";
	private static final String ADMIN_PINOS = "a1000000-0000-4000-8000-000000000001";
	private static final String ADMIN_ANDES = "b1000000-0000-4000-8000-000000000001";
	private static final String LAURA = "a1000000-0000-4000-8000-000000000002";
	private static final String CARLOS = "a1000000-0000-4000-8000-000000000003";
	private static final String APT_302_PINOS = "a3000000-0000-4000-8000-000000000001";

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private JdbcClient jdbcSinRls;

	@Test
	void detectaElCambioEntreLaEntradaYLaSalida() throws Exception {
		Par par = entradaYSalida();

		como(ADMIN_PINOS, get(RUTA + "/" + par.salida() + "/comparacion").param("contra", par.entrada()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.salidaId").value(par.salida()))
				.andExpect(jsonPath("$.data.entradaId").value(par.entrada()))
				.andExpect(jsonPath("$.data.resumen.cambios").value(1))
				.andExpect(jsonPath("$.data.resumen.noComparables").value(0))
				.andExpect(jsonPath("$.data.elementos[?(@.resultado=='CAMBIO')].entrada.estado").value("BUENO"))
				.andExpect(jsonPath("$.data.elementos[?(@.resultado=='CAMBIO')].salida.estado").value("DANADO"));
		// La inspectora de las dos también la puede ver.
		como(LAURA, get(RUTA + "/" + par.salida() + "/comparacion").param("contra", par.entrada()))
				.andExpect(status().isOk());
	}

	@Test
	void unaEntradaNoSeComparaComoSalida() throws Exception {
		Par par = entradaYSalida();
		como(ADMIN_PINOS, get(RUTA + "/" + par.entrada() + "/comparacion").param("contra", par.salida()))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("COMPARACION_INVALIDA"));
	}

	@Test
	void sinContraOConUnIdInvalidoEs422() throws Exception {
		Par par = entradaYSalida();
		como(ADMIN_PINOS, get(RUTA + "/" + par.salida() + "/comparacion"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[0].field").value("contra"));
		como(ADMIN_PINOS, get(RUTA + "/" + par.salida() + "/comparacion").param("contra", "abc"))
				.andExpect(status().isUnprocessableContent());
	}

	@Test
	void quienNoVeLasInspeccionesRecibe404() throws Exception {
		Par par = entradaYSalida();
		como(CARLOS, get(RUTA + "/" + par.salida() + "/comparacion").param("contra", par.entrada()))
				.andExpect(status().isNotFound());
		como(ADMIN_ANDES, get(RUTA + "/" + par.salida() + "/comparacion").param("contra", par.entrada()))
				.andExpect(status().isNotFound());
	}

	// ---------- Armar una entrada y una salida finalizadas ----------

	private record Par(String entrada, String salida) {
	}

	private Par entradaYSalida() throws Exception {
		String entrada = finalizada("ENTRADA", false);
		// En una misma transacción now() no avanza: la entrada se marca una hora
		// antes para que sea anterior a la salida, como en la vida real.
		jdbcSinRls.sql("reset role").update();
		jdbcSinRls.sql("update public.inspecciones set finalizada_en = finalizada_en - interval '1 hour' where id = :id::uuid")
				.param("id", entrada).update();
		String salida = finalizada("SALIDA", true);
		return new Par(entrada, salida);
	}

	// Programa, inicia, evalúa todo como Bueno (el primero Dañado si se pide) y finaliza.
	private String finalizada(String tipo, boolean primeroDanado) throws Exception {
		String id = JsonPath.read(como(ADMIN_PINOS, post(RUTA).contentType(MediaType.APPLICATION_JSON).content("""
						{"inmuebleId":"%s","inspectorId":"%s","tipo":"%s","programadaPara":"%s"}"""
						.formatted(APT_302_PINOS, LAURA, tipo, OffsetDateTime.now(ZoneOffset.UTC).plusDays(1))))
				.andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.data.id");
		como(LAURA, post(RUTA + "/" + id + "/inicio").contentType(MediaType.APPLICATION_JSON).content("{\"version\":1}"))
				.andExpect(status().isOk());

		List<Map<String, Object>> detalles = JsonPath.read(como(LAURA, get(RUTA + "/" + id + "/detalles"))
				.andReturn().getResponse().getContentAsString(), "$.data");
		for (int i = 0; i < detalles.size(); i++) {
			String estado = primeroDanado && i == 0 ? "DANADO" : "BUENO";
			como(LAURA, patch(RUTA + "/" + id + "/detalles/" + detalles.get(i).get("id")).contentType(MediaType.APPLICATION_JSON)
							.content("{\"estado\":\"" + estado + "\",\"version\":1}"))
					.andExpect(status().isOk());
		}
		como(LAURA, post(RUTA + "/" + id + "/finalizacion").contentType(MediaType.APPLICATION_JSON).content("{\"version\":2}"))
				.andExpect(status().isOk());
		return id;
	}

	private ResultActions como(String usuario, MockHttpServletRequestBuilder peticion) throws Exception {
		return mockMvc.perform(peticion.with(jwt().jwt(token -> token
				.subject(usuario)
				.claim("role", "authenticated"))));
	}
}
