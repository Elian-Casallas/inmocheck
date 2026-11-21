package com.inmocheck.inspecciones;

import java.time.OffsetDateTime;
import java.util.UUID;

// Una inspección en listados e historial (tipo InspeccionResumen de lib/inspecciones.ts).
public record InspeccionResumen(
		UUID id,
		String tipo,
		String estado,
		OffsetDateTime programadaPara,
		OffsetDateTime finalizadaEn,
		Inmueble inmueble,
		Inspector inspector) {

	public record Inmueble(UUID id, String codigo, String direccion) {
	}

	// Puede llegar null si RLS no deja ver el perfil del inspector.
	public record Inspector(UUID id, String nombre) {
	}
}
