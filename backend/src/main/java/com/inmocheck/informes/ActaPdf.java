package com.inmocheck.informes;

import com.inmocheck.inspecciones.InspeccionesDtos.DetalleRespuesta;
import com.inmocheck.inspecciones.InspeccionesDtos.TipoInspeccion;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.openpdf.text.Chunk;
import org.openpdf.text.Document;
import org.openpdf.text.Element;
import org.openpdf.text.Font;
import org.openpdf.text.Image;
import org.openpdf.text.PageSize;
import org.openpdf.text.Paragraph;
import org.openpdf.text.Phrase;
import org.openpdf.text.Rectangle;
import org.openpdf.text.pdf.ColumnText;
import org.openpdf.text.pdf.PdfContentByte;
import org.openpdf.text.pdf.PdfPCell;
import org.openpdf.text.pdf.PdfPTable;
import org.openpdf.text.pdf.PdfPageEventHelper;
import org.openpdf.text.pdf.PdfTemplate;
import org.openpdf.text.pdf.PdfWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

// El acta de inspección en PDF (reemplaza server/pdf/acta.tsx, hecho con react-pdf).
// Mismo contenido, orden y medidas. Se arma SOLO con DatosActa: los nombres de
// espacios y elementos vienen de la copia (snapshot) de la inspección, así el
// acta refleja lo que se revisó ese día aunque luego cambie el inventario.
final class ActaPdf {

	private static final Logger log = LoggerFactory.getLogger(ActaPdf.class);

	record FotoActa(String espacio, String elemento, byte[] datos) {
	}

	record DatosActa(
			String codigoInforme,
			int version,
			String organizacion,
			TipoInspeccion tipo,
			String inmueble,
			String propietario,
			String inspector,
			OffsetDateTime programadaPara,
			OffsetDateTime finalizadaEn,
			OffsetDateTime generadoEn,
			List<DetalleRespuesta> detalles,
			String resumenComparacion,
			List<FotoActa> fotos) {
	}

	// ---------- Medidas (en puntos), iguales a acta.tsx ----------
	// Una hoja A4 con márgenes de 40 deja 515 de ancho útil: caben 4 fotos de
	// 118 con 3 separaciones de 14.
	private static final float MARGEN = 40;
	private static final float MARGEN_INFERIOR = 60; // deja espacio al pie fijo
	private static final float ANCHO_UTIL = 515;
	private static final float ANCHO_FOTO = 118;
	private static final float ALTO_FOTO = 96;
	private static final float SEPARACION = 14;
	private static final int FOTOS_POR_FILA = 4;
	private static final float RADIO_FOTO = 3;

	private static final Color TEXTO = new Color(0x0f, 0x17, 0x2a);
	private static final Color TENUE = new Color(0x64, 0x74, 0x8b);
	private static final Color BORDE = new Color(0xe2, 0xe8, 0xf0);
	private static final Color PRIMARIO = new Color(0x1d, 0x4e, 0xd8);
	private static final Color SUTIL = new Color(0xf1, 0xf5, 0xf9);

	private static final Font CUERPO = new Font(Font.HELVETICA, 9.5f, Font.NORMAL, TEXTO);
	private static final Font CUERPO_TENUE = new Font(Font.HELVETICA, 9.5f, Font.NORMAL, TENUE);
	private static final Font MARCA = new Font(Font.HELVETICA, 13, Font.BOLD, PRIMARIO);
	private static final Font TITULO = new Font(Font.HELVETICA, 16, Font.BOLD, TEXTO);
	private static final Font ETIQUETA = new Font(Font.HELVETICA, 8.5f, Font.NORMAL, TENUE);
	private static final Font SECCION = new Font(Font.HELVETICA, 11, Font.BOLD, TEXTO);
	private static final Font ESPACIO = new Font(Font.HELVETICA, 10.5f, Font.BOLD, TEXTO);
	private static final Font ELEMENTO = new Font(Font.HELVETICA, 9, Font.NORMAL, TENUE);
	private static final Font PIE = new Font(Font.HELVETICA, 8, Font.NORMAL, TENUE);

	private ActaPdf() {
	}

	static byte[] generar(DatosActa datos) {
		ByteArrayOutputStream salida = new ByteArrayOutputStream();
		Document documento = new Document(PageSize.A4, MARGEN, MARGEN, MARGEN, MARGEN_INFERIOR);
		PdfWriter escritor = PdfWriter.getInstance(documento, salida);
		escritor.setPageEvent(new Pie(datos.generadoEn()));

		String tipo = FormatoActa.tipo(datos.tipo()).toLowerCase(Locale.ROOT);
		documento.addTitle("Acta de inspección de " + tipo + " · " + datos.inmueble());
		documento.addAuthor(datos.organizacion());
		documento.open();

		documento.add(encabezado(datos));
		documento.add(new Paragraph("Acta de inspección de " + tipo, TITULO));
		documento.add(new Paragraph(datos.organizacion(), CUERPO_TENUE));
		documento.add(datosGenerales(datos));

		documento.add(seccion("Resultado por elemento"));
		documento.add(tablaDeResultados(datos.detalles()));

		if (datos.resumenComparacion() != null) {
			documento.add(seccion("Diferencias con la inspección de entrada"));
			documento.add(new Paragraph(datos.resumenComparacion(), CUERPO));
		}

		if (!datos.fotos().isEmpty()) {
			documento.add(seccion("Evidencias fotográficas"));
			agregarFotos(documento, escritor, datos.fotos());
		}

		documento.close();
		return salida.toByteArray();
	}

	// ---------- Partes del acta ----------

	private static PdfPTable encabezado(DatosActa datos) {
		PdfPTable tabla = tablaSinBordes(2);
		tabla.addCell(celda(new Phrase("InmoCheck", MARCA)));
		PdfPCell codigo = celda(new Phrase(datos.codigoInforme() + " · Versión " + datos.version(), CUERPO_TENUE));
		codigo.setHorizontalAlignment(Element.ALIGN_RIGHT);
		tabla.addCell(codigo);
		tabla.setSpacingAfter(18);
		return tabla;
	}

	private static PdfPTable datosGenerales(DatosActa datos) {
		PdfPTable tabla = tablaSinBordes(2);
		tabla.setSpacingBefore(14);
		tabla.setSpacingAfter(14);
		List<String[]> lista = new ArrayList<>();
		lista.add(new String[] { "Inmueble", datos.inmueble() });
		lista.add(new String[] { "Inspector", datos.inspector() });
		if (datos.propietario() != null) {
			lista.add(new String[] { "Propietario", datos.propietario() });
		}
		lista.add(new String[] { "Fecha programada", FormatoActa.fechaHora(datos.programadaPara()) });
		lista.add(new String[] { "Inspección finalizada", FormatoActa.fechaHora(datos.finalizadaEn()) });
		for (String[] dato : lista) {
			Phrase texto = new Phrase();
			texto.add(new Chunk(dato[0] + "\n", ETIQUETA));
			texto.add(new Chunk(dato[1], CUERPO));
			PdfPCell celda = celda(texto);
			celda.setPaddingBottom(8);
			celda.setPaddingRight(10);
			tabla.addCell(celda);
		}
		tabla.completeRow();
		return tabla;
	}

	private static PdfPTable tablaDeResultados(List<DetalleRespuesta> detalles) {
		PdfPTable tabla = new PdfPTable(new float[] { 20, 22, 14, 44 });
		tabla.setWidthPercentage(100);
		tabla.setHeaderRows(1); // la cabecera se repite en cada página
		tabla.setSplitRows(false); // una fila nunca se parte entre páginas
		for (String titulo : List.of("Espacio", "Elemento", "Estado", "Observación")) {
			PdfPCell celda = celdaDeFila(new Phrase(titulo, ETIQUETA));
			celda.setBackgroundColor(SUTIL);
			tabla.addCell(celda);
		}
		for (DetalleRespuesta detalle : detalles) {
			tabla.addCell(celdaDeFila(new Phrase(detalle.espacioNombre(), CUERPO)));
			tabla.addCell(celdaDeFila(new Phrase(detalle.elementoNombre(), CUERPO)));
			tabla.addCell(celdaDeFila(new Phrase(FormatoActa.estado(detalle.estado()), CUERPO)));
			tabla.addCell(celdaDeFila(new Phrase(detalle.observacion() == null ? "" : detalle.observacion(), CUERPO)));
		}
		return tabla;
	}

	// Las fotos van clasificadas: espacio → elemento, en el orden de la tabla.
	private static void agregarFotos(Document documento, PdfWriter escritor, List<FotoActa> fotos) {
		Map<String, Map<String, List<FotoActa>>> porEspacio = new LinkedHashMap<>();
		for (FotoActa foto : fotos) {
			porEspacio.computeIfAbsent(foto.espacio(), espacio -> new LinkedHashMap<>())
					.computeIfAbsent(foto.elemento(), elemento -> new ArrayList<>())
					.add(foto);
		}
		porEspacio.forEach((espacio, elementos) -> {
			List<List<Bloque>> filas = empaquetarEnFilas(elementos);
			for (int indice = 0; indice < filas.size(); indice++) {
				// El título del espacio viaja pegado a su primera fila: nunca
				// queda solo al final de una página.
				documento.add(filaDeFotos(escritor, indice == 0 ? espacio : null, filas.get(indice)));
			}
		});
	}

	// ---------- Cuadrícula de fotos (mismo cálculo que empaquetarEnFilas de acta.tsx) ----------

	record Bloque(String titulo, List<FotoActa> fotos) {
		float ancho() {
			return fotos.size() * ANCHO_FOTO + (fotos.size() - 1) * SEPARACION;
		}
	}

	// Acomoda los elementos uno al lado del otro y pasa a la siguiente fila
	// cuando ya no caben. Un elemento con más de 4 fotos se parte en bloques.
	static List<List<Bloque>> empaquetarEnFilas(Map<String, List<FotoActa>> elementos) {
		List<Bloque> bloques = new ArrayList<>();
		elementos.forEach((nombre, fotosDelElemento) -> {
			for (int inicio = 0; inicio < fotosDelElemento.size(); inicio += FOTOS_POR_FILA) {
				bloques.add(new Bloque(inicio == 0 ? nombre : nombre + " (continuación)",
						fotosDelElemento.subList(inicio, Math.min(inicio + FOTOS_POR_FILA, fotosDelElemento.size()))));
			}
		});

		List<List<Bloque>> filas = new ArrayList<>();
		List<Bloque> fila = new ArrayList<>();
		float ocupado = 0;
		for (Bloque bloque : bloques) {
			float conBloque = ocupado + (fila.isEmpty() ? 0 : SEPARACION) + bloque.ancho();
			if (!fila.isEmpty() && conBloque > ANCHO_UTIL) {
				filas.add(fila);
				fila = new ArrayList<>();
				ocupado = 0;
			}
			ocupado += (fila.isEmpty() ? 0 : SEPARACION) + bloque.ancho();
			fila.add(bloque);
		}
		if (!fila.isEmpty()) {
			filas.add(fila);
		}
		return filas;
	}

	// Una fila de bloques en una tabla de ancho fijo que NO se parte entre páginas.
	private static PdfPTable filaDeFotos(PdfWriter escritor, String tituloEspacio, List<Bloque> fila) {
		List<Float> anchos = new ArrayList<>();
		for (int i = 0; i < fila.size(); i++) {
			if (i > 0) anchos.add(SEPARACION);
			anchos.add(fila.get(i).ancho());
		}
		float usado = (float) anchos.stream().mapToDouble(Float::doubleValue).sum();
		anchos.add(Math.max(ANCHO_UTIL - usado, 0.01f)); // relleno hasta el ancho útil

		PdfPTable tabla = new PdfPTable(anchos.size());
		tabla.setTotalWidth(toArray(anchos));
		tabla.setLockedWidth(true);
		tabla.setHorizontalAlignment(Element.ALIGN_LEFT);
		tabla.setKeepTogether(true);
		tabla.setSpacingBefore(4);
		tabla.setSpacingAfter(8);

		if (tituloEspacio != null) {
			PdfPCell titulo = celda(new Phrase(tituloEspacio, ESPACIO));
			titulo.setColspan(anchos.size());
			titulo.setBorder(Rectangle.BOTTOM);
			titulo.setBorderColor(BORDE);
			titulo.setBorderWidth(0.5f);
			titulo.setPaddingTop(10);
			titulo.setPaddingBottom(3);
			tabla.addCell(titulo);
			PdfPCell espacio = celda(new Phrase(" ", ETIQUETA));
			espacio.setColspan(anchos.size());
			espacio.setFixedHeight(4);
			tabla.addCell(espacio);
		}

		for (int i = 0; i < fila.size(); i++) {
			if (i > 0) tabla.addCell(celda(new Phrase("")));
			tabla.addCell(bloqueDeFotos(escritor, fila.get(i)));
		}
		tabla.addCell(celda(new Phrase("")));
		return tabla;
	}

	private static PdfPCell bloqueDeFotos(PdfWriter escritor, Bloque bloque) {
		PdfPTable interior = tablaSinBordes(1);
		PdfPCell titulo = celda(new Phrase(bloque.titulo(), ELEMENTO));
		titulo.setPaddingBottom(3);
		interior.addCell(titulo);

		List<Float> anchos = new ArrayList<>();
		for (int i = 0; i < bloque.fotos().size(); i++) {
			if (i > 0) anchos.add(SEPARACION);
			anchos.add(ANCHO_FOTO);
		}
		PdfPTable fotos = new PdfPTable(anchos.size());
		fotos.setTotalWidth(toArray(anchos));
		fotos.setLockedWidth(true);
		fotos.setHorizontalAlignment(Element.ALIGN_LEFT);
		for (int i = 0; i < bloque.fotos().size(); i++) {
			if (i > 0) fotos.addCell(celda(new Phrase("")));
			PdfPCell celdaFoto = new PdfPCell(fotoRecortada(escritor, bloque.fotos().get(i).datos()), false);
			celdaFoto.setBorder(Rectangle.NO_BORDER);
			celdaFoto.setPadding(0);
			celdaFoto.setFixedHeight(ALTO_FOTO);
			fotos.addCell(celdaFoto);
		}
		PdfPCell contenedor = celda(fotos);
		interior.addCell(contenedor);

		PdfPCell celda = celda(interior);
		celda.setPadding(0);
		return celda;
	}

	// La foto llena su marco de 118 × 96 y lo que sobra se recorta, con
	// esquinas redondeadas (como objectFit: "cover" y borderRadius: 3).
	// Si una foto está dañada, se deja el marco vacío en vez de fallar el acta.
	private static Image fotoRecortada(PdfWriter escritor, byte[] datos) {
		PdfTemplate marco = escritor.getDirectContent().createTemplate(ANCHO_FOTO, ALTO_FOTO);
		try {
			Image original = Image.getInstance(datos);
			float escala = Math.max(ANCHO_FOTO / original.getWidth(), ALTO_FOTO / original.getHeight());
			float ancho = original.getWidth() * escala;
			float alto = original.getHeight() * escala;
			marco.roundRectangle(0, 0, ANCHO_FOTO, ALTO_FOTO, RADIO_FOTO);
			marco.clip();
			marco.newPath();
			original.scaleAbsolute(ancho, alto);
			original.setAbsolutePosition((ANCHO_FOTO - ancho) / 2, (ALTO_FOTO - alto) / 2);
			marco.addImage(original);
		} catch (Exception error) {
			log.warn("Una foto del acta no se pudo leer; se deja el marco vacío", error);
			marco.setColorFill(SUTIL);
			marco.roundRectangle(0, 0, ANCHO_FOTO, ALTO_FOTO, RADIO_FOTO);
			marco.fill();
		}
		return Image.getInstance(marco);
	}

	// ---------- Pie fijo en cada página ----------

	private static final class Pie extends PdfPageEventHelper {

		private final String texto;

		Pie(OffsetDateTime generadoEn) {
			this.texto = "Generado el " + FormatoActa.fechaHora(generadoEn) + " a partir de la inspección finalizada. "
					+ "Las diferencias registradas describen cambios de estado y no determinan responsabilidades.";
		}

		@Override
		public void onEndPage(PdfWriter escritor, Document documento) {
			PdfContentByte lienzo = escritor.getDirectContent();
			float izquierda = MARGEN;
			float derecha = documento.getPageSize().getWidth() - MARGEN;
			float lineaY = 24 + 22;
			lienzo.setColorStroke(BORDE);
			lienzo.setLineWidth(0.5f);
			lienzo.moveTo(izquierda, lineaY);
			lienzo.lineTo(derecha, lineaY);
			lienzo.stroke();

			// Interlineado de 10 pt: el texto ocupa dos líneas y deben caber completas.
			ColumnText columna = new ColumnText(lienzo);
			columna.setSimpleColumn(izquierda, 10, derecha, lineaY - 4);
			columna.addText(new Phrase(10, texto, PIE));
			columna.go();
		}
	}

	// ---------- Ayudas ----------

	private static Paragraph seccion(String titulo) {
		Paragraph parrafo = new Paragraph(titulo, SECCION);
		parrafo.setSpacingBefore(10);
		parrafo.setSpacingAfter(6);
		return parrafo;
	}

	private static PdfPTable tablaSinBordes(int columnas) {
		PdfPTable tabla = new PdfPTable(columnas);
		tabla.setWidthPercentage(100);
		tabla.getDefaultCell().setBorder(Rectangle.NO_BORDER);
		return tabla;
	}

	private static PdfPCell celda(Phrase texto) {
		PdfPCell celda = new PdfPCell(texto);
		celda.setBorder(Rectangle.NO_BORDER);
		celda.setPadding(0);
		return celda;
	}

	private static PdfPCell celda(PdfPTable tabla) {
		PdfPCell celda = new PdfPCell(tabla);
		celda.setBorder(Rectangle.NO_BORDER);
		celda.setPadding(0);
		return celda;
	}

	// Fila de la tabla de resultados: solo una línea fina abajo.
	private static PdfPCell celdaDeFila(Phrase texto) {
		PdfPCell celda = new PdfPCell(texto);
		celda.setBorder(Rectangle.BOTTOM);
		celda.setBorderColor(BORDE);
		celda.setBorderWidth(0.5f);
		celda.setPaddingTop(4);
		celda.setPaddingBottom(5);
		celda.setPaddingLeft(4);
		celda.setPaddingRight(4);
		return celda;
	}

	private static float[] toArray(List<Float> valores) {
		float[] arreglo = new float[valores.size()];
		for (int i = 0; i < arreglo.length; i++) arreglo[i] = valores.get(i);
		return arreglo;
	}
}
