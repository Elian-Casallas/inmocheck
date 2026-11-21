package com.inmocheck.comun.http;

import com.inmocheck.comun.Textos;
import com.inmocheck.comun.errores.DatosInvalidosException;
import com.inmocheck.comun.errores.SolicitudInvalidaException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import tools.jackson.databind.JsonNode;

// Lee el cuerpo de un PATCH campo por campo. Hace falta porque en un cambio
// parcial hay TRES casos y Jackson 3 no los distingue en un record (un campo
// ausente y un null explícito llegan igual):
//   campo ausente        → null              → no se toca
//   "email": null        → Optional.empty()  → se borra el valor
//   "email": "a@b.co"    → Optional.of(...)  → se cambia
// También rechaza campos que no estén permitidos (como .strict() de Zod).
public final class CuerpoParcial {

	private final JsonNode cuerpo;
	private final List<ErrorDeCampo> errores = new ArrayList<>();

	private CuerpoParcial(JsonNode cuerpo) {
		this.cuerpo = cuerpo;
	}

	public static CuerpoParcial de(JsonNode cuerpo, Set<String> camposPermitidos) {
		if (cuerpo == null || !cuerpo.isObject()) {
			throw new SolicitudInvalidaException("El cuerpo debe ser un objeto JSON.");
		}
		CuerpoParcial parcial = new CuerpoParcial(cuerpo);
		for (String campo : cuerpo.propertyNames()) {
			if (!camposPermitidos.contains(campo)) {
				parcial.errores.add(new ErrorDeCampo(campo, "Este campo no está permitido."));
			}
		}
		return parcial;
	}

	// Texto recortado (trim). null = no vino; Optional.empty() = vino en null.
	public Optional<String> texto(String campo) {
		if (!cuerpo.has(campo)) {
			return null;
		}
		JsonNode valor = cuerpo.get(campo);
		if (valor.isNull()) {
			return Optional.empty();
		}
		if (!valor.isString()) {
			errores.add(new ErrorDeCampo(campo, "Debe ser un texto."));
			return null;
		}
		return Optional.of(Textos.recortar(valor.asString()));
	}

	// Llamar después de leer todos los campos.
	public void exigirSinErrores() {
		if (!errores.isEmpty()) {
			throw new DatosInvalidosException(errores);
		}
	}
}
