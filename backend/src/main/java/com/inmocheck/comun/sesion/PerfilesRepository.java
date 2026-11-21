package com.inmocheck.comun.sesion;

import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

// Lee el perfil de quien inició sesión. Corre bajo RLS: la política
// perfiles_ver deja que cada usuario vea SU fila aunque esté desactivado.
@Repository
public class PerfilesRepository {

	// LEFT JOIN a propósito: a un usuario desactivado, RLS ya no le deja ver su
	// organización (mi_organizacion() exige activo). Con JOIN normal parecería
	// que no tiene perfil (401) en vez de responder "cuenta desactivada" (403).
	private static final String BUSCAR_PERFIL = """
			select p.id, p.nombre, p.email, p.rol, p.activo,
			       o.id as organizacion_id, o.nombre as organizacion_nombre
			from public.perfiles p
			left join public.organizaciones o on o.id = p.organizacion_id
			where p.id = :id
			""";

	public Optional<PerfilEncontrado> buscar(JdbcClient jdbc, UUID usuarioId) {
		return jdbc.sql(BUSCAR_PERFIL)
				.param("id", usuarioId)
				.query((fila, numero) -> new PerfilEncontrado(
						fila.getObject("id", UUID.class),
						fila.getString("nombre"),
						fila.getString("email"),
						Rol.valueOf(fila.getString("rol")),
						fila.getBoolean("activo"),
						fila.getObject("organizacion_id", UUID.class),
						fila.getString("organizacion_nombre")))
				.optional();
	}

	// Fila tal como sale de la base. La organización puede venir vacía si la
	// cuenta está desactivada; ActorResolver rechaza ese caso antes de usarla.
	public record PerfilEncontrado(
			UUID id,
			String nombre,
			String email,
			Rol rol,
			boolean activo,
			UUID organizacionId,
			String organizacionNombre) {
	}
}
