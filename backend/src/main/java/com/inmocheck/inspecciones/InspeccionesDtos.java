package com.inmocheck.inspecciones;

import com.inmocheck.comun.Textos;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.UUID;

// Datos de las inspecciones (equivalen a schemas/inspecciones.ts).
public final class InspeccionesDtos {

	static final String MENSAJE_VERSION = "Falta la versión.";

	private InspeccionesDtos() {
	}

	public enum TipoInspeccion { ENTRADA, SALIDA, SEGUIMIENTO }

	public enum EstadoInspeccion {
		PENDIENTE, EN_PROCESO, FINALIZADA, CANCELADA;

		boolean cerrado() {
			return this == FINALIZADA || this == CANCELADA;
		}
	}

	// ---------- Respuestas (tipo Inspeccion del front) ----------

	public record Progreso(int evaluados, int total, int obligatoriosPendientes) {
	}

	public record InspeccionRespuesta(
			UUID id,
			TipoInspeccion tipo,
			EstadoInspeccion estado,
			OffsetDateTime programadaPara,
			String nota,
			OffsetDateTime iniciadaEn,
			OffsetDateTime finalizadaEn,
			OffsetDateTime canceladaEn,
			String motivoCancelacion,
			int version,
			Inmueble inmueble,
			Inspector inspector,
			Progreso progreso) {

		public record Inmueble(UUID id, String codigo, String direccion, String barrio, String ciudad) {
		}

		// Puede llegar null si RLS no deja ver el perfil del inspector.
		public record Inspector(UUID id, String nombre) {
		}
	}

	// ---------- Cuerpos ----------

	// POST /inspecciones (inspeccionCrearSchema).
	public record CrearInspeccion(
			@NotNull(message = "Selecciona un inmueble.") UUID inmuebleId,
			@NotNull(message = "Selecciona un inspector.") UUID inspectorId,
			@NotNull(message = "Selecciona el tipo de inspección.") TipoInspeccion tipo,
			@NotNull(message = "Fecha inválida.") OffsetDateTime programadaPara,
			@Size(max = 1000, message = "La nota puede tener máximo 1000 caracteres.") String nota) {

		public CrearInspeccion {
			nota = Textos.recortar(nota);
		}
	}

	// POST /inspecciones/{id}/inicio (inspeccionVersionSchema).
	public record ConVersion(
			@NotNull(message = MENSAJE_VERSION) @Min(value = 1, message = MENSAJE_VERSION) Integer version) {
	}

	// POST /inspecciones/{id}/reasignaciones (inspeccionReasignarSchema).
	public record Reasignar(
			@NotNull(message = "Selecciona un inspector.") UUID inspectorId,
			@Size(max = 500, message = "El motivo puede tener máximo 500 caracteres.") String motivo,
			@NotNull(message = MENSAJE_VERSION) @Min(value = 1, message = MENSAJE_VERSION) Integer version) {

		public Reasignar {
			motivo = Textos.recortar(motivo);
		}
	}

	// POST /inspecciones/{id}/cancelacion (inspeccionCancelarSchema).
	public record Cancelar(
			@NotBlank(message = MENSAJE_MOTIVO) @Size(min = 3, max = 500, message = MENSAJE_MOTIVO) String motivo,
			@NotNull(message = MENSAJE_VERSION) @Min(value = 1, message = MENSAJE_VERSION) Integer version) {

		static final String MENSAJE_MOTIVO = "Escribe el motivo de la cancelación.";

		public Cancelar {
			motivo = Textos.recortar(motivo);
		}
	}
}
