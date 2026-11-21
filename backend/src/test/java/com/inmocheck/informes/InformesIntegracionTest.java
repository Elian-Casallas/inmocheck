package com.inmocheck.informes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.inmocheck.supabase.ClienteSupabaseAdmin;
import com.jayway.jsonpath.JsonPath;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

// Informes contra la base REAL (función registrar_informe), en transacciones
// que se deshacen. Storage se SIMULA: no se sube ningún PDF de verdad, pero
// se revisa el PDF que Spring habría subido.
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@EnabledIf("com.inmocheck.BaseDePrueba#hayBaseConfigurada")
class InformesIntegracionTest {

	private static final String RUTA = "/api/v1/inspecciones";
	private static final String ADMIN_PINOS = "a1000000-0000-4000-8000-000000000001";
	private static final String ADMIN_ANDES = "b1000000-0000-4000-8000-000000000001";
	private static final String ORG_PINOS = "a0000000-0000-4000-8000-000000000001";
	private static final String LAURA = "a1000000-0000-4000-8000-000000000002";
	private static final String CARLOS = "a1000000-0000-4000-8000-000000000003";
	private static final String APT_302_PINOS = "a3000000-0000-4000-8000-000000000001";

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private ClienteSupabaseAdmin supabase;

	// ---------- Generar ----------

	@Test
	void generaElActaComoPdfYLaGuardaEnElBucketPrivado() throws Exception {
		String inspeccion = finalizada();

		como(ADMIN_PINOS, post(RUTA + "/" + inspeccion + "/informes").contentType(MediaType.APPLICATION_JSON)
						.content("{\"tipo\":\"ACTA\"}"))
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", startsWith("/api/v1/informes/")))
				.andExpect(jsonPath("$.data.version").value(1))
				.andExpect(jsonPath("$.data.inspeccionId").value(inspeccion))
				.andExpect(jsonPath("$.data.generadoPor.nombre").value("Andrea Pinzón"));

		ArgumentCaptor<byte[]> pdf = ArgumentCaptor.forClass(byte[].class);
		verify(supabase).subirArchivo(eq("informes"),
				org.mockito.ArgumentMatchers.startsWith("org/" + ORG_PINOS + "/inspecciones/" + inspeccion + "/"),
				pdf.capture(), eq("application/pdf"));
		assertThat(new String(pdf.getValue(), 0, 5, StandardCharsets.ISO_8859_1)).isEqualTo("%PDF-");
	}

	@Test
	void cadaGeneracionEsUnaVersionNuevaYSeConservanLasAnteriores() throws Exception {
		String inspeccion = finalizada();
		generar(ADMIN_PINOS, inspeccion);
		generar(ADMIN_PINOS, inspeccion);

		como(ADMIN_PINOS, get(RUTA + "/" + inspeccion + "/informes"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.length()").value(2))
				.andExpect(jsonPath("$.data[0].version").value(2))
				.andExpect(jsonPath("$.data[1].version").value(1));
	}

	@Test
	void laInspectoraAsignadaTambienPuedeGenerarlo() throws Exception {
		String inspeccion = finalizada();
		como(LAURA, post(RUTA + "/" + inspeccion + "/informes").contentType(MediaType.APPLICATION_JSON).content("{}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.data.generadoPor.nombre").value("Laura Díaz"));
	}

	@Test
	void noSeGeneraParaUnaInspeccionSinFinalizar() throws Exception {
		String inspeccion = programar();
		como(ADMIN_PINOS, post(RUTA + "/" + inspeccion + "/informes").contentType(MediaType.APPLICATION_JSON).content("{}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("INSPECCION_NO_FINALIZADA"));
		verify(supabase, never()).subirArchivo(any(), any(), any(), any());
	}

	@Test
	void unTipoDistintoDeActaOMasDe60FotosEs422() throws Exception {
		String inspeccion = finalizada();
		como(ADMIN_PINOS, post(RUTA + "/" + inspeccion + "/informes").contentType(MediaType.APPLICATION_JSON)
						.content("{\"tipo\":\"RESUMEN\"}"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[0].field").value("tipo"));

		String muchas = String.join(",", java.util.Collections.nCopies(61, "\"a5000000-0000-4000-8000-000000000001\""));
		como(ADMIN_PINOS, post(RUTA + "/" + inspeccion + "/informes").contentType(MediaType.APPLICATION_JSON)
						.content("{\"evidenciaIds\":[" + muchas + "]}"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[0].field").value("evidenciaIds"));
	}

	@Test
	void otroInspectorNoGeneraNiVeLasVersiones() throws Exception {
		String inspeccion = finalizada();
		como(CARLOS, post(RUTA + "/" + inspeccion + "/informes").contentType(MediaType.APPLICATION_JSON).content("{}"))
				.andExpect(status().isNotFound());
		como(CARLOS, get(RUTA + "/" + inspeccion + "/informes")).andExpect(status().isNotFound());
	}

	// ---------- Descargar ----------

	@Test
	void laDescargaRedirigeAUnEnlaceFirmadoConNombreLegible() throws Exception {
		String inspeccion = finalizada();
		String informe = generar(ADMIN_PINOS, inspeccion);
		when(supabase.firmarEnlaceDeDescarga(eq("informes"), anyString(), anyInt(), anyString()))
				.thenReturn("https://storage.prueba/acta.pdf?token=1&download=x");

		como(LAURA, get("/api/v1/informes/" + informe + "/descarga"))
				.andExpect(status().isFound())
				.andExpect(header().string("Location", "https://storage.prueba/acta.pdf?token=1&download=x"))
				.andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("no-store")));

		String nombreEsperado = "INF-" + OffsetDateTime.now(ZoneOffset.UTC).getYear() + "-"
				+ informe.substring(0, 8).toUpperCase() + "-v1.pdf";
		verify(supabase).firmarEnlaceDeDescarga(eq("informes"), anyString(), eq(60), eq(nombreEsperado));
	}

	@Test
	void otroInspectorNoDescarga() throws Exception {
		String informe = generar(ADMIN_PINOS, finalizada());
		como(CARLOS, get("/api/v1/informes/" + informe + "/descarga")).andExpect(status().isNotFound());
		verify(supabase, never()).firmarEnlaceDeDescarga(any(), any(), anyInt(), any());
	}

	// ---------- Biblioteca ----------

	@Test
	void laBibliotecaMuestraElInformeConSuInmuebleYFiltra() throws Exception {
		String informe = generar(ADMIN_PINOS, finalizada());

		como(ADMIN_PINOS, get("/api/v1/informes").param("pageSize", "100"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data[?(@.id=='" + informe + "')].inspeccion.inmueble.codigo").value("APT-302"))
				.andExpect(jsonPath("$.data[?(@.id=='" + informe + "')].inspeccion.tipo").value("SALIDA"));
		como(ADMIN_PINOS, get("/api/v1/informes").param("search", "apt-302").param("tipo", "SALIDA").param("pageSize", "100"))
				.andExpect(jsonPath("$.data[*].id").value(hasItem(informe)));
		como(ADMIN_PINOS, get("/api/v1/informes").param("tipo", "ENTRADA").param("pageSize", "100"))
				.andExpect(jsonPath("$.data[*].id").value(not(hasItem(informe))));
		// Otra inmobiliaria no lo ve.
		como(ADMIN_ANDES, get("/api/v1/informes").param("pageSize", "100"))
				.andExpect(jsonPath("$.data[*].id").value(not(hasItem(informe))));
	}

	// ---------- Ayudas ----------

	private String generar(String usuario, String inspeccion) throws Exception {
		String cuerpo = como(usuario, post(RUTA + "/" + inspeccion + "/informes").contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		return JsonPath.read(cuerpo, "$.data.id");
	}

	private String programar() throws Exception {
		return JsonPath.read(como(ADMIN_PINOS, post(RUTA).contentType(MediaType.APPLICATION_JSON).content("""
						{"inmuebleId":"%s","inspectorId":"%s","tipo":"SALIDA","programadaPara":"%s"}"""
						.formatted(APT_302_PINOS, LAURA, OffsetDateTime.now(ZoneOffset.UTC).plusDays(1))))
				.andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.data.id");
	}

	// Programa, inicia, evalúa todo y finaliza una salida de APT-302.
	private String finalizada() throws Exception {
		String id = programar();
		como(LAURA, post(RUTA + "/" + id + "/inicio").contentType(MediaType.APPLICATION_JSON).content("{\"version\":1}"))
				.andExpect(status().isOk());
		List<Map<String, Object>> detalles = JsonPath.read(como(LAURA, get(RUTA + "/" + id + "/detalles"))
				.andReturn().getResponse().getContentAsString(), "$.data");
		for (Map<String, Object> detalle : detalles) {
			como(LAURA, patch(RUTA + "/" + id + "/detalles/" + detalle.get("id")).contentType(MediaType.APPLICATION_JSON)
							.content("{\"estado\":\"BUENO\",\"version\":1}"))
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
