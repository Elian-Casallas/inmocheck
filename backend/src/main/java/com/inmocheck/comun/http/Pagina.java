package com.inmocheck.comun.http;

import java.util.List;

// Respuesta de todo listado: { data: [...], meta: { page, pageSize, total, totalPages } }.
// Una lista vacía es 200 con data: [], nunca 404. Equivale a armarPaginado() del BFF.
public record Pagina<T>(List<T> data, Meta meta) {

	public record Meta(int page, int pageSize, long total, long totalPages) {
	}

	public static <T> Pagina<T> de(List<T> filas, long total, ParametrosPagina parametros) {
		long totalPaginas = (total + parametros.pageSize() - 1) / parametros.pageSize();
		return new Pagina<>(
				List.copyOf(filas),
				new Meta(parametros.page(), parametros.pageSize(), total, totalPaginas));
	}
}
