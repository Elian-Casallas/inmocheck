package com.inmocheck.auth;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

// GET /auth/me de punta a punta contra la base REAL (datos de seed.sql):
// controller → ActorResolver → EjecutorRls → RLS → perfiles.
// La firma del token no se prueba aquí (eso es SeguridadTest).
@SpringBootTest
@AutoConfigureMockMvc
@EnabledIf("com.inmocheck.BaseDePrueba#hayBaseConfigurada")
class MeIntegracionTest {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void elAdminDeLosPinosVeSuPerfil() throws Exception {
		comoUsuario("a1000000-0000-4000-8000-000000000001")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.nombre").value("Andrea Pinzón"))
				.andExpect(jsonPath("$.data.rol").value("ADMIN"))
				.andExpect(jsonPath("$.data.organizacion.nombre").value("Inmobiliaria Los Pinos"));
	}

	@Test
	void laInspectoraDeAndesVeElSuyo() throws Exception {
		comoUsuario("b1000000-0000-4000-8000-000000000002")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.nombre").value("Sofía Mora"))
				.andExpect(jsonPath("$.data.rol").value("INSPECTOR"))
				.andExpect(jsonPath("$.data.organizacion.nombre").value("Inmobiliaria Andes"));
	}

	@Test
	void unUsuarioSinPerfilRecibe401() throws Exception {
		comoUsuario("99999999-9999-4999-8999-999999999999")
				.andExpect(status().isUnauthorized());
	}

	private ResultActions comoUsuario(String id) throws Exception {
		return mockMvc.perform(get("/api/v1/auth/me").with(jwt().jwt(token -> token
				.subject(id)
				.claim("role", "authenticated"))));
	}
}
