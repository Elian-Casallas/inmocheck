package com.inmocheck.auth;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.inmocheck.comun.datos.EjecutorRls;
import com.inmocheck.comun.sesion.PerfilesRepository;
import com.inmocheck.comun.sesion.PerfilesRepository.PerfilEncontrado;
import com.inmocheck.comun.sesion.Rol;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

// Forma de la respuesta de GET /auth/me (la base se simula).
@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class MeControllerTest {

	private static final String RUTA = "/api/v1/auth/me";
	private static final UUID USUARIO = UUID.fromString("a1000000-0000-4000-8000-000000000001");
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
		when(ejecutor.ejecutar(any(), any())).thenAnswer(llamada ->
				llamada.getArgument(1, Function.class).apply(null));
	}

	@Test
	void devuelveElPerfilConLaMismaFormaQueElBff() throws Exception {
		when(perfiles.buscar(any(), eq(USUARIO))).thenReturn(Optional.of(new PerfilEncontrado(
				USUARIO, "Andrea Pinzón", "admin@pinos.test", Rol.ADMIN, true,
				ORGANIZACION, "Inmobiliaria Los Pinos")));

		mockMvc.perform(get(RUTA).with(jwt().jwt(token -> token.subject(USUARIO.toString()))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.id").value(USUARIO.toString()))
				.andExpect(jsonPath("$.data.nombre").value("Andrea Pinzón"))
				.andExpect(jsonPath("$.data.email").value("admin@pinos.test"))
				.andExpect(jsonPath("$.data.rol").value("ADMIN"))
				.andExpect(jsonPath("$.data.activo").value(true))
				.andExpect(jsonPath("$.data.organizacion.id").value(ORGANIZACION.toString()))
				.andExpect(jsonPath("$.data.organizacion.nombre").value("Inmobiliaria Los Pinos"))
				// El token nunca sale en la respuesta.
				.andExpect(jsonPath("$.data.token").doesNotExist())
				.andExpect(jsonPath("$.data.length()").value(6));
	}

	@Test
	void sinTokenResponde401() throws Exception {
		mockMvc.perform(get(RUTA))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
	}

	@Test
	void conCuentaDesactivadaResponde403() throws Exception {
		when(perfiles.buscar(any(), eq(USUARIO))).thenReturn(Optional.of(new PerfilEncontrado(
				USUARIO, "Andrea Pinzón", "admin@pinos.test", Rol.ADMIN, false, null, null)));

		mockMvc.perform(get(RUTA).with(jwt().jwt(token -> token.subject(USUARIO.toString()))))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.code").value("CUENTA_INACTIVA"));
	}
}
