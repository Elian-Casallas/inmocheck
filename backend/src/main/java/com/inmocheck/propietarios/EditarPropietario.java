package com.inmocheck.propietarios;

import com.inmocheck.comun.http.CuerpoParcial;
import java.util.Optional;
import java.util.Set;
import tools.jackson.databind.JsonNode;

// Cuerpo de PATCH /propietarios/{id}: cambio parcial (propietarioEditarSchema).
// Cada campo: null = no vino (no se toca), Optional.empty() = vino en null
// (se borra), Optional.of(x) = se cambia. Ver CuerpoParcial.
// Las reglas de cada valor son las de CrearPropietario; las aplica el servicio.
public record EditarPropietario(
		Optional<String> nombre,
		Optional<String> email,
		Optional<String> telefono) {

	private static final Set<String> CAMPOS = Set.of("nombre", "email", "telefono");

	public static EditarPropietario desde(JsonNode cuerpo) {
		CuerpoParcial parcial = CuerpoParcial.de(cuerpo, CAMPOS);
		EditarPropietario datos = new EditarPropietario(
				parcial.texto("nombre"),
				parcial.texto("email"),
				parcial.texto("telefono"));
		parcial.exigirSinErrores();
		return datos;
	}

	public boolean estaVacio() {
		return nombre == null && email == null && telefono == null;
	}
}
