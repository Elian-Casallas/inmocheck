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

	public enum EstadoElemento { EXCELENTE, BUENO, REGULAR, DANADO, NO_APLICA }

	// ---------- Respuestas (tipo Inspeccion del front) ----------

	public record Progreso(int evaluados, int total, int obligatoriosPendientes) {

		// Misma regla que lib/progreso.ts y finalizar_inspeccion: un obligatorio
		// sigue pendiente si no tiene estado, o si es "No aplica" sin explicación.
		static Progreso de(java.util.List<DetalleRespuesta> detalles) {
			int evaluados = (int) detalles.stream().filter(detalle -> detalle.estado() != null).count();
			int pendientes = (int) detalles.stream().filter(DetalleRespuesta::obligatorioPendiente).count();
			return new Progreso(evaluados, detalles.size(), pendientes);
		}
	}

	// Un elemento a evaluar (tipo Detalle del front). Los nombres son la copia
	// (snapshot) del inventario cuando se programó: no cambian si luego se
	// edita el inventario.
	public record DetalleRespuesta(
			UUID id,
			UUID elementoId,
			String espacioNombre,
			String elementoNombre,
			boolean obligatorio,
			EstadoElemento estado,
			String observacion,
			int version,
			java.util.List<Evidencia> evidencias) {

		boolean obligatorioPendiente() {
			if (!obligatorio) return false;
			if (estado == null) return true;
			return estado == EstadoElemento.NO_APLICA && (observacion == null || observacion.isBlank());
		}
	}

	public record Evidencia(UUID id, String mimeType, int sizeBytes, String descripcion, OffsetDateTime createdAt) {
	}

	// GET /inspecciones/{id}/detalles: { data: [...], meta: progreso }.
	public record ListaDetalles(java.util.List<DetalleRespuesta> data, Progreso meta) {
	}

	// Respuesta de guardar un elemento: lo guardado y la versión nueva.
	public record DetalleGuardado(UUID id, EstadoElemento estado, String observacion, int version) {
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

	// PATCH /inspecciones/{id}/detalles/{detalleId} (detalleGuardarSchema).
	// La observación se recorta; vacía cuenta como sin observación.
	public record GuardarDetalle(
			@NotNull(message = "Selecciona un estado.") EstadoElemento estado,
			@Size(max = 2000, message = "La observación puede tener máximo 2000 caracteres.") String observacion,
			@NotNull(message = MENSAJE_VERSION) @Min(value = 1, message = MENSAJE_VERSION) Integer version) {

		public GuardarDetalle {
			observacion = Textos.recortar(observacion);
			observacion = observacion == null || observacion.isEmpty() ? null : observacion;
		}
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
