package com.inmocheck.config;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.ECDSASigner;
import com.nimbusds.jose.jwk.Curve;
import com.nimbusds.jose.jwk.ECKey;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.gen.ECKeyGenerator;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import java.time.Instant;
import java.util.Date;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

// Fabrica tokens como los de Supabase Auth, firmados con una llave ES256 que
// solo existe en las pruebas. Así se prueba la seguridad sin red.
final class TokensDePrueba {

	// La misma de src/test/resources/application-test.yml.
	static final String URL_SUPABASE = "https://prueba.supabase.co";
	static final String EMISOR = URL_SUPABASE + "/auth/v1";
	static final String USUARIO = "11111111-1111-1111-1111-111111111111";

	private static final ECKey LLAVE_DEL_PROYECTO = generarLlave("proyecto");
	private static final ECKey LLAVE_AJENA = generarLlave("ajena");

	private TokensDePrueba() {
	}

	// Mismo decodificador que producción, pero con la llave pública de prueba
	// en vez de descargarla de Supabase.
	static JwtDecoder decodificador() {
		DefaultJWTProcessor<SecurityContext> procesador = new DefaultJWTProcessor<>();
		procesador.setJWSKeySelector(new JWSVerificationKeySelector<>(
				JWSAlgorithm.ES256,
				new ImmutableJWKSet<>(new JWKSet(LLAVE_DEL_PROYECTO.toPublicJWK()))));
		// Las reglas de exp, iss y aud las aplica Spring (reglasDelToken), igual que en producción.
		procesador.setJWTClaimsSetVerifier((claims, contexto) -> { });
		NimbusJwtDecoder decodificador = new NimbusJwtDecoder(procesador);
		decodificador.setJwtValidator(SeguridadConfig.reglasDelToken(EMISOR));
		return decodificador;
	}

	static JWTClaimsSet.Builder claimsValidos() {
		Instant ahora = Instant.now();
		return new JWTClaimsSet.Builder()
				.issuer(EMISOR)
				.subject(USUARIO)
				.audience(SeguridadConfig.AUDIENCIA_USUARIOS)
				.claim("role", "authenticated")
				.claim("email", "inspector@prueba.co")
				.issueTime(Date.from(ahora))
				.expirationTime(Date.from(ahora.plusSeconds(3600)));
	}

	static String firmar(JWTClaimsSet claims) {
		return firmarCon(LLAVE_DEL_PROYECTO, claims);
	}

	static String firmarConLlaveAjena(JWTClaimsSet claims) {
		return firmarCon(LLAVE_AJENA, claims);
	}

	private static String firmarCon(ECKey llave, JWTClaimsSet claims) {
		try {
			SignedJWT token = new SignedJWT(
					new JWSHeader.Builder(JWSAlgorithm.ES256).keyID(llave.getKeyID()).build(),
					claims);
			token.sign(new ECDSASigner(llave));
			return token.serialize();
		} catch (JOSEException e) {
			throw new IllegalStateException("No se pudo firmar el token de prueba", e);
		}
	}

	private static ECKey generarLlave(String id) {
		try {
			return new ECKeyGenerator(Curve.P_256).keyID(id).generate();
		} catch (JOSEException e) {
			throw new IllegalStateException("No se pudo generar la llave de prueba", e);
		}
	}
}
