package com.inmocheck.inventario;

import com.inmocheck.comun.Textos;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

// Datos del inventario (equivalen a schemas/inventario.ts). Van juntos porque
// son chicos y siempre se usan entre ellos.
public final class InventarioDtos {

	static final String MENSAJE_NOMBRE = "Mínimo 2 caracteres.";
	static final String MENSAJE_ORDEN = "El orden debe estar entre 0 y 999.";

	private InventarioDtos() {
	}

	// ---------- Respuestas ----------

	public record ElementoRespuesta(
			UUID id, UUID espacioId, String nombre, boolean obligatorio, int orden, boolean activo) {
	}

	public record EspacioRespuesta(
			UUID id, UUID inmuebleId, String nombre, int orden, boolean activo, List<ElementoRespuesta> elementos) {
	}

	// ---------- Cuerpos de POST (espacioCrearSchema, elementoCrearSchema) ----------

	// orden opcional: si no llega, va al final.
	public record CrearEspacio(
			@NotBlank(message = MENSAJE_NOMBRE) @Size(min = 2, max = 80, message = MENSAJE_NOMBRE) String nombre,
			@Min(value = 0, message = MENSAJE_ORDEN) @Max(value = 999, message = MENSAJE_ORDEN) Integer orden) {

		public CrearEspacio {
			nombre = Textos.recortar(nombre);
		}
	}

	// obligatorio: si no llega, es true (como el .default(true) de Zod).
	public record CrearElemento(
			@NotBlank(message = MENSAJE_NOMBRE) @Size(min = 2, max = 80, message = MENSAJE_NOMBRE) String nombre,
			Boolean obligatorio,
			@Min(value = 0, message = MENSAJE_ORDEN) @Max(value = 999, message = MENSAJE_ORDEN) Integer orden) {

		public CrearElemento {
			nombre = Textos.recortar(nombre);
			obligatorio = obligatorio == null ? Boolean.TRUE : obligatorio;
		}
	}
}
