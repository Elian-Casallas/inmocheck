package com.inmocheck.comun.http;

import com.inmocheck.comun.Textos;
import com.inmocheck.comun.errores.DatosInvalidosException;
import com.inmocheck.comun.errores.SolicitudInvalidaException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.function.Predicate;
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
		return leer(campo, JsonNode::isString, valor -> Textos.recortar(valor.asString()), "Debe ser un texto.");
	}

	// Número entero (no acepta 2.5 ni "2", como z.number().int()).
	public Optional<Integer> entero(String campo) {
		return leer(campo, valor -> valor.isIntegralNumber() && valor.canConvertToInt(),
				JsonNode::asInt, "Escribe un número entero.");
	}

	// Número con decimales (p. ej. el área).
	public Optional<BigDecimal> decimal(String campo) {
		return leer(campo, JsonNode::isNumber, JsonNode::decimalValue, "Escribe un número.");
	}

	public Optional<Boolean> booleano(String campo) {
		return leer(campo, JsonNode::isBoolean, JsonNode::asBoolean, "Debe ser verdadero o falso.");
	}

	public Optional<UUID> uuid(String campo, String mensaje) {
		return leer(campo, valor -> valor.isString() && esUuid(valor.asString()),
				valor -> UUID.fromString(valor.asString()), mensaje);
	}

	// Uno de los valores de una lista cerrada (enum), escrito igual que en la base.
	public <E extends Enum<E>> Optional<E> opcion(String campo, Class<E> opciones, String mensaje) {
		return leer(campo, valor -> valor.isString() && esOpcion(opciones, valor.asString()),
				valor -> Enum.valueOf(opciones, valor.asString()), mensaje);
	}

	// Llamar después de leer todos los campos.
	public void exigirSinErrores() {
		if (!errores.isEmpty()) {
			throw new DatosInvalidosException(errores);
		}
	}

	// Mismo patrón para todos los tipos: ausente → null, null → vacío,
	// tipo correcto → valor, tipo equivocado → error del campo.
	private <T> Optional<T> leer(String campo, Predicate<JsonNode> esValido, Function<JsonNode, T> convertir,
			String mensaje) {
		if (!cuerpo.has(campo)) {
			return null;
		}
		JsonNode valor = cuerpo.get(campo);
		if (valor.isNull()) {
			return Optional.empty();
		}
		if (!esValido.test(valor)) {
			errores.add(new ErrorDeCampo(campo, mensaje));
			return null;
		}
		return Optional.of(convertir.apply(valor));
	}

	private static boolean esUuid(String texto) {
		try {
			UUID.fromString(texto);
			return texto.length() == 36;
		} catch (IllegalArgumentException e) {
			return false;
		}
	}

	private static <E extends Enum<E>> boolean esOpcion(Class<E> opciones, String texto) {
		return Arrays.stream(opciones.getEnumConstants()).anyMatch(opcion -> opcion.name().equals(texto));
	}
}
