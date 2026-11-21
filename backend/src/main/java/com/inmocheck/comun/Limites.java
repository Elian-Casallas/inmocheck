package com.inmocheck.comun;

// Límites del negocio en un solo lugar (equivale a lib/constantes.ts del front).
// Deben coincidir con los del front para que ambos validen igual.
public final class Limites {

	public static final int PAGINA_TAMANO_DEFECTO = 20;
	public static final int PAGINA_TAMANO_MAXIMO = 100;

	public static final int FOTO_TAMANO_MAXIMO_MB = 10;
	public static final long FOTO_TAMANO_MAXIMO_BYTES = FOTO_TAMANO_MAXIMO_MB * 1024L * 1024L;
	public static final int FOTOS_MAXIMAS_POR_ELEMENTO = 8;
	public static final int FOTO_DESCRIPCION_MAXIMA = 300;

	// Vida de los enlaces firmados de fotos y PDF.
	public static final int URL_FIRMADA_SEGUNDOS = 60;

	private Limites() {
	}
}
