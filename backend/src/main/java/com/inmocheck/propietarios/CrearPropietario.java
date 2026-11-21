package com.inmocheck.propietarios;

import com.inmocheck.comun.Textos;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Cuerpo de POST /propietarios. Mismas reglas y mensajes que
// propietarioCrearSchema (schemas/propietarios.ts).
// Los textos se recortan (trim) antes de validar, como hace Zod.
public record CrearPropietario(
		@NotBlank(message = MENSAJE_NOMBRE)
		@Size(min = 2, max = 120, message = MENSAJE_NOMBRE)
		String nombre,

		@Email(regexp = ".+@.+\\..+", message = "Escribe un correo válido.")
		@Size(max = 160, message = "El correo puede tener máximo 160 caracteres.")
		String email,

		@Size(max = 30, message = "El teléfono puede tener máximo 30 caracteres.")
		String telefono) {

	static final String MENSAJE_NOMBRE = "Escribe el nombre completo.";

	public CrearPropietario {
		nombre = Textos.recortar(nombre);
		telefono = Textos.recortar(telefono);
	}
}
