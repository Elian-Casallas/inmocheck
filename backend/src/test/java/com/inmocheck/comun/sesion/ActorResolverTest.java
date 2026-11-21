package com.inmocheck.comun.sesion;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.inmocheck.comun.datos.EjecutorRls;
import com.inmocheck.comun.sesion.PerfilesRepository.PerfilEncontrado;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

// Cómo se arma el Actor a partir del token y del perfil. La base se simula:
// lo que se prueba aquí son las decisiones (401, 403, rol, organización).
// El acceso real bajo RLS lo prueba AislamientoRlsTest.
@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Import(ActorResolverTest.Configuracion.class)
class ActorResolverTest {

	private static final String RUTA_ACTOR = "/api/v1/prueba/actor";
	private static final String RUTA_SOLO_ADMIN = "/api/v1/prueba/solo-admin";
	private static final UUID USUARIO = UUID.fromString("a1000000-0000-4000-8000-000000000002");
	private static final UUID ORGANIZACION = UUID.fromString("a0000000-0000-4000-8000-000000000001");

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private EjecutorRls ejecutor;

	@MockitoBean
	private PerfilesRepository perfiles;

	@BeforeEach
	@SuppressWarnings("unchecked")
	void ejecutorSimulado() {
		// Corre el trabajo tal cual, sin abrir una transacción real.
		when(ejecutor.ejecutar(any(), any())).thenAnswer(llamada ->
				llamada.getArgument(1, Function.class).apply(null));
	}

	@Test
	void conPerfilActivoEntregaRolYOrganizacionDeLaBase() throws Exception {
		tienePerfil(true);

		comoUsuario(RUTA_ACTOR)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(USUARIO.toString()))
				.andExpect(jsonPath("$.rol").value("INSPECTOR"))
				.andExpect(jsonPath("$.organizacion").value("Inmobiliaria Los Pinos"));

		// El perfil se buscó con el token de la petición, no con otro.
		verify(ejecutor).ejecutar(argThat(token -> USUARIO.toString().equals(token.getSubject())), any());
		verify(perfiles).buscar(any(), eq(USUARIO));
	}

	@Test
	void conCuentaDesactivadaResponde403AunqueElTokenSeaValido() throws Exception {
		tienePerfil(false);

		comoUsuario(RUTA_ACTOR)
				.andExpect(status().isForbidden())
				.andExpect(content().contentTypeCompatibleWith("application/problem+json"))
				.andExpect(jsonPath("$.code").value("CUENTA_INACTIVA"))
				.andExpect(jsonPath("$.detail").value("Tu cuenta está desactivada."));
	}

	@Test
	void sinPerfilResponde401() throws Exception {
		when(perfiles.buscar(any(), eq(USUARIO))).thenReturn(Optional.empty());

		comoUsuario(RUTA_ACTOR)
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
	}

	@Test
	void conRolEquivocadoResponde403() throws Exception {
		tienePerfil(true);

		comoUsuario(RUTA_SOLO_ADMIN)
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.code").value("FORBIDDEN"));
	}

	private void tienePerfil(boolean activo) {
		when(perfiles.buscar(any(), eq(USUARIO))).thenReturn(Optional.of(new PerfilEncontrado(
				USUARIO, "Laura Díaz", "laura@pinos.test", Rol.INSPECTOR, activo,
				activo ? ORGANIZACION : null,
				activo ? "Inmobiliaria Los Pinos" : null)));
	}

	private ResultActions comoUsuario(String ruta) throws Exception {
		return mockMvc.perform(get(ruta).with(jwt().jwt(token -> token.subject(USUARIO.toString()))));
	}

	@TestConfiguration
	static class Configuracion {

		@Bean
		RutasDePrueba rutasDePrueba() {
			return new RutasDePrueba();
		}
	}

	@RestController
	static class RutasDePrueba {

		@GetMapping(RUTA_ACTOR)
		Map<String, String> actor(Actor actor) {
			return Map.of(
					"id", actor.id().toString(),
					"rol", actor.rol().name(),
					"organizacion", actor.organizacion().nombre());
		}

		@GetMapping(RUTA_SOLO_ADMIN)
		Map<String, String> soloAdmin(Actor actor) {
			actor.exigirRol(Rol.ADMIN);
			return Map.of("ok", "si");
		}
	}
}
