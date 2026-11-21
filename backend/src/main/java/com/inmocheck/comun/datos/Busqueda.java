package com.inmocheck.comun.datos;

// Arma el patrón de una búsqueda "contiene" para ILIKE.
public final class Busqueda {

	private Busqueda() {
	}

	// En ILIKE, % y _ son comodines: buscar "50%" debe encontrar "50%", no todo.
	// El texto va siempre como parámetro (:patron), nunca pegado en el SQL.
	public static String contiene(String texto) {
		return "%" + texto.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
	}
}
