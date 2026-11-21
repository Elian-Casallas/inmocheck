package com.inmocheck.inspectores;

import com.inmocheck.comun.Textos;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.UUID;

// Datos de los inspectores (equivalen a schemas/inspectores.ts).
public final class InspectoresDtos {

	static final String MENSAJE_NOMBRE = "Escribe el nombre completo.";

	private InspectoresDtos() {
	}

	// Un inspector en el listado (tipo Inspector del front).
	public record InspectorRespuesta(
			UUID id, String nombre, String email, boolean activo, OffsetDateTime createdAt, int inspeccionesAbiertas) {
	}

	// Respuesta de la invitación (igual que el BFF).
	public record InspectorInvitado(UUID id, String nombre, String email, boolean activo) {
	}

	// Cuerpo de POST /inspectores/invitaciones (inspectorInvitarSchema).
	// No hay campo rol ni organización: los pone el servidor.
	// El correo se guarda en minúsculas, como el .toLowerCase() de Zod.
	public record InvitarInspector(
			@NotBlank(message = MENSAJE_NOMBRE) @Size(min = 2, max = 120, message = MENSAJE_NOMBRE) String nombre,
			@NotBlank(message = "Escribe un correo válido.")
			@Email(regexp = ".+@.+\\..+", message = "Escribe un correo válido.") String email) {

		public InvitarInspector {
			nombre = Textos.recortar(nombre);
			email = email == null ? null : Textos.recortar(email).toLowerCase(Locale.ROOT);
		}
	}
}
