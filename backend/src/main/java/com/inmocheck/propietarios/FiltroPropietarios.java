package com.inmocheck.propietarios;

import com.inmocheck.comun.Textos;

// ?search=&inmuebles=con|sin de GET /propietarios (propietariosFiltroSchema).
// Un valor de "inmuebles" que no sea con/sin se ignora, como el .catch() de Zod.
public record FiltroPropietarios(String busqueda, ConInmuebles inmuebles) {

	public enum ConInmuebles {
		CON, SIN
	}

	public static FiltroPropietarios de(String search, String inmuebles) {
		String busqueda = Textos.recortar(search);
		return new FiltroPropietarios(
				busqueda == null || busqueda.isEmpty() ? null : busqueda,
				switch (inmuebles == null ? "" : inmuebles) {
					case "con" -> ConInmuebles.CON;
					case "sin" -> ConInmuebles.SIN;
					default -> null;
				});
	}
}
