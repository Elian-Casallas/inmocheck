package com.inmocheck.comun;

// Ayudas para textos que llegan del cliente.
public final class Textos {

	private Textos() {
	}

	// Igual que .trim() de Zod: quita espacios al inicio y al final. null sigue null.
	public static String recortar(String texto) {
		return texto == null ? null : texto.strip();
	}
}
