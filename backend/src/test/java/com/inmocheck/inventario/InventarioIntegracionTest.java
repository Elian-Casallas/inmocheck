package com.inmocheck.inventario;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

// Inventario de punta a punta contra la base REAL (datos de seed.sql).
// @Transactional: cada prueba se DESHACE al final; no deja nada en Supabase.
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@EnabledIf("com.inmocheck.BaseDePrueba#hayBaseConfigurada")
class InventarioIntegracionTest {

	private static final String ADMIN_PINOS = "a1000000-0000-4000-8000-000000000001";
	private static final String ADMIN_ANDES = "b1000000-0000-4000-8000-000000000001";
	private static final String LAURA = "a1000000-0000-4000-8000-000000000002";
	private static final String CARLOS = "a1000000-0000-4000-8000-000000000003";
	private static final String APT_302_PINOS = "a3000000-0000-4000-8000-000000000001";
	private static final String APT_302_ANDES = "b3000000-0000-4000-8000-000000000001";
	private static final String COCINA_PINOS = "a4000000-0000-4000-8000-000000000001";
	private static final String COCINA_ANDES = "b4000000-0000-4000-8000-000000000001";

	@Autowired
	private MockMvc mockMvc;

	// ---------- Listar ----------

	@Test
	void elAdminVeLosEspaciosConSusElementosEnOrden() throws Exception {
		String cuerpo = como(ADMIN_PINOS, get(espaciosDe(APT_302_PINOS)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data[*].nombre").value(hasItems("Cocina", "Baño principal")))
				.andExpect(jsonPath("$.data[?(@.id=='" + COCINA_PINOS + "')].elementos[*].nombre")
						.value(hasItems("Paredes", "Piso")))
				.andReturn().getResponse().getContentAsString();

		List<Integer> ordenes = JsonPath.read(cuerpo, "$.data[*].orden");
		org.assertj.core.api.Assertions.assertThat(ordenes).isSorted();
	}

	@Test
	void laInspectoraAsignadaVeElInventario() throws Exception {
		como(LAURA, get(espaciosDe(APT_302_PINOS)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data[*].nombre").value(hasItem("Cocina")));
	}

	@Test
	void unInspectorSinInspeccionesAhiRecibe404() throws Exception {
		como(CARLOS, get(espaciosDe(APT_302_PINOS))).andExpect(status().isNotFound());
	}

	@Test
	void elInventarioDeOtraInmobiliariaEs404() throws Exception {
		como(ADMIN_PINOS, get(espaciosDe(APT_302_ANDES))).andExpect(status().isNotFound());
	}

	// ---------- Espacios ----------

	@Test
	void creaUnEspacioAlFinalSiNoTraeOrden() throws Exception {
		como(ADMIN_PINOS, post(espaciosDe(APT_302_PINOS)).contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":\"  Patio  \"}"))
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", startsWith("/api/v1/espacios/")))
				.andExpect(jsonPath("$.data.nombre").value("Patio"))
				.andExpect(jsonPath("$.data.inmuebleId").value(APT_302_PINOS))
				.andExpect(jsonPath("$.data.activo").value(true))
				.andExpect(jsonPath("$.data.elementos.length()").value(0));
	}

	@Test
	void noSeCreaUnEspacioEnUnInmuebleAjeno() throws Exception {
		como(ADMIN_PINOS, post(espaciosDe(APT_302_ANDES)).contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":\"Intruso\"}"))
				.andExpect(status().isNotFound());
	}

	@Test
	void unNombreCortoEs422() throws Exception {
		como(ADMIN_PINOS, post(espaciosDe(APT_302_PINOS)).contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":\"A\",\"orden\":1000}"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[*].field").value(hasItems("nombre", "orden")));
	}

	@Test
	void desactivarUnEspacioLoConserva() throws Exception {
		como(ADMIN_PINOS, patch("/api/v1/espacios/" + COCINA_PINOS).contentType(MediaType.APPLICATION_JSON)
						.content("{\"activo\":false}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.activo").value(false))
				.andExpect(jsonPath("$.data.nombre").value("Cocina"))
				.andExpect(jsonPath("$.data.elementos.length()").isNumber());
	}

	@Test
	void unNullEnUnPatchDeInventarioEs422() throws Exception {
		como(ADMIN_PINOS, patch("/api/v1/espacios/" + COCINA_PINOS).contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":null,\"activo\":null}"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[*].field").value(hasItems("nombre", "activo")));
	}

	@Test
	void noSeEditaUnEspacioAjeno() throws Exception {
		como(ADMIN_PINOS, patch("/api/v1/espacios/" + COCINA_ANDES).contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":\"Cambiado\"}"))
				.andExpect(status().isNotFound());
	}

	@Test
	void elInspectorNoPuedeCrearEspacios() throws Exception {
		como(LAURA, post(espaciosDe(APT_302_PINOS)).contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":\"Patio\"}"))
				.andExpect(status().isForbidden());
	}

	// ---------- Elementos ----------

	@Test
	void creaUnElementoObligatorioPorDefecto() throws Exception {
		como(ADMIN_PINOS, post("/api/v1/espacios/" + COCINA_PINOS + "/elementos").contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":\"Nevera\"}"))
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", startsWith("/api/v1/elementos/")))
				.andExpect(jsonPath("$.data.nombre").value("Nevera"))
				.andExpect(jsonPath("$.data.obligatorio").value(true))
				.andExpect(jsonPath("$.data.espacioId").value(COCINA_PINOS));
	}

	@Test
	void unNombreVacioDaUnSoloErrorAunqueFallenDosReglas() throws Exception {
		como(ADMIN_PINOS, post("/api/v1/espacios/" + COCINA_PINOS + "/elementos").contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":\"\"}"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors.length()").value(1))
				.andExpect(jsonPath("$.errors[0].message").value("Mínimo 2 caracteres."));
	}

	@Test
	void noSeCuelgaUnElementoDeUnEspacioAjeno() throws Exception {
		como(ADMIN_PINOS, post("/api/v1/espacios/" + COCINA_ANDES + "/elementos").contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":\"Intruso\"}"))
				.andExpect(status().isNotFound());
	}

	@Test
	void editaUnElemento() throws Exception {
		String creado = como(ADMIN_PINOS, post("/api/v1/espacios/" + COCINA_PINOS + "/elementos")
						.contentType(MediaType.APPLICATION_JSON).content("{\"nombre\":\"Horno\",\"orden\":7}"))
				.andReturn().getResponse().getContentAsString();
		String id = JsonPath.read(creado, "$.data.id");

		como(ADMIN_PINOS, patch("/api/v1/elementos/" + id).contentType(MediaType.APPLICATION_JSON)
						.content("{\"obligatorio\":false,\"activo\":false}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.obligatorio").value(false))
				.andExpect(jsonPath("$.data.activo").value(false))
				.andExpect(jsonPath("$.data.nombre").value("Horno"))
				.andExpect(jsonPath("$.data.orden").value(7));
	}

	@Test
	void noSeEditaUnElementoAjeno() throws Exception {
		String cuerpo = como(ADMIN_ANDES, get(espaciosDe(APT_302_ANDES)))
				.andReturn().getResponse().getContentAsString();
		String elementoAndes = JsonPath.<List<String>>read(cuerpo, "$.data[0].elementos[*].id").get(0);

		como(ADMIN_PINOS, patch("/api/v1/elementos/" + elementoAndes).contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":\"Cambiado\"}"))
				.andExpect(status().isNotFound());
	}

	// ---------- Ayudas ----------

	private static String espaciosDe(String inmuebleId) {
		return "/api/v1/inmuebles/" + inmuebleId + "/espacios";
	}

	private ResultActions como(String usuario, MockHttpServletRequestBuilder peticion) throws Exception {
		return mockMvc.perform(peticion.with(jwt().jwt(token -> token
				.subject(usuario)
				.claim("role", "authenticated"))));
	}
}
