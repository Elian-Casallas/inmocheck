package com.inmocheck.inspecciones;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.in;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
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

// Flujo de inspecciones contra la base REAL y sus funciones SQL.
// @Transactional: cada prueba crea su propia inspección y todo se DESHACE al
// final. Ojo: cuando una función SQL falla, la transacción queda anulada, así
// que en cada prueba la petición que debe fallar va de última.
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@EnabledIf("com.inmocheck.BaseDePrueba#hayBaseConfigurada")
class InspeccionesIntegracionTest {

	private static final String RUTA = "/api/v1/inspecciones";
	private static final String ADMIN_PINOS = "a1000000-0000-4000-8000-000000000001";
	private static final String ADMIN_ANDES = "b1000000-0000-4000-8000-000000000001";
	private static final String ORG_PINOS = "a0000000-0000-4000-8000-000000000001";
	private static final String LAURA = "a1000000-0000-4000-8000-000000000002";
	private static final String CARLOS = "a1000000-0000-4000-8000-000000000003";
	private static final String SOFIA_ANDES = "b1000000-0000-4000-8000-000000000002";
	private static final String APT_302_PINOS = "a3000000-0000-4000-8000-000000000001";
	private static final String MARIA_PINOS = "a2000000-0000-4000-8000-000000000001";

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private JdbcClient jdbcSinRls;

	// ---------- Listar ----------

	@Test
	void elAdminListaYFiltraPorVariosEstados() throws Exception {
		como(ADMIN_PINOS, get(RUTA)).andExpect(status().isOk()).andExpect(jsonPath("$.meta.total").isNumber());

		String cuerpo = como(ADMIN_PINOS, get(RUTA).param("estado", "FINALIZADA,CANCELADA").param("pageSize", "100"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data[*].estado").value(everyItem(is(in(List.of("FINALIZADA", "CANCELADA"))))))
				.andReturn().getResponse().getContentAsString();
		// Lo cerrado va de lo más reciente a lo más antiguo.
		List<String> fechas = JsonPath.read(cuerpo, "$.data[*].programadaPara");
		org.assertj.core.api.Assertions.assertThat(fechas.stream().map(OffsetDateTime::parse).toList())
				.isSortedAccordingTo(java.util.Comparator.reverseOrder());
	}

	@Test
	void filtraPorInspector() throws Exception {
		crear(LAURA);
		como(ADMIN_PINOS, get(RUTA).param("inspectorId", LAURA).param("pageSize", "100"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data[*].inspector.id").value(everyItem(is(LAURA))));
	}

	@Test
	void elInspectorSoloVeLasSuyasAunqueFiltrePorOtro() throws Exception {
		String id = crear(LAURA);
		como(CARLOS, get(RUTA).param("inspectorId", LAURA).param("pageSize", "100"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data[*].id").value(not(hasItem(id))));
	}

	@Test
	void unEstadoQueNoExisteEs422() throws Exception {
		como(ADMIN_PINOS, get(RUTA).param("estado", "PENDIENTE,ABIERTA"))
				.andExpect(status().isUnprocessableContent());
	}

	// ---------- Programar (crear_inspeccion) ----------

	@Test
	void programaUnaInspeccionConLaCopiaDelInventario() throws Exception {
		como(ADMIN_PINOS, post(RUTA).contentType(MediaType.APPLICATION_JSON).content(cuerpoCrear(LAURA, manana())))
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", startsWith(RUTA + "/")))
				.andExpect(jsonPath("$.data.estado").value("PENDIENTE"))
				.andExpect(jsonPath("$.data.version").value(1))
				.andExpect(jsonPath("$.data.inspector.id").value(LAURA))
				.andExpect(jsonPath("$.data.inmueble.codigo").value("APT-302"))
				.andExpect(jsonPath("$.data.nota").value("Creada por una prueba"))
				.andExpect(jsonPath("$.data.progreso.total").value(greaterThan(0)))
				.andExpect(jsonPath("$.data.progreso.evaluados").value(0));
	}

	@Test
	void unaFechaPasadaEs422() throws Exception {
		como(ADMIN_PINOS, post(RUTA).contentType(MediaType.APPLICATION_JSON)
						.content(cuerpoCrear(LAURA, OffsetDateTime.now(ZoneOffset.UTC).minusDays(2))))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.code").value("FECHA_PASADA"));
	}

	@Test
	void unInmuebleSinInventarioEs409() throws Exception {
		String inmueble = JsonPath.read(como(ADMIN_PINOS, post("/api/v1/inmuebles").contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"codigo":"SIN-INV-1","tipo":"CASA","direccion":"Calle sin inventario 1","ciudad":"Villavicencio",
								 "departamento":"Meta","habitaciones":1,"banos":1,"propietarioId":"%s"}""".formatted(MARIA_PINOS)))
				.andReturn().getResponse().getContentAsString(), "$.data.id");

		como(ADMIN_PINOS, post(RUTA).contentType(MediaType.APPLICATION_JSON)
						.content(cuerpoCrear(LAURA, manana()).replace(APT_302_PINOS, inmueble)))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("INVENTARIO_VACIO"));
	}

	@Test
	void unInspectorDeOtraInmobiliariaEs409() throws Exception {
		como(ADMIN_PINOS, post(RUTA).contentType(MediaType.APPLICATION_JSON).content(cuerpoCrear(SOFIA_ANDES, manana())))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("INSPECTOR_NO_DISPONIBLE"));
	}

	@Test
	void elInspectorNoPuedeProgramar() throws Exception {
		como(LAURA, post(RUTA).contentType(MediaType.APPLICATION_JSON).content(cuerpoCrear(LAURA, manana())))
				.andExpect(status().isForbidden());
	}

	// ---------- Consultar ----------

	@Test
	void soloLaVenSuOrganizacionYSuInspector() throws Exception {
		String id = crear(LAURA);
		como(LAURA, get(RUTA + "/" + id)).andExpect(status().isOk()).andExpect(jsonPath("$.data.id").value(id));
		como(CARLOS, get(RUTA + "/" + id)).andExpect(status().isNotFound());
		como(ADMIN_ANDES, get(RUTA + "/" + id)).andExpect(status().isNotFound());
	}

	// ---------- Reprogramar (editar_inspeccion) ----------

	@Test
	void reprogramaConLaVersionYRechazaUnaVersionVieja() throws Exception {
		String id = crear(LAURA);
		como(ADMIN_PINOS, patch(RUTA + "/" + id).contentType(MediaType.APPLICATION_JSON)
						.content("{\"nota\":\"  Llevar llaves  \",\"version\":1}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.nota").value("Llevar llaves"))
				.andExpect(jsonPath("$.data.version").value(2));

		como(ADMIN_PINOS, patch(RUTA + "/" + id).contentType(MediaType.APPLICATION_JSON)
						.content("{\"nota\":\"Otra\",\"version\":1}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("VERSION_CONFLICT"));
	}

	@Test
	void unaNotaEnNullLaBorra() throws Exception {
		String id = crear(LAURA);
		como(ADMIN_PINOS, patch(RUTA + "/" + id).contentType(MediaType.APPLICATION_JSON)
						.content("{\"nota\":null,\"version\":1}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.nota").doesNotExist());
	}

	@Test
	void reprogramarSinVersionEs422() throws Exception {
		String id = crear(LAURA);
		como(ADMIN_PINOS, patch(RUTA + "/" + id).contentType(MediaType.APPLICATION_JSON).content("{\"nota\":\"x\"}"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[0].field").value("version"));
	}

	// ---------- Iniciar (iniciar_inspeccion) ----------

	@Test
	void laInspectoraAsignadaLaInicia() throws Exception {
		String id = crear(LAURA);
		como(LAURA, post(RUTA + "/" + id + "/inicio").contentType(MediaType.APPLICATION_JSON).content("{\"version\":1}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.estado").value("EN_PROCESO"))
				.andExpect(jsonPath("$.data.version").value(2))
				.andExpect(jsonPath("$.data.iniciadaEn").isNotEmpty());
	}

	@Test
	void otroInspectorNoLaPuedeIniciar() throws Exception {
		String id = crear(LAURA);
		como(CARLOS, post(RUTA + "/" + id + "/inicio").contentType(MediaType.APPLICATION_JSON).content("{\"version\":1}"))
				.andExpect(status().isNotFound());
	}

	@Test
	void elAdminNoPuedeIniciar() throws Exception {
		String id = crear(LAURA);
		como(ADMIN_PINOS, post(RUTA + "/" + id + "/inicio").contentType(MediaType.APPLICATION_JSON).content("{\"version\":1}"))
				.andExpect(status().isForbidden());
	}

	@Test
	void unaInspeccionVencidaNoSeInicia() throws Exception {
		// Se crea directo en la base: por la API no se puede programar en el pasado.
		String id = jdbcSinRls.sql("""
				insert into public.inspecciones
				  (organizacion_id, inmueble_id, inspector_id, tipo, programada_para, creada_por)
				values (:org::uuid, :inmueble::uuid, :inspector::uuid, 'SALIDA', now() - interval '3 days', :admin::uuid)
				returning id::text
				""")
				.param("org", ORG_PINOS).param("inmueble", APT_302_PINOS)
				.param("inspector", LAURA).param("admin", ADMIN_PINOS)
				.query(String.class).single();

		como(LAURA, post(RUTA + "/" + id + "/inicio").contentType(MediaType.APPLICATION_JSON).content("{\"version\":1}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("INSPECCION_VENCIDA"));
	}

	// ---------- Reasignar y cancelar ----------

	@Test
	void reasignaYNoDejaRepetirElMismoInspector() throws Exception {
		String id = crear(LAURA);
		como(ADMIN_PINOS, post(RUTA + "/" + id + "/reasignaciones").contentType(MediaType.APPLICATION_JSON)
						.content("{\"inspectorId\":\"" + CARLOS + "\",\"version\":1}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.inspector.id").value(CARLOS))
				.andExpect(jsonPath("$.data.version").value(2));

		como(ADMIN_PINOS, post(RUTA + "/" + id + "/reasignaciones").contentType(MediaType.APPLICATION_JSON)
						.content("{\"inspectorId\":\"" + CARLOS + "\",\"version\":2}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("MISMO_INSPECTOR"));
	}

	@Test
	void cancelaYDespuesQuedaCerrada() throws Exception {
		String id = crear(LAURA);
		como(ADMIN_PINOS, post(RUTA + "/" + id + "/cancelacion").contentType(MediaType.APPLICATION_JSON)
						.content("{\"motivo\":\"  El arrendatario no estaba  \",\"version\":1}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.estado").value("CANCELADA"))
				.andExpect(jsonPath("$.data.motivoCancelacion").value("El arrendatario no estaba"))
				.andExpect(jsonPath("$.data.canceladaEn").isNotEmpty());

		como(ADMIN_PINOS, post(RUTA + "/" + id + "/cancelacion").contentType(MediaType.APPLICATION_JSON)
						.content("{\"motivo\":\"Otra vez\",\"version\":2}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("INSPECCION_CERRADA"));
	}

	@Test
	void cancelarSinMotivoEs422() throws Exception {
		String id = crear(LAURA);
		como(ADMIN_PINOS, post(RUTA + "/" + id + "/cancelacion").contentType(MediaType.APPLICATION_JSON)
						.content("{\"motivo\":\"no\",\"version\":1}"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[0].message").value("Escribe el motivo de la cancelación."));
	}

	@Test
	void noSeReprogramaUnaCancelada() throws Exception {
		String id = crear(LAURA);
		como(ADMIN_PINOS, post(RUTA + "/" + id + "/cancelacion").contentType(MediaType.APPLICATION_JSON)
						.content("{\"motivo\":\"Cancelada en prueba\",\"version\":1}"))
				.andExpect(status().isOk());

		como(ADMIN_PINOS, patch(RUTA + "/" + id).contentType(MediaType.APPLICATION_JSON)
						.content("{\"nota\":\"x\",\"version\":2}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("TRANSICION_INVALIDA"));
	}

	// ---------- Ayudas ----------

	private String crear(String inspector) throws Exception {
		String cuerpo = como(ADMIN_PINOS, post(RUTA).contentType(MediaType.APPLICATION_JSON)
						.content(cuerpoCrear(inspector, manana())))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		return JsonPath.read(cuerpo, "$.data.id");
	}

	private static OffsetDateTime manana() {
		return OffsetDateTime.now(ZoneOffset.UTC).plusDays(1);
	}

	private static String cuerpoCrear(String inspector, OffsetDateTime fecha) {
		return """
				{"inmuebleId":"%s","inspectorId":"%s","tipo":"SALIDA","programadaPara":"%s","nota":"Creada por una prueba"}"""
				.formatted(APT_302_PINOS, inspector, fecha);
	}

	private ResultActions como(String usuario, MockHttpServletRequestBuilder peticion) throws Exception {
		return mockMvc.perform(peticion.with(jwt().jwt(token -> token
				.subject(usuario)
				.claim("role", "authenticated"))));
	}
}
