package com.inmocheck.comparacion;

import com.inmocheck.comparacion.ComparacionService.Resultado;
import com.inmocheck.comun.errores.DatosInvalidosException;
import com.inmocheck.comun.http.Datos;
import com.inmocheck.comun.http.ErrorDeCampo;
import com.inmocheck.comun.sesion.Actor;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// GET /api/v1/inspecciones/{salidaId}/comparacion?contra={entradaId}
// Administrador e inspector, cada uno con lo que RLS le deja ver.
@RestController
public class ComparacionController {

	private final ComparacionService servicio;

	public ComparacionController(ComparacionService servicio) {
		this.servicio = servicio;
	}

	@GetMapping("/api/v1/inspecciones/{id}/comparacion")
	Datos<Resultado> comparar(Actor actor, @PathVariable UUID id, @RequestParam(required = false) String contra) {
		return Datos.de(servicio.comparar(actor, id, entradaId(contra)));
	}

	// ?contra es obligatorio y debe ser un UUID: si no, 422 en el campo (como Zod).
	private static UUID entradaId(String contra) {
		try {
			return UUID.fromString(contra);
		} catch (IllegalArgumentException | NullPointerException e) {
			throw new DatosInvalidosException(List.of(new ErrorDeCampo("contra", "Identificador inválido.")));
		}
	}
}
