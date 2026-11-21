package com.inmocheck.informes;

import static org.assertj.core.api.Assertions.assertThat;

import com.inmocheck.informes.ActaPdf.Bloque;
import com.inmocheck.informes.ActaPdf.DatosActa;
import com.inmocheck.informes.ActaPdf.FotoActa;
import com.inmocheck.inspecciones.InspeccionesDtos.DetalleRespuesta;
import com.inmocheck.inspecciones.InspeccionesDtos.EstadoElemento;
import com.inmocheck.inspecciones.InspeccionesDtos.TipoInspeccion;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;

// El acta en PDF (equivale a tests/unit/acta.test.ts) y la cuadrícula de fotos.
// Deja una copia en target/acta-ejemplo.pdf para revisarla a ojo.
class ActaPdfTest {

	@Test
	void generaUnPdfValidoSinFotos() {
		byte[] pdf = ActaPdf.generar(datos(List.of(), null));
		assertThat(new String(pdf, 0, 5, StandardCharsets.ISO_8859_1)).isEqualTo("%PDF-");
	}

	@Test
	void generaUnPdfConFotosDeVariosEspaciosYElementos() throws IOException {
		List<FotoActa> fotos = new ArrayList<>();
		for (int i = 0; i < 6; i++) fotos.add(new FotoActa("Cocina", "Paredes", imagen("jpg", 1200, 1600, i)));
		fotos.add(new FotoActa("Cocina", "Grifería", imagen("png", 1600, 900, 7)));
		fotos.add(new FotoActa("Baño principal", "Ducha", imagen("jpg", 800, 800, 8)));
		fotos.add(new FotoActa("Baño principal", "Espejo", new byte[] { 1, 2, 3 })); // dañada: no rompe el acta

		byte[] pdf = ActaPdf.generar(datos(fotos, "11 elementos comparados, 10 con cambio de estado y 2 no comparables."));

		assertThat(new String(pdf, 0, 5, StandardCharsets.ISO_8859_1)).isEqualTo("%PDF-");
		assertThat(pdf.length).isGreaterThan(5_000);
		Path ejemplo = Path.of("target", "acta-ejemplo.pdf");
		Files.createDirectories(ejemplo.getParent());
		Files.write(ejemplo, pdf);
	}

	@Test
	void unElementoConMasDeCuatroFotosSeParteYLasFilasNoPasanDe515() {
		Map<String, List<FotoActa>> elementos = new LinkedHashMap<>();
		elementos.put("Paredes", repetir(6));
		elementos.put("Piso", repetir(2));
		elementos.put("Techo", repetir(1));

		List<List<Bloque>> filas = ActaPdf.empaquetarEnFilas(elementos);

		// Paredes(4) | Paredes (continuación)(2) + Piso(2) | Techo(1)
		assertThat(filas).hasSize(3);
		assertThat(filas.get(0).get(0).titulo()).isEqualTo("Paredes");
		assertThat(filas.get(1).get(0).titulo()).isEqualTo("Paredes (continuación)");
		assertThat(filas.get(1)).extracting(Bloque::titulo).containsExactly("Paredes (continuación)", "Piso");
		for (List<Bloque> fila : filas) {
			float ancho = (float) fila.stream().mapToDouble(Bloque::ancho).sum() + (fila.size() - 1) * 14;
			assertThat(ancho).isLessThanOrEqualTo(515);
		}
	}

	@Test
	void formateaLaFechaComoElFront() {
		assertThat(FormatoActa.fechaHora(OffsetDateTime.parse("2026-10-10T13:27:00Z")))
				.isEqualTo("10 de oct de 2026, 8:27 a. m.");
		assertThat(FormatoActa.fechaHora(OffsetDateTime.parse("2026-11-21T23:05:00Z")))
				.isEqualTo("21 de nov de 2026, 6:05 p. m.");
		assertThat(FormatoActa.codigoDeInforme(UUID.fromString("cab6b398-1111-4000-8000-000000000000"),
				OffsetDateTime.parse("2026-10-10T13:27:00Z"))).isEqualTo("INF-2026-CAB6B398");
	}

	// ---------- Datos de ejemplo ----------

	private static DatosActa datos(List<FotoActa> fotos, String resumen) {
		List<DetalleRespuesta> detalles = new ArrayList<>();
		String[][] filas = {
				{ "Cocina", "Paredes", "REGULAR", "Mancha de humedad junto a la ventana." },
				{ "Cocina", "Piso", "BUENO", null },
				{ "Cocina", "Grifería", "DANADO", "Gotea la llave del lavaplatos." },
				{ "Baño principal", "Ducha", "EXCELENTE", null },
				{ "Baño principal", "Espejo", "NO_APLICA", "No hay espejo instalado." },
				{ "Sala comedor", "Ventanas", null, null } };
		for (String[] fila : filas) {
			detalles.add(new DetalleRespuesta(UUID.randomUUID(), UUID.randomUUID(), fila[0], fila[1], true,
					fila[2] == null ? null : EstadoElemento.valueOf(fila[2]), fila[3], 2, List.of()));
		}
		return new DatosActa("INF-2026-CAB6B398", 2, "Inmobiliaria Los Pinos", TipoInspeccion.SALIDA,
				"APT-302 · Calle 10 #20-30, apartamento 302 · Villavicencio", "María López", "Laura Díaz",
				OffsetDateTime.parse("2026-10-10T13:00:00Z"), OffsetDateTime.parse("2026-10-10T13:27:00Z"),
				OffsetDateTime.parse("2026-11-21T23:05:00Z"), detalles, resumen, fotos);
	}

	private static List<FotoActa> repetir(int cantidad) {
		List<FotoActa> fotos = new ArrayList<>();
		for (int i = 0; i < cantidad; i++) fotos.add(new FotoActa("Cocina", "x", new byte[0]));
		return fotos;
	}

	// Imagen de prueba: franjas de color, para notar el recorte en el PDF.
	private static byte[] imagen(String formato, int ancho, int alto, int semilla) throws IOException {
		BufferedImage imagen = new BufferedImage(ancho, alto, BufferedImage.TYPE_INT_RGB);
		Graphics2D lapiz = imagen.createGraphics();
		Color[] colores = { new Color(0x1d4ed8), new Color(0x15803d), new Color(0xb45309), new Color(0xb91c1c) };
		for (int franja = 0; franja < 4; franja++) {
			lapiz.setColor(colores[(franja + semilla) % 4]);
			lapiz.fillRect(0, franja * alto / 4, ancho, alto / 4);
		}
		lapiz.dispose();
		ByteArrayOutputStream salida = new ByteArrayOutputStream();
		ImageIO.write(imagen, formato, salida);
		return salida.toByteArray();
	}
}
