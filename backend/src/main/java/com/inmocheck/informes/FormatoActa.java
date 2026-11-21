package com.inmocheck.informes;

import com.inmocheck.inspecciones.InspeccionesDtos.EstadoElemento;
import com.inmocheck.inspecciones.InspeccionesDtos.TipoInspeccion;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.UUID;

// Textos del acta, iguales a los del front (lib/formato.ts, lib/inspecciones.ts
// y codigoDeInforme de schemas/informes.ts).
final class FormatoActa {

	private static final ZoneId BOGOTA = ZoneId.of("America/Bogota");

	// "10 de oct de 2026, 8:27 a. m.", como formatearFechaHora del front.
	private static final DateTimeFormatter FECHA_HORA =
			DateTimeFormatter.ofPattern("d 'de' MMM 'de' yyyy, h:mm a", Locale.forLanguageTag("es-CO"));

	private FormatoActa() {
	}

	// Java separa "a." y "m." con un espacio especial (U+202F) que la fuente
	// Helvetica del PDF no puede dibujar: se cambia por un espacio normal.
	static String fechaHora(OffsetDateTime fecha) {
		return FECHA_HORA.format(fecha.atZoneSameInstant(BOGOTA)).replace(' ', ' ').replace(' ', ' ');
	}

	// Código legible que aparece en el PDF: INF-2026-1A2B3C4D.
	static String codigoDeInforme(UUID informeId, OffsetDateTime generadoEn) {
		return "INF-" + generadoEn.withOffsetSameInstant(ZoneOffset.UTC).getYear() + "-"
				+ informeId.toString().substring(0, 8).toUpperCase(Locale.ROOT);
	}

	static String tipo(TipoInspeccion tipo) {
		return switch (tipo) {
			case ENTRADA -> "Entrada";
			case SALIDA -> "Salida";
			case SEGUIMIENTO -> "Seguimiento";
		};
	}

	static String estado(EstadoElemento estado) {
		if (estado == null) return "Sin evaluar";
		return switch (estado) {
			case EXCELENTE -> "Excelente";
			case BUENO -> "Bueno";
			case REGULAR -> "Regular";
			case DANADO -> "Dañado";
			case NO_APLICA -> "No aplica";
		};
	}

	// "1 elemento comparado" / "3 elementos comparados", como plural() del front.
	static String plural(int cantidad, String singular, String enPlural) {
		return cantidad + " " + (cantidad == 1 ? singular : enPlural);
	}
}
