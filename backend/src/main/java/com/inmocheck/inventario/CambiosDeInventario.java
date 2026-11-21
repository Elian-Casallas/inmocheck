package com.inmocheck.inventario;

import com.inmocheck.comun.errores.DatosInvalidosException;
import com.inmocheck.comun.http.CuerpoParcial;
import com.inmocheck.comun.http.ErrorDeCampo;
import com.inmocheck.inventario.InventarioDtos.CrearEspacio;
import jakarta.validation.Validator;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import tools.jackson.databind.JsonNode;

// Lee y valida el cuerpo de PATCH /espacios/{id} y PATCH /elementos/{id}
// (espacioEditarSchema, elementoEditarSchema). Aquí ningún campo se puede
// borrar: un null explícito es un error. Devuelve solo lo que llegó, listo
// para el UPDATE, con el nombre de columna como clave.
final class CambiosDeInventario {

	private static final Set<String> CAMPOS_ESPACIO = Set.of("nombre", "orden", "activo");
	private static final Set<String> CAMPOS_ELEMENTO = Set.of("nombre", "obligatorio", "orden", "activo");

	private CambiosDeInventario() {
	}

	static Map<String, Object> deEspacio(JsonNode cuerpo, Validator validador) {
		return leer(cuerpo, CAMPOS_ESPACIO, validador);
	}

	static Map<String, Object> deElemento(JsonNode cuerpo, Validator validador) {
		return leer(cuerpo, CAMPOS_ELEMENTO, validador);
	}

	private static Map<String, Object> leer(JsonNode cuerpo, Set<String> campos, Validator validador) {
		CuerpoParcial parcial = CuerpoParcial.de(cuerpo, campos);
		Map<String, Optional<?>> llegaron = new LinkedHashMap<>();
		if (campos.contains("nombre")) llegaron.put("nombre", parcial.texto("nombre"));
		if (campos.contains("orden")) llegaron.put("orden", parcial.entero("orden"));
		if (campos.contains("obligatorio")) llegaron.put("obligatorio", parcial.booleano("obligatorio"));
		if (campos.contains("activo")) llegaron.put("activo", parcial.booleano("activo"));
		parcial.exigirSinErrores();

		List<ErrorDeCampo> errores = new ArrayList<>();
		Map<String, Object> cambios = new LinkedHashMap<>();
		llegaron.forEach((campo, valor) -> {
			if (valor == null) {
				return;
			}
			if (valor.isEmpty()) {
				errores.add(new ErrorDeCampo(campo, mensajeSiFalta(campo)));
				return;
			}
			// nombre y orden siguen las MISMAS reglas que al crear.
			if (campo.equals("nombre") || campo.equals("orden")) {
				validador.validateValue(CrearEspacio.class, campo, valor.get())
						.forEach(violacion -> errores.add(new ErrorDeCampo(campo, violacion.getMessage())));
			}
			cambios.put(campo, valor.get());
		});
		if (!errores.isEmpty()) {
			throw new DatosInvalidosException(errores);
		}
		return cambios;
	}

	private static String mensajeSiFalta(String campo) {
		return switch (campo) {
			case "nombre" -> InventarioDtos.MENSAJE_NOMBRE;
			case "orden" -> "Escribe un número.";
			default -> "Debe ser verdadero o falso.";
		};
	}
}
