package com.inmocheck.comun.http;

// Respuesta de un recurso suelto: { "data": ... }, igual que el BFF.
// (Los listados usan Pagina<T>.)
public record Datos<T>(T data) {

	public static <T> Datos<T> de(T valor) {
		return new Datos<>(valor);
	}
}
