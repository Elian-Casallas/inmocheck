package com.inmocheck.inmuebles;

import com.inmocheck.comun.http.CuerpoParcial;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import tools.jackson.databind.JsonNode;

// Cuerpo de PATCH /inmuebles/{id} (inmuebleEditarSchema): los campos de
// CrearInmueble, todos opcionales, más "activo" para reactivar o desactivar.
// Cada campo: null = no vino, Optional.empty() = vino en null, Optional.of(x) = cambia.
public record EditarInmueble(
		Optional<String> codigo,
		Optional<TipoInmueble> tipo,
		Optional<String> direccion,
		Optional<String> barrio,
		Optional<String> ciudad,
		Optional<String> departamento,
		Optional<Integer> habitaciones,
		Optional<Integer> banos,
		Optional<BigDecimal> areaM2,
		Optional<UUID> propietarioId,
		Optional<String> descripcion,
		Optional<Boolean> activo) {

	private static final Set<String> CAMPOS = Set.of(
			"codigo", "tipo", "direccion", "barrio", "ciudad", "departamento",
			"habitaciones", "banos", "areaM2", "propietarioId", "descripcion", "activo");

	public static EditarInmueble desde(JsonNode cuerpo) {
		CuerpoParcial parcial = CuerpoParcial.de(cuerpo, CAMPOS);
		EditarInmueble datos = new EditarInmueble(
				parcial.texto("codigo"),
				parcial.opcion("tipo", TipoInmueble.class, "Selecciona el tipo."),
				parcial.texto("direccion"),
				parcial.texto("barrio"),
				parcial.texto("ciudad"),
				parcial.texto("departamento"),
				parcial.entero("habitaciones"),
				parcial.entero("banos"),
				parcial.decimal("areaM2"),
				parcial.uuid("propietarioId", "Selecciona un propietario."),
				parcial.texto("descripcion"),
				parcial.booleano("activo"));
		parcial.exigirSinErrores();
		return datos;
	}

	// DELETE /inmuebles/{id} es este mismo cambio: solo desactivar.
	public static EditarInmueble desactivar() {
		return new EditarInmueble(null, null, null, null, null, null, null, null, null, null, null,
				Optional.of(false));
	}

	public boolean desactiva() {
		return activo != null && activo.equals(Optional.of(false));
	}
}
