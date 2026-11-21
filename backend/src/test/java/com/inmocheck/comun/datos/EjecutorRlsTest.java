package com.inmocheck.comun.datos;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import tools.jackson.databind.json.JsonMapper;

class EjecutorRlsTest {

	private final EjecutorRls ejecutor = new EjecutorRls(null, null, JsonMapper.builder().build());

	@Test
	void pasaLosClaimsConLasFechasEnSegundosComoSupabase() {
		Jwt token = Jwt.withTokenValue("token")
				.header("alg", "ES256")
				.subject("a1000000-0000-4000-8000-000000000001")
				.claim("role", "authenticated")
				.issuedAt(Instant.ofEpochSecond(1_700_000_000))
				.expiresAt(Instant.ofEpochSecond(1_700_003_600))
				.build();

		String claims = ejecutor.claimsComoJson(token);

		assertThat(claims)
				.contains("\"sub\":\"a1000000-0000-4000-8000-000000000001\"")
				.contains("\"role\":\"authenticated\"")
				.contains("\"iat\":1700000000")
				.contains("\"exp\":1700003600");
	}
}
