package com.inmocheck.comun.sesion;

import com.inmocheck.comun.errores.SinPermisoException;
import java.util.Arrays;
import java.util.UUID;
import org.springframework.security.oauth2.jwt.Jwt;

// Quien hace la petición. Su rol y su organización salen SIEMPRE del token y
// de la tabla perfiles, nunca de lo que mande el cliente.
// Un controller lo pide como parámetro: crear(Actor actor, ...).
// Guarda el token para que los servicios puedan abrir EjecutorRls con él.
public record Actor(
		UUID id,
		String nombre,
		String email,
		Rol rol,
		Organizacion organizacion,
		Jwt token) {

	public record Organizacion(UUID id, String nombre) {
	}

	// Equivale a requireRole(...) del BFF.
	public Actor exigirRol(Rol... permitidos) {
		if (Arrays.stream(permitidos).noneMatch(rol::equals)) {
			throw new SinPermisoException();
		}
		return this;
	}

	public boolean esAdmin() {
		return rol == Rol.ADMIN;
	}
}
