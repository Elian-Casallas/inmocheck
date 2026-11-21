package com.inmocheck.config;

import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.Date;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Import(SeguridadTest.Configuracion.class)
class SeguridadTest {

	private static final String RUTA_PROTEGIDA = "/api/v1/prueba/sesion";

	@Autowired
	private MockMvc mockMvc;

	@Test
	void sinTokenResponde401EnProblemJson() throws Exception {
		mockMvc.perform(get(RUTA_PROTEGIDA))
				.andExpect(status().isUnauthorized())
				.andExpect(header().string(HttpHeaders.WWW_AUTHENTICATE, startsWith("Bearer")))
				.andExpect(content().contentTypeCompatibleWith("application/problem+json"))
				.andExpect(jsonPath("$.status").value(401))
				.andExpect(jsonPath("$.code").value("UNAUTHENTICATED"))
				.andExpect(jsonPath("$.detail").value("Debes iniciar sesión."))
				.andExpect(jsonPath("$.instance").value(RUTA_PROTEGIDA))
				.andExpect(jsonPath("$.traceId").isNotEmpty());
	}

	@Test
	void conTokenValidoDejaPasarYEntregaElUsuario() throws Exception {
		String token = TokensDePrueba.firmar(TokensDePrueba.claimsValidos().build());

		conToken(token)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.usuario").value(TokensDePrueba.USUARIO));
	}

	@Test
	void rechazaUnTokenVencido() throws Exception {
		Instant haceDosHoras = Instant.now().minusSeconds(7200);
		String token = TokensDePrueba.firmar(TokensDePrueba.claimsValidos()
				.issueTime(Date.from(haceDosHoras))
				.expirationTime(Date.from(haceDosHoras.plusSeconds(3600)))
				.build());

		conToken(token).andExpect(status().isUnauthorized());
	}

	@Test
	void rechazaUnTokenDeOtroProyecto() throws Exception {
		String token = TokensDePrueba.firmar(TokensDePrueba.claimsValidos()
				.issuer("https://otro-proyecto.supabase.co/auth/v1")
				.build());

		conToken(token).andExpect(status().isUnauthorized());
	}

	@Test
	void rechazaUnTokenQueNoEsDeUsuarioConSesion() throws Exception {
		// Como la llave anónima: firma válida, pero audiencia distinta.
		String token = TokensDePrueba.firmar(TokensDePrueba.claimsValidos()
				.audience("anon")
				.build());

		conToken(token).andExpect(status().isUnauthorized());
	}

	@Test
	void rechazaUnTokenFirmadoConOtraLlave() throws Exception {
		String token = TokensDePrueba.firmarConLlaveAjena(TokensDePrueba.claimsValidos().build());

		conToken(token).andExpect(status().isUnauthorized());
	}

	@Test
	void rechazaUnTokenMalFormado() throws Exception {
		conToken("esto-no-es-un-jwt")
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
	}

	@Test
	void laSaludNoPideToken() throws Exception {
		mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
	}

	private ResultActions conToken(String token) throws Exception {
		return mockMvc.perform(get(RUTA_PROTEGIDA).header(HttpHeaders.AUTHORIZATION, "Bearer " + token));
	}

	@TestConfiguration
	static class Configuracion {

		@Bean
		@Primary
		JwtDecoder decodificadorDePrueba() {
			return TokensDePrueba.decodificador();
		}

		@Bean
		RutaDePrueba rutaDePrueba() {
			return new RutaDePrueba();
		}
	}

	// Ruta que solo existe en las pruebas, para tener algo protegido que llamar.
	@RestController
	static class RutaDePrueba {

		@GetMapping(RUTA_PROTEGIDA)
		Map<String, String> sesion(@AuthenticationPrincipal Jwt token) {
			return Map.of("usuario", token.getSubject());
		}
	}
}
