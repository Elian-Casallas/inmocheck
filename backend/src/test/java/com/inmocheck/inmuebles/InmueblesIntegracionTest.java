package com.inmocheck.inmuebles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
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

// /api/v1/inmuebles de punta a punta contra la base REAL (datos de seed.sql).
// @Transactional: cada prueba se DESHACE al final; no deja nada en Supabase.
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@EnabledIf("com.inmocheck.BaseDePrueba#hayBaseConfigurada")
class InmueblesIntegracionTest {

	private static final String RUTA = "/api/v1/inmuebles";
	private static final String ADMIN_PINOS = "a1000000-0000-4000-8000-000000000001";
	private static final String LAURA = "a1000000-0000-4000-8000-000000000002";
	private static final String CARLOS = "a1000000-0000-4000-8000-000000000003";
	private static final String ORG_PINOS = "a0000000-0000-4000-8000-000000000001";
	private static final String APT_302_PINOS = "a3000000-0000-4000-8000-000000000001";
	private static final String CASA_014_PINOS = "a3000000-0000-4000-8000-000000000002";
	private static final String APT_302_ANDES = "b3000000-0000-4000-8000-000000000001";
	private static final String MARIA_PINOS = "a2000000-0000-4000-8000-000000000001";
	private static final String ANA_ANDES = "b2000000-0000-4000-8000-000000000001";
	private static final String INSPECCION_SEED = "a5000000-0000-4000-8000-000000000001";

	@Autowired
	private MockMvc mockMvc;

	// Solo para preparar datos dentro de la transacción de la prueba.
	@Autowired
	private JdbcClient jdbcSinRls;

	// ---------- Listar ----------

	@Test
	void elAdminVeSoloLosInmueblesDeSuInmobiliaria() throws Exception {
		como(ADMIN_PINOS, get(RUTA).param("pageSize", "100"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data[*].id").value(hasItems(APT_302_PINOS, CASA_014_PINOS)))
				.andExpect(jsonPath("$.data[*].id").value(not(hasItem(APT_302_ANDES))));
	}

	@Test
	void filtraPorTipoYEstado() throws Exception {
		como(ADMIN_PINOS, get(RUTA).param("tipo", "CASA"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data[*].tipo").value(everyItem(is("CASA"))));
		como(ADMIN_PINOS, get(RUTA).param("activo", "true"))
				.andExpect(jsonPath("$.data[*].activo").value(everyItem(is(true))));
	}

	@Test
	void buscaEnCodigoDireccionBarrioYCiudad() throws Exception {
		como(ADMIN_PINOS, get(RUTA).param("search", "esperanza"))
				.andExpect(jsonPath("$.data[*].codigo").value(hasItem("CASA-014")));
	}

	@Test
	void ordenaSegunSort() throws Exception {
		String cuerpo = como(ADMIN_PINOS, get(RUTA).param("sort", "-codigo").param("pageSize", "100"))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
		List<String> codigos = JsonPath.read(cuerpo, "$.data[*].codigo");
		assertThat(codigos).isSortedAccordingTo(java.util.Comparator.<String>reverseOrder());
	}

	@Test
	void filtrosConValoresFueraDeLaListaResponden422() throws Exception {
		como(ADMIN_PINOS, get(RUTA).param("tipo", "CASTILLO"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[0].field").value("tipo"));
		como(ADMIN_PINOS, get(RUTA).param("sort", "precio"))
				.andExpect(status().isUnprocessableContent());
		como(ADMIN_PINOS, get(RUTA).param("activo", "quizas"))
				.andExpect(status().isUnprocessableContent());
	}

	// ---------- Consultar (RLS por rol) ----------

	@Test
	void elAdminVeElInmuebleConSuPropietario() throws Exception {
		como(ADMIN_PINOS, get(RUTA + "/" + APT_302_PINOS))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.codigo").value("APT-302"))
				.andExpect(jsonPath("$.data.propietario.nombre").value("María López"));
	}

	@Test
	void laInspectoraAsignadaLoVePeroSinElPropietario() throws Exception {
		como(LAURA, get(RUTA + "/" + APT_302_PINOS))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.codigo").value("APT-302"))
				.andExpect(jsonPath("$.data.propietario").doesNotExist());
	}

	@Test
	void unInspectorSinInspeccionesAhiNoLoVe() throws Exception {
		como(CARLOS, get(RUTA + "/" + APT_302_PINOS)).andExpect(status().isNotFound());
	}

	@Test
	void unInmuebleDeOtraInmobiliariaEs404() throws Exception {
		como(ADMIN_PINOS, get(RUTA + "/" + APT_302_ANDES))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.code").value("NOT_FOUND"));
	}

	// ---------- Crear ----------

	@Test
	void creaUnInmueble() throws Exception {
		como(ADMIN_PINOS, post(RUTA).contentType(MediaType.APPLICATION_JSON).content(inmueble("  PRUEBA-01  ", MARIA_PINOS)))
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", startsWith(RUTA + "/")))
				.andExpect(jsonPath("$.data.codigo").value("PRUEBA-01"))
				.andExpect(jsonPath("$.data.activo").value(true))
				.andExpect(jsonPath("$.data.areaM2").value(72.5))
				.andExpect(jsonPath("$.data.propietario.nombre").value("María López"));
	}

	@Test
	void unCodigoRepetidoEnLaMismaInmobiliariaEs409() throws Exception {
		como(ADMIN_PINOS, post(RUTA).contentType(MediaType.APPLICATION_JSON).content(inmueble("APT-302", MARIA_PINOS)))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("CODIGO_INMUEBLE_DUPLICADO"));
	}

	@Test
	void unPropietarioDeOtraInmobiliariaEs409() throws Exception {
		como(ADMIN_PINOS, post(RUTA).contentType(MediaType.APPLICATION_JSON).content(inmueble("PRUEBA-02", ANA_ANDES)))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("PROPIETARIO_INVALIDO"));
	}

	@Test
	void datosInvalidosResponden422PorCampo() throws Exception {
		como(ADMIN_PINOS, post(RUTA).contentType(MediaType.APPLICATION_JSON).content("""
						{"codigo":"X1","tipo":"CASA","direccion":"Calle 1 #2-3","ciudad":"A","departamento":"Meta",
						 "habitaciones":-1,"banos":1,"propietarioId":"%s"}""".formatted(MARIA_PINOS)))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[?(@.field=='habitaciones')].message").value("No puede ser negativo."))
				.andExpect(jsonPath("$.errors[?(@.field=='ciudad')].message").value("Escribe la ciudad."));
	}

	@Test
	void unTipoQueNoExisteEs422() throws Exception {
		como(ADMIN_PINOS, post(RUTA).contentType(MediaType.APPLICATION_JSON)
						.content(inmueble("PRUEBA-03", MARIA_PINOS).replace("\"CASA\"", "\"CASTILLO\"")))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[0].field").value("tipo"));
	}

	@Test
	void habitacionesConDecimalesEs422() throws Exception {
		como(ADMIN_PINOS, post(RUTA).contentType(MediaType.APPLICATION_JSON)
						.content(inmueble("PRUEBA-04", MARIA_PINOS).replace("\"habitaciones\":3", "\"habitaciones\":2.5")))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[0].field").value("habitaciones"));
	}

	@Test
	void elInspectorNoPuedeCrear() throws Exception {
		como(LAURA, post(RUTA).contentType(MediaType.APPLICATION_JSON).content(inmueble("PRUEBA-05", MARIA_PINOS)))
				.andExpect(status().isForbidden());
	}

	// ---------- Editar ----------

	@Test
	void editaSoloLoQueLlegaYUnNullBorraElArea() throws Exception {
		como(ADMIN_PINOS, patch(RUTA + "/" + CASA_014_PINOS).contentType(MediaType.APPLICATION_JSON)
						.content("{\"barrio\":\"  Barrio Prueba  \",\"areaM2\":null}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.barrio").value("Barrio Prueba"))
				.andExpect(jsonPath("$.data.areaM2").doesNotExist())
				.andExpect(jsonPath("$.data.codigo").value("CASA-014"))
				.andExpect(jsonPath("$.data.tipo").value("CASA"));
	}

	@Test
	void cambiarAUnCodigoQueYaExisteEs409() throws Exception {
		como(ADMIN_PINOS, patch(RUTA + "/" + CASA_014_PINOS).contentType(MediaType.APPLICATION_JSON)
						.content("{\"codigo\":\"APT-302\"}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("CODIGO_INMUEBLE_DUPLICADO"));
	}

	@Test
	void unPatchConValoresInvalidosEs422() throws Exception {
		como(ADMIN_PINOS, patch(RUTA + "/" + CASA_014_PINOS).contentType(MediaType.APPLICATION_JSON)
						.content("{\"tipo\":\"CASTILLO\",\"habitaciones\":null,\"organizacionId\":\"x\"}"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[*].field").value(hasItems("tipo", "organizacionId")));
		como(ADMIN_PINOS, patch(RUTA + "/" + CASA_014_PINOS).contentType(MediaType.APPLICATION_JSON)
						.content("{\"habitaciones\":null}"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[0].message").value("Escribe un número."));
	}

	@Test
	void noSeEditaUnInmuebleDeOtraInmobiliaria() throws Exception {
		como(ADMIN_PINOS, patch(RUTA + "/" + APT_302_ANDES).contentType(MediaType.APPLICATION_JSON)
						.content("{\"barrio\":\"Cambiado\"}"))
				.andExpect(status().isNotFound());
	}

	// ---------- Desactivar (DELETE) ----------

	@Test
	void desactivarConservaElInmueble() throws Exception {
		String respuesta = como(ADMIN_PINOS, post(RUTA).contentType(MediaType.APPLICATION_JSON)
						.content(inmueble("PRUEBA-06", MARIA_PINOS)))
				.andReturn().getResponse().getContentAsString();
		String id = JsonPath.read(respuesta, "$.data.id");

		como(ADMIN_PINOS, delete(RUTA + "/" + id)).andExpect(status().isNoContent());
		como(ADMIN_PINOS, get(RUTA + "/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.activo").value(false));
	}

	@Test
	void noSeDesactivaConInspeccionesAbiertas() throws Exception {
		// Se prepara ANTES de la primera petición, con el usuario de conexión.
		jdbcSinRls.sql("""
				insert into public.inspecciones
				  (organizacion_id, inmueble_id, inspector_id, tipo, programada_para, creada_por)
				values (:org::uuid, :inmueble::uuid, :inspector::uuid, 'ENTRADA', now() + interval '1 day', :admin::uuid)
				""")
				.param("org", ORG_PINOS).param("inmueble", CASA_014_PINOS)
				.param("inspector", LAURA).param("admin", ADMIN_PINOS)
				.update();

		como(ADMIN_PINOS, delete(RUTA + "/" + CASA_014_PINOS))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("INMUEBLE_CON_INSPECCIONES_ABIERTAS"));
	}

	@Test
	void elInspectorNoPuedeDesactivar() throws Exception {
		como(LAURA, delete(RUTA + "/" + APT_302_PINOS)).andExpect(status().isForbidden());
	}

	// ---------- Historial ----------

	@Test
	void elHistorialTraeLasInspeccionesDelInmueble() throws Exception {
		como(ADMIN_PINOS, get(RUTA + "/" + APT_302_PINOS + "/historial"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data[*].id").value(hasItem(INSPECCION_SEED)))
				.andExpect(jsonPath("$.data[0].inmueble.codigo").value("APT-302"))
				.andExpect(jsonPath("$.data[0].programadaPara").isNotEmpty());
	}

	@Test
	void elHistorialDeOtraInmobiliariaEs404() throws Exception {
		como(ADMIN_PINOS, get(RUTA + "/" + APT_302_ANDES + "/historial")).andExpect(status().isNotFound());
	}

	// ---------- Ayudas ----------

	private static String inmueble(String codigo, String propietarioId) {
		return """
				{"codigo":"%s","tipo":"CASA","direccion":"Calle de prueba 123","barrio":null,"ciudad":"Villavicencio",
				 "departamento":"Meta","habitaciones":3,"banos":2,"areaM2":72.5,"propietarioId":"%s",
				 "descripcion":"Creado por una prueba"}""".formatted(codigo, propietarioId);
	}

	private ResultActions como(String usuario, MockHttpServletRequestBuilder peticion) throws Exception {
		return mockMvc.perform(peticion.with(jwt().jwt(token -> token
				.subject(usuario)
				.claim("role", "authenticated"))));
	}
}
