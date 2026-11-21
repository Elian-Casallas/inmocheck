package com.inmocheck.inmuebles;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

// Un inmueble como lo devuelve la API (tipo Inmueble de schemas/inmuebles.ts).
public record InmuebleRespuesta(
		UUID id,
		String codigo,
		TipoInmueble tipo,
		String direccion,
		String barrio,
		String ciudad,
		String departamento,
		int habitaciones,
		int banos,
		BigDecimal areaM2,
		String descripcion,
		boolean activo,
		OffsetDateTime createdAt,
		Propietario propietario) {

	// El inspector no puede ver propietarios (RLS): para él llega null.
	public record Propietario(UUID id, String nombre, String email, String telefono) {
	}
}
