package com.inmocheck.inmuebles;

import java.time.OffsetDateTime;
import java.util.UUID;

// Una inspección en el historial del inmueble (tipo InspeccionResumen de
// lib/inspecciones.ts). Cuando se migre Inspecciones (5.13) se moverá allá.
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
