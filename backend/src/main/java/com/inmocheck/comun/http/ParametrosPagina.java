package com.inmocheck.comun.http;

import com.inmocheck.comun.Limites;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

// ?page=2&pageSize=20 de los listados (equivale a paginacionSchema de Zod).
// Un controller lo recibe así: listar(@Valid ParametrosPagina pagina).
// Si falta un valor se usa el de defecto; si no cumple las reglas, 422.
public record ParametrosPagina(
		@Min(value = 1, message = "La página debe ser 1 o mayor.")
		Integer page,

		@Min(value = 1, message = "El tamaño de página debe ser 1 o mayor.")
		@Max(value = Limites.PAGINA_TAMANO_MAXIMO,
				message = "El tamaño de página puede ser máximo " + Limites.PAGINA_TAMANO_MAXIMO + ".")
		Integer pageSize) {

	public ParametrosPagina {
		page = page == null ? 1 : page;
		pageSize = pageSize == null ? Limites.PAGINA_TAMANO_DEFECTO : pageSize;
	}

	// Filas que se saltan en la consulta (OFFSET).
	public long desde() {
		return (long) (page - 1) * pageSize;
	}
}
