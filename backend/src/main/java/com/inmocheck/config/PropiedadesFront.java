package com.inmocheck.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

// Dirección de la app web (Next.js). Se usa para armar los enlaces que llegan
// por correo (invitación, reenviar acceso): deben abrir el FRONT, no Spring.
// Es configuración fija a propósito: si saliera de una cabecera de la
// petición, alguien podría desviar el enlace del correo hacia otro sitio.
@Validated
@ConfigurationProperties("inmocheck.front")
public record PropiedadesFront(@NotBlank String url) {

	// Página del front que recibe el enlace y lleva a crear la contraseña
	// (RUTA_ENLACE_CORREO en lib/supabase/correo.ts).
	private static final String RUTA_ENLACE_CORREO = "/auth/enlace?siguiente=/auth/actualizar-contrasena";

	public String urlEnlaceCorreo() {
		return (url.endsWith("/") ? url.substring(0, url.length() - 1) : url) + RUTA_ENLACE_CORREO;
	}
}
