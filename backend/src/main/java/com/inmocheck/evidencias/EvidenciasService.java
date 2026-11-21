package com.inmocheck.evidencias;

import com.inmocheck.comun.Limites;
import com.inmocheck.comun.datos.EjecutorRls;
import com.inmocheck.comun.datos.ErroresSql;
import com.inmocheck.comun.errores.ConflictoException;
import com.inmocheck.comun.errores.ErrorDeApi;
import com.inmocheck.comun.errores.NoEncontradoException;
import com.inmocheck.comun.errores.SolicitudInvalidaException;
import com.inmocheck.comun.sesion.Actor;
import com.inmocheck.supabase.ClienteSupabaseAdmin;
import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.function.Supplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

// Fotos de los elementos (equivale a evidencias.service.ts).
// El archivo va al bucket PRIVADO "evidencias" con service_role, siempre
// DESPUÉS de comprobar con la sesión del usuario (RLS) que puede hacerlo.
// Las fotos nunca tienen enlace público: solo enlaces firmados de 60 s.
@Service
public class EvidenciasService {

	private static final Logger log = LoggerFactory.getLogger(EvidenciasService.class);
	static final String BUCKET = "evidencias";

	private final EjecutorRls ejecutor;
	private final EvidenciasRepository repositorio;
	private final ClienteSupabaseAdmin supabase;

	public EvidenciasService(EjecutorRls ejecutor, EvidenciasRepository repositorio, ClienteSupabaseAdmin supabase) {
		this.ejecutor = ejecutor;
		this.repositorio = repositorio;
		this.supabase = supabase;
	}

	public record EvidenciaSubida(UUID id, String mimeType, int sizeBytes, String descripcion, OffsetDateTime createdAt) {
	}

	public record Acceso(String url, int expiresIn) {
	}

	public EvidenciaSubida subir(Actor actor, UUID inspeccionId, UUID detalleId, byte[] contenido, String descripcion) {
		if (contenido.length == 0) {
			throw new SolicitudInvalidaException("El archivo está vacío.");
		}
		if (contenido.length > Limites.FOTO_TAMANO_MAXIMO_BYTES) {
			throw new ArchivoNoAdmitido(HttpStatus.CONTENT_TOO_LARGE, "FILE_TOO_LARGE", "Archivo demasiado grande",
					"Cada foto puede pesar máximo " + Limites.FOTO_TAMANO_MAXIMO_MB + " MB.");
		}
		TipoImagen tipo = TipoImagen.detectar(contenido).orElseThrow(() -> new ArchivoNoAdmitido(
				HttpStatus.UNSUPPORTED_MEDIA_TYPE, "UNSUPPORTED_MEDIA_TYPE", "Tipo de archivo no admitido",
				"Solo se admiten fotos JPG, PNG o WebP."));

		// Antes de subir nada: el elemento existe, es de esa inspección y es visible (RLS).
		if (!ejecutor.ejecutar(actor.token(), jdbc -> repositorio.detalleVisible(jdbc, inspeccionId, detalleId))) {
			throw new NoEncontradoException();
		}

		// El nombre lo genera el servidor: nunca se usa el nombre original, que
		// podría traer rutas ("../") o datos personales.
		UUID id = UUID.randomUUID();
		String ruta = "org/%s/inspecciones/%s/detalles/%s/%s.%s"
				.formatted(actor.organizacion().id(), inspeccionId, detalleId, id, tipo.extension());
		supabase.subirArchivo(BUCKET, ruta, contenido, tipo.mime());

		try {
			ejecutor.ejecutar(actor.token(), jdbc -> {
				repositorio.registrar(jdbc, id, detalleId, ruta, tipo, contenido.length, descripcion);
				return null;
			});
		} catch (RuntimeException error) {
			// Compensación: Storage y la base no comparten transacción. Si el
			// registro falla, se borra el archivo para no dejarlo huérfano.
			borrarSinFallar(ruta);
			throw traducir(error);
		}
		return new EvidenciaSubida(id, tipo.mime(), contenido.length, descripcion, OffsetDateTime.now());
	}

	// Enlace firmado de corta duración, solo si RLS deja ver la evidencia.
	public Acceso acceso(Actor actor, UUID id) {
		String ruta = ejecutor.ejecutar(actor.token(), jdbc -> repositorio.rutaVisible(jdbc, id))
				.orElseThrow(NoEncontradoException::new);
		return new Acceso(supabase.firmarEnlace(BUCKET, ruta, Limites.URL_FIRMADA_SEGUNDOS), Limites.URL_FIRMADA_SEGUNDOS);
	}

	// Solo el inspector asignado y mientras la inspección está en proceso.
	public void eliminar(Actor actor, UUID id) {
		String ruta = conTraduccion(() -> ejecutor.ejecutar(actor.token(), jdbc -> repositorio.eliminar(jdbc, id)));
		borrarSinFallar(ruta);
	}

	// ---------- Ayudas ----------

	// Si Storage falla al borrar, el registro ya no existe: se deja constancia
	// en el log en vez de responder error (el BFF hacía lo mismo).
	private void borrarSinFallar(String ruta) {
		try {
			supabase.borrarArchivo(BUCKET, ruta);
		} catch (RuntimeException error) {
			log.error("No se pudo borrar de Storage el archivo {}", ruta, error);
		}
	}

	private static <T> T conTraduccion(Supplier<T> accion) {
		try {
			return accion.get();
		} catch (RuntimeException error) {
			throw traducir(error);
		}
	}

	private static RuntimeException traducir(RuntimeException error) {
		return ErroresSql.errorDeFuncion(error).<RuntimeException>map(funcion -> switch (funcion.codigo()) {
			case "NO_ENCONTRADA" -> new NoEncontradoException();
			case "INSPECCION_NO_INICIADA" -> new ConflictoException(
					"Primero debes iniciar la inspección.", "INSPECCION_NO_INICIADA");
			case "INSPECCION_CERRADA" -> new ConflictoException(
					"La inspección ya está cerrada: sus fotos no se pueden modificar.", "INSPECCION_CERRADA");
			case "LIMITE_FOTOS" -> new ConflictoException(
					"Cada elemento admite máximo " + Limites.FOTOS_MAXIMAS_POR_ELEMENTO + " fotos.", "LIMITE_FOTOS");
			default -> error;
		}).orElse(error);
	}

	// 413 o 415 con el código y mensaje del BFF.
	static class ArchivoNoAdmitido extends ErrorDeApi {
		ArchivoNoAdmitido(HttpStatus estado, String codigo, String titulo, String detalle) {
			super(estado, codigo, titulo, detalle);
		}
	}
}
