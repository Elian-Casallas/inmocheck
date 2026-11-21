package com.inmocheck.evidencias;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

// El tipo sale de los primeros bytes, no del nombre ni del Content-Type.
class TipoImagenTest {

	@Test
	void reconoceJpgPngYWebp() {
		assertThat(TipoImagen.detectar(new byte[] { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00 })).contains(TipoImagen.JPEG);
		assertThat(TipoImagen.detectar(new byte[] { (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00 }))
				.contains(TipoImagen.PNG);
		assertThat(TipoImagen.detectar("RIFF\0\0\0\0WEBPVP8 ".getBytes(StandardCharsets.ISO_8859_1))).contains(TipoImagen.WEBP);
	}

	@Test
	void rechazaLoQueNoEsUnaFotoAunqueSeLlameFotoJpg() {
		assertThat(TipoImagen.detectar("<script>alert(1)</script>".getBytes(StandardCharsets.UTF_8))).isEmpty();
		assertThat(TipoImagen.detectar("%PDF-1.7".getBytes(StandardCharsets.UTF_8))).isEmpty();
		assertThat(TipoImagen.detectar("RIFF\0\0\0\0WAVE".getBytes(StandardCharsets.ISO_8859_1))).isEmpty();
		assertThat(TipoImagen.detectar(new byte[] { (byte) 0xFF })).isEmpty();
	}
}
