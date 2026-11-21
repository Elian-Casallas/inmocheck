package com.inmocheck.evidencias;

import java.util.Optional;

// Tipo de una foto según sus primeros bytes ("firma" del formato), no según
// la extensión ni el Content-Type que manda el navegador: ambos se pueden
// falsear. Solo JPG, PNG y WebP (equivale a detectarTipoImagen del BFF).
enum TipoImagen {
	JPEG("image/jpeg", "jpg"),
	PNG("image/png", "png"),
	WEBP("image/webp", "webp");

	private static final byte[] FIRMA_JPEG = { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF };
	private static final byte[] FIRMA_PNG = { (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
	private static final byte[] FIRMA_RIFF = { 0x52, 0x49, 0x46, 0x46 };
	private static final byte[] FIRMA_WEBP = { 0x57, 0x45, 0x42, 0x50 };

	private final String mime;
	private final String extension;

	TipoImagen(String mime, String extension) {
		this.mime = mime;
		this.extension = extension;
	}

	String mime() {
		return mime;
	}

	String extension() {
		return extension;
	}

	static Optional<TipoImagen> detectar(byte[] bytes) {
		if (empiezaCon(bytes, FIRMA_JPEG, 0)) return Optional.of(JPEG);
		if (empiezaCon(bytes, FIRMA_PNG, 0)) return Optional.of(PNG);
		// WebP: "RIFF" + 4 bytes de tamaño + "WEBP"
		if (empiezaCon(bytes, FIRMA_RIFF, 0) && empiezaCon(bytes, FIRMA_WEBP, 8)) return Optional.of(WEBP);
		return Optional.empty();
	}

	private static boolean empiezaCon(byte[] bytes, byte[] firma, int desde) {
		if (bytes.length < desde + firma.length) return false;
		for (int i = 0; i < firma.length; i++) {
			if (bytes[desde + i] != firma[i]) return false;
		}
		return true;
	}
}
