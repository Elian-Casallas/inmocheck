package com.inmocheck.inmuebles;

import com.inmocheck.comun.Textos;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;

// Cuerpo de POST /inmuebles. Mismas reglas y mensajes que inmuebleCrearSchema
// (schemas/inmuebles.ts). Los textos se recortan antes de validar.
public record CrearInmueble(
		@NotBlank(message = "Mínimo 2 caracteres.")
		@Size(min = 2, max = 40, message = "El código debe tener entre 2 y 40 caracteres.")
		String codigo,

		@NotNull(message = "Selecciona el tipo.")
		TipoInmueble tipo,

		@NotBlank(message = "Escribe la dirección completa.")
		@Size(min = 5, max = 240, message = "Escribe la dirección completa.")
		String direccion,

		@Size(max = 80, message = "El barrio puede tener máximo 80 caracteres.")
		String barrio,

		@NotBlank(message = "Escribe la ciudad.")
		@Size(min = 2, max = 80, message = "Escribe la ciudad.")
		String ciudad,

		@NotBlank(message = "Escribe el departamento.")
		@Size(min = 2, max = 80, message = "Escribe el departamento.")
		String departamento,

		@NotNull(message = "Escribe un número.")
		@Min(value = 0, message = "No puede ser negativo.")
		@Max(value = 99, message = "Máximo 99.")
		Integer habitaciones,

		@NotNull(message = "Escribe un número.")
		@Min(value = 0, message = "No puede ser negativo.")
		@Max(value = 99, message = "Máximo 99.")
		Integer banos,

		@Positive(message = "Debe ser mayor que cero.")
		@DecimalMax(value = "99999", message = "Máximo 99999 m².")
		BigDecimal areaM2,

		@NotNull(message = "Selecciona un propietario.")
		UUID propietarioId,

		@Size(max = 1000, message = "La descripción puede tener máximo 1000 caracteres.")
		String descripcion) {

	public CrearInmueble {
		codigo = Textos.recortar(codigo);
		direccion = Textos.recortar(direccion);
		barrio = Textos.recortar(barrio);
		ciudad = Textos.recortar(ciudad);
		departamento = Textos.recortar(departamento);
		descripcion = Textos.recortar(descripcion);
	}
}
