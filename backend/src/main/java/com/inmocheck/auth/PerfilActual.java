package com.inmocheck.auth;

import com.inmocheck.comun.sesion.Actor;
import com.inmocheck.comun.sesion.Rol;
import java.util.UUID;

// Lo que GET /auth/me devuelve del usuario. Es un DTO aparte del Actor a
// propósito: el Actor guarda el token, y el token nunca debe salir en una
// respuesta. Campos iguales al Actor del BFF (server/auth/sesion.ts).
public record PerfilActual(
		UUID id,
		String nombre,
		String email,
		Rol rol,
		boolean activo,
		Organizacion organizacion) {

	public record Organizacion(UUID id, String nombre) {
	}

	// Si hay Actor, la cuenta está activa: ActorResolver rechaza las desactivadas.
	public static PerfilActual de(Actor actor) {
		return new PerfilActual(
				actor.id(),
				actor.nombre(),
				actor.email(),
				actor.rol(),
				true,
				new Organizacion(actor.organizacion().id(), actor.organizacion().nombre()));
	}
}
