package com.inmocheck.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

// Datos del proyecto de Supabase. Salen de variables de entorno (en local, de
// backend/.env). @Validated hace que la app NO arranque si falta la URL, en
// vez de arrancar mal configurada y rechazar todo después.
//
// serviceRoleKey es opcional al arrancar: solo la usan invitar inspectores,
// fotos e informes. Si falta, esas operaciones responden 503 (como el BFF).
@Validated
@ConfigurationProperties("inmocheck.supabase")
public record PropiedadesSupabase(@NotBlank String url, String serviceRoleKey) {

	// Supabase Auth firma los tokens con este emisor ("iss").
	public String emisor() {
		return base() + "/auth/v1";
	}

	// Llaves públicas con las que se verifica la firma de los tokens.
	public String urlLlavesPublicas() {
		return emisor() + "/.well-known/jwks.json";
	}

	public String base() {
		return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
	}

	public boolean tieneServiceRole() {
		return serviceRoleKey != null && !serviceRoleKey.isBlank();
	}
}
