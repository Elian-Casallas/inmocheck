package com.inmocheck.propietarios;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

// Un propietario como lo devuelve la API: mismos campos que el tipo
// Propietario de schemas/propietarios.ts.
public record PropietarioRespuesta(
		UUID id,
		String nombre,
		String email,
		String telefono,
		String tipo,
		OffsetDateTime createdAt,
		List<InmuebleResumen> inmuebles) {

	// Inmuebles del propietario que el usuario puede ver (RLS).
	public record InmuebleResumen(UUID id, String codigo, boolean activo) {
	}
}
