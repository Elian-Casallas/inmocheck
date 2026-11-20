package com.inmocheck.comun.http;

// Error de un campo del formulario: { "field": "email", "message": "Escribe un correo válido." }
public record ErrorDeCampo(String field, String message) {
}
