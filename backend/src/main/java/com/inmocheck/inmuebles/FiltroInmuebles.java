package com.inmocheck.inmuebles;

import com.inmocheck.comun.Textos;

// ?search=&tipo=&activo=&sort= de GET /inmuebles (inmueblesFiltroSchema).
// Los valores ya llegan validados por el controller (lista cerrada).
public record FiltroInmuebles(String busqueda, TipoInmueble tipo, Boolean activo, Orden orden) {

	// Lista blanca: el ?sort= nunca se pega en el SQL; se traduce aquí.
	public enum Orden {
		CODIGO_ASC("i.codigo asc"),
		CODIGO_DESC("i.codigo desc"),
		CREADO_ASC("i.created_at asc"),
		CREADO_DESC("i.created_at desc");

		private final String sql;

		Orden(String sql) {
			this.sql = sql;
		}

		public String sql() {
			return sql;
		}

		static Orden de(String sort) {
			return switch (sort == null ? "codigo" : sort) {
				case "-codigo" -> CODIGO_DESC;
				case "createdAt" -> CREADO_ASC;
				case "-createdAt" -> CREADO_DESC;
				default -> CODIGO_ASC;
			};
		}
	}

	public static FiltroInmuebles de(String search, String tipo, String activo, String sort) {
		String busqueda = Textos.recortar(search);
		return new FiltroInmuebles(
				busqueda == null || busqueda.isEmpty() ? null : busqueda,
				tipo == null ? null : TipoInmueble.valueOf(tipo),
				activo == null ? null : Boolean.valueOf(activo),
				Orden.de(sort));
	}
}
