package com.inmocheck.propietarios;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
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

// /api/v1/propietarios de punta a punta contra la base REAL (datos de seed.sql).
// @Transactional: cada prueba corre en una transacción que se DESHACE al
// final, así que crear y editar no deja nada escrito en Supabase.
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@EnabledIf("com.inmocheck.BaseDePrueba#hayBaseConfigurada")
class PropietariosIntegracionTest {

	private static final String RUTA = "/api/v1/propietarios";
	private static final String ADMIN_PINOS = "a1000000-0000-4000-8000-000000000001";
	private static final String INSPECTORA_PINOS = "a1000000-0000-4000-8000-000000000002";
	private static final String MARIA_PINOS = "a2000000-0000-4000-8000-000000000001";
	private static final String ANA_ANDES = "b2000000-0000-4000-8000-000000000001";

	@Autowired
	private MockMvc mockMvc;

	// ---------- Listar ----------

	@Test
	void elAdminListaSoloLosPropietariosDeSuInmobiliaria() throws Exception {
		como(ADMIN_PINOS, get(RUTA))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data[*].nombre").value(hasItem("María López")))
				.andExpect(jsonPath("$.data[*].nombre").value(not(hasItem("Ana Torres"))))
				.andExpect(jsonPath("$.data[*].tipo").value(everyItem(org.hamcrest.Matchers.is("PROPIETARIO"))))
				.andExpect(jsonPath("$.meta.page").value(1))
				.andExpect(jsonPath("$.meta.pageSize").value(20));
	}

	@Test
	void traeLosInmueblesDeCadaPropietario() throws Exception {
		como(ADMIN_PINOS, get(RUTA + "/" + MARIA_PINOS))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.inmuebles[*].codigo").value(hasItem("APT-302")))
				.andExpect(jsonPath("$.data.createdAt").isNotEmpty());
	}

	@Test
	void buscaPorNombreOCorreoSinDistinguirMayusculas() throws Exception {
		como(ADMIN_PINOS, get(RUTA).param("search", "MARÍA"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data[*].nombre").value(hasItem("María López")));
		como(ADMIN_PINOS, get(RUTA).param("search", "jorge.ramirez@"))
				.andExpect(jsonPath("$.data[*].nombre").value(hasItem("Jorge Ramírez")));
	}

	@Test
	void unPorcentajeEnLaBusquedaNoEsUnComodin() throws Exception {
		como(ADMIN_PINOS, get(RUTA).param("search", "%"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.meta.total").value(0));
	}

	@Test
	void conYSinInmueblesSumanElTotal() throws Exception {
		int total = totalDe(get(RUTA));
		int con = totalDe(get(RUTA).param("inmuebles", "con"));
		int sin = totalDe(get(RUTA).param("inmuebles", "sin"));
		org.assertj.core.api.Assertions.assertThat(con + sin).isEqualTo(total);
		org.assertj.core.api.Assertions.assertThat(con).isPositive();
	}

	@Test
	void unValorRaroEnInmueblesSeIgnora() throws Exception {
		int total = totalDe(get(RUTA));
		org.assertj.core.api.Assertions.assertThat(totalDe(get(RUTA).param("inmuebles", "quizas"))).isEqualTo(total);
	}

	@Test
	void elInspectorNoPuedeVerPropietarios() throws Exception {
		como(INSPECTORA_PINOS, get(RUTA))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.code").value("FORBIDDEN"));
	}

	// ---------- Consultar ----------

	@Test
	void unPropietarioDeOtraInmobiliariaEs404() throws Exception {
		como(ADMIN_PINOS, get(RUTA + "/" + ANA_ANDES))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.code").value("NOT_FOUND"));
	}

	@Test
	void unIdQueNoEsUuidEs404() throws Exception {
		como(ADMIN_PINOS, get(RUTA + "/abc")).andExpect(status().isNotFound());
	}

	// ---------- Crear ----------

	@Test
	void creaUnPropietarioEnSuInmobiliaria() throws Exception {
		String respuesta = como(ADMIN_PINOS, post(RUTA).contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":\"  Lucía Prueba  \",\"email\":\"lucia@prueba.co\",\"telefono\":\"300 123\"}"))
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", startsWith(RUTA + "/")))
				.andExpect(jsonPath("$.data.nombre").value("Lucía Prueba"))
				.andExpect(jsonPath("$.data.tipo").value("PROPIETARIO"))
				.andExpect(jsonPath("$.data.inmuebles.length()").value(0))
				.andReturn().getResponse().getContentAsString();

		String id = JsonPath.read(respuesta, "$.data.id");
		como(ADMIN_PINOS, get(RUTA + "/" + id)).andExpect(status().isOk());
		// La otra inmobiliaria no lo ve.
		como("b1000000-0000-4000-8000-000000000001", get(RUTA + "/" + id)).andExpect(status().isNotFound());
	}

	@Test
	void datosInvalidosResponden422PorCampo() throws Exception {
		como(ADMIN_PINOS, post(RUTA).contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":\" A \",\"email\":\"no-es-correo\"}"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[?(@.field=='nombre')].message").value("Escribe el nombre completo."))
				.andExpect(jsonPath("$.errors[?(@.field=='email')].message").value("Escribe un correo válido."));
	}

	@Test
	void noSePuedeElegirLaOrganizacionDesdeElCuerpo() throws Exception {
		como(ADMIN_PINOS, post(RUTA).contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":\"Intruso\",\"organizacionId\":\"b0000000-0000-4000-8000-000000000001\"}"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[0].field").value("organizacionId"));
	}

	@Test
	void elInspectorNoPuedeCrear() throws Exception {
		como(INSPECTORA_PINOS, post(RUTA).contentType(MediaType.APPLICATION_JSON).content("{\"nombre\":\"Nadie\"}"))
				.andExpect(status().isForbidden());
	}

	// ---------- Editar (PATCH) ----------

	@Test
	void editaSoloLosCamposQueLlegan() throws Exception {
		como(ADMIN_PINOS, patch(RUTA + "/" + MARIA_PINOS).contentType(MediaType.APPLICATION_JSON)
						.content("{\"telefono\":\"+57 311 999 9999\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.telefono").value("+57 311 999 9999"))
				.andExpect(jsonPath("$.data.nombre").value("María López"))
				.andExpect(jsonPath("$.data.email").value("maria.lopez@example.com"));
	}

	@Test
	void unNullExplicitoBorraElCorreo() throws Exception {
		como(ADMIN_PINOS, patch(RUTA + "/" + MARIA_PINOS).contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\":null}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.email").doesNotExist())
				.andExpect(jsonPath("$.data.nombre").value("María López"));
	}

	@Test
	void elNombreNoSePuedeBorrar() throws Exception {
		como(ADMIN_PINOS, patch(RUTA + "/" + MARIA_PINOS).contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":null}"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[0].field").value("nombre"))
				.andExpect(jsonPath("$.errors[0].message").value("Escribe el nombre completo."));
	}

	@Test
	void noSeEditaUnPropietarioDeOtraInmobiliaria() throws Exception {
		como(ADMIN_PINOS, patch(RUTA + "/" + ANA_ANDES).contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":\"Cambiado\"}"))
				.andExpect(status().isNotFound());
	}

	// ---------- Ayudas ----------

	private ResultActions como(String usuario, MockHttpServletRequestBuilder peticion) throws Exception {
		return mockMvc.perform(peticion.with(jwt().jwt(token -> token
				.subject(usuario)
				.claim("role", "authenticated"))));
	}

	private int totalDe(MockHttpServletRequestBuilder peticion) throws Exception {
		String cuerpo = como(ADMIN_PINOS, peticion).andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
		return JsonPath.read(cuerpo, "$.meta.total");
	}
}
