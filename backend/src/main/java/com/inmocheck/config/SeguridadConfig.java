package com.inmocheck.config;

import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;

// Seguridad del back: cada petición a /api/v1 debe traer el JWT que Supabase
// Auth le dio al usuario al iniciar sesión (Authorization: Bearer ...).
// No hay sesión en el servidor ni cookies: el proxy de Next.js manda el token.
@Configuration
public class SeguridadConfig {

	// Supabase pone "authenticated" en el claim "aud" de los usuarios con sesión.
	static final String AUDIENCIA_USUARIOS = "authenticated";

	private static final String[] RUTAS_PUBLICAS = {
		"/actuator/health", "/actuator/health/**",
		// Página de error interna de Spring: si se protegiera, un 404 de un
		// usuario con sesión se convertiría en 401.
		"/error",
	};

	@Bean
	SecurityFilterChain cadenaDeSeguridad(
			HttpSecurity http,
			RespuestaNoAutenticado noAutenticado,
			RespuestaSinPermiso sinPermiso) throws Exception {
		return http
				// Sin cookies de sesión no hay CSRF que proteger.
				.csrf(csrf -> csrf.disable())
				.sessionManagement(sesion -> sesion.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(rutas -> rutas
						.requestMatchers(RUTAS_PUBLICAS).permitAll()
						.anyRequest().authenticated())
				.oauth2ResourceServer(servidor -> servidor
						.jwt(jwt -> { })
						.authenticationEntryPoint(noAutenticado)
						.accessDeniedHandler(sinPermiso))
				.exceptionHandling(errores -> errores
						.authenticationEntryPoint(noAutenticado)
						.accessDeniedHandler(sinPermiso))
				.build();
	}

	// Verifica la firma con las llaves públicas del proyecto (ES256) y luego
	// las reglas del contenido del token.
	@Bean
	JwtDecoder decodificadorDeTokens(PropiedadesSupabase supabase) {
		NimbusJwtDecoder decodificador = NimbusJwtDecoder.withJwkSetUri(supabase.urlLlavesPublicas())
				.jwsAlgorithm(SignatureAlgorithm.ES256)
				.build();
		decodificador.setJwtValidator(reglasDelToken(supabase.emisor()));
		return decodificador;
	}

	// Reglas que debe cumplir un token, además de la firma:
	// - no estar vencido (exp) ni ser del futuro (nbf),
	// - venir de NUESTRO proyecto de Supabase (iss),
	// - ser de un usuario con sesión (aud = authenticated), no la llave anónima.
	// Es estática para que las pruebas usen exactamente las mismas reglas.
	static OAuth2TokenValidator<Jwt> reglasDelToken(String emisor) {
		OAuth2TokenValidator<Jwt> audiencia = new JwtClaimValidator<List<String>>(
				JwtClaimNames.AUD,
				aud -> aud != null && aud.contains(AUDIENCIA_USUARIOS));
		return new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefaultWithIssuer(emisor), audiencia);
	}
}
