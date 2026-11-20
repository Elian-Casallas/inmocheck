package com.inmocheck.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

// Datos del proyecto de Supabase. Salen de variables de entorno (en local, de
// backend/.env). @Validated hace que la app NO arranque si falta la URL, en
// vez de arrancar mal configurada y rechazar todo después.
@Validated
@ConfigurationProperties("inmocheck.supabase")
public record PropiedadesSupabase(@NotBlank String url) {

	// Supabase Auth firma los tokens con este emisor ("iss").
	public String emisor() {
		return quitarBarraFinal(url) + "/auth/v1";
	}

	// Llaves públicas con las que se verifica la firma de los tokens.
	public String urlLlavesPublicas() {
		return emisor() + "/.well-known/jwks.json";
	}

	private static String quitarBarraFinal(String texto) {
		return texto.endsWith("/") ? texto.substring(0, texto.length() - 1) : texto;
	}
}
