package com.inmocheck.informes;

import com.inmocheck.comparacion.ComparacionService;
import com.inmocheck.comun.Limites;
import com.inmocheck.comun.datos.EjecutorRls;
import com.inmocheck.comun.datos.ErroresSql;
import com.inmocheck.comun.errores.ConflictoException;
import com.inmocheck.comun.errores.NoEncontradoException;
import com.inmocheck.comun.errores.ServicioNoDisponibleException;
import com.inmocheck.comun.http.Pagina;
import com.inmocheck.comun.http.ParametrosPagina;
import com.inmocheck.comun.sesion.Actor;
import com.inmocheck.informes.ActaPdf.DatosActa;
import com.inmocheck.informes.ActaPdf.FotoActa;
import com.inmocheck.informes.InformesRepository.GeneradoPor;
import com.inmocheck.informes.InformesRepository.Informe;
import com.inmocheck.informes.InformesRepository.InformeConInspeccion;
import com.inmocheck.inmuebles.InmuebleRespuesta;
import com.inmocheck.inmuebles.InmueblesRepository;
import com.inmocheck.inspecciones.InspeccionesDtos.DetalleRespuesta;
import com.inmocheck.inspecciones.InspeccionesDtos.EstadoInspeccion;
import com.inmocheck.inspecciones.InspeccionesDtos.InspeccionRespuesta;
import com.inmocheck.inspecciones.InspeccionesRepository;
import com.inmocheck.supabase.ClienteSupabaseAdmin;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

// Informes PDF del acta (equivale a informes.service.ts).
// Generar el informe es un paso APARTE de finalizar: si el PDF falla, la
// inspección sigue finalizada y se puede reintentar. Cada intento exitoso es
// una versión nueva; las anteriores se conservan.
@Service
public class InformesService {

	private static final Logger log = LoggerFactory.getLogger(InformesService.class);
	private static final String BUCKET_INFORMES = "informes";
	private static final String BUCKET_EVIDENCIAS = "evidencias";
	// OpenPDF incrusta JPG y PNG (igual que react-pdf); las WebP no van en el acta.
	private static final Set<String> FORMATOS_PDF = Set.of("image/jpeg", "image/png");
	static final int FOTOS_MAXIMAS_EN_INFORME = 60;

	private final EjecutorRls ejecutor;
	private final InformesRepository repositorio;
	private final InspeccionesRepository inspecciones;
	private final InmueblesRepository inmuebles;
	private final ComparacionService comparacion;
	private final ClienteSupabaseAdmin supabase;

	public InformesService(EjecutorRls ejecutor, InformesRepository repositorio, InspeccionesRepository inspecciones,
			InmueblesRepository inmuebles, ComparacionService comparacion, ClienteSupabaseAdmin supabase) {
		this.ejecutor = ejecutor;
		this.repositorio = repositorio;
		this.inspecciones = inspecciones;
		this.inmuebles = inmuebles;
		this.comparacion = comparacion;
		this.supabase = supabase;
	}

	// ---------- Consultas ----------

	public List<Informe> listarDeInspeccion(Actor actor, UUID inspeccionId) {
		return ejecutor.ejecutar(actor.token(), jdbc -> {
			inspecciones.buscar(jdbc, inspeccionId).orElseThrow(NoEncontradoException::new);
			return repositorio.listarDeInspeccion(jdbc, inspeccionId);
		});
	}

	public Pagina<InformeConInspeccion> listar(Actor actor, String busqueda, String tipo, ParametrosPagina pagina) {
		return ejecutor.ejecutar(actor.token(), jdbc -> Pagina.de(
				repositorio.listar(jdbc, busqueda, tipo, pagina),
				repositorio.contar(jdbc, busqueda, tipo),
				pagina));
	}

	// Enlace firmado de 60 s para descargar el PDF, con un nombre legible.
	public String enlaceDeDescarga(Actor actor, UUID informeId) {
		var informe = ejecutor.ejecutar(actor.token(), jdbc -> repositorio.paraDescarga(jdbc, informeId))
				.orElseThrow(NoEncontradoException::new);
		String nombre = FormatoActa.codigoDeInforme(informeId, informe.generadoEn()) + "-v" + informe.version() + ".pdf";
		return supabase.firmarEnlaceDeDescarga(BUCKET_INFORMES, informe.ruta(), Limites.URL_FIRMADA_SEGUNDOS, nombre);
	}

	// ---------- Generar ----------

	// evidenciaIds: fotos que lleva el acta; null = todas (hasta 60).
	public Informe generar(Actor actor, UUID inspeccionId, List<UUID> evidenciaIds) {
		Reunido reunido = ejecutor.ejecutar(actor.token(), jdbc -> {
			InspeccionRespuesta inspeccion = inspecciones.buscar(jdbc, inspeccionId)
					.orElseThrow(NoEncontradoException::new);
			if (inspeccion.estado() != EstadoInspeccion.FINALIZADA) {
				throw new ConflictoException("El informe solo se genera para inspecciones finalizadas.",
						"INSPECCION_NO_FINALIZADA");
			}
			return new Reunido(
					inspeccion,
					repositorio.ultimaVersion(jdbc, inspeccionId) + 1,
					inspecciones.listarDetalles(jdbc, inspeccionId),
					// El inspector no ve propietarios (RLS): para él no aparece en el acta.
					inmuebles.buscar(jdbc, inspeccion.inmueble().id()).map(InmuebleRespuesta::propietario)
							.map(InmuebleRespuesta.Propietario::nombre).orElse(null),
					comparacion.resumirContraEntradaAnterior(jdbc, inspeccion).map(resumen ->
							FormatoActa.plural(resumen.elementosComparados(), "elemento comparado", "elementos comparados")
									+ ", " + resumen.cambios() + " con cambio de estado y "
									+ FormatoActa.plural(resumen.noComparables(), "no comparable", "no comparables") + ".")
							.orElse(null),
					repositorio.rutasDeFotos(jdbc, inspeccionId));
		});

		UUID id = UUID.randomUUID();
		OffsetDateTime generadoEn = OffsetDateTime.now();
		byte[] pdf = generarPdf(actor, reunido, id, generadoEn, evidenciaIds);

		String ruta = "org/%s/inspecciones/%s/%s.pdf".formatted(actor.organizacion().id(), inspeccionId, id);
		supabase.subirArchivo(BUCKET_INFORMES, ruta, pdf, "application/pdf");
		try {
			// Huella del archivo: permite comprobar después que el PDF no cambió.
			ejecutor.ejecutar(actor.token(), jdbc -> {
				repositorio.registrar(jdbc, id, inspeccionId, reunido.version(), ruta, sha256(pdf));
				return null;
			});
		} catch (RuntimeException error) {
			// Compensación: Storage y la base no comparten transacción.
			borrarSinFallar(ruta);
			throw traducir(error);
		}
		return new Informe(id, inspeccionId, reunido.version(), generadoEn, new GeneradoPor(actor.nombre()));
	}

	// Todo lo leído de la base para armar el acta (en una sola transacción).
	private record Reunido(InspeccionRespuesta inspeccion, int version, List<DetalleRespuesta> detalles,
			String propietario, String resumenComparacion, Map<UUID, String> rutasDeFotos) {
	}

	private byte[] generarPdf(Actor actor, Reunido reunido, UUID id, OffsetDateTime generadoEn, List<UUID> elegidas) {
		try {
			InspeccionRespuesta inspeccion = reunido.inspeccion();
			return ActaPdf.generar(new DatosActa(
					FormatoActa.codigoDeInforme(id, generadoEn),
					reunido.version(),
					actor.organizacion().nombre(),
					inspeccion.tipo(),
					String.join(" · ", inspeccion.inmueble().codigo(), inspeccion.inmueble().direccion(),
							inspeccion.inmueble().ciudad()),
					reunido.propietario(),
					inspeccion.inspector() == null ? "—" : inspeccion.inspector().nombre(),
					inspeccion.programadaPara(),
					inspeccion.finalizadaEn() != null ? inspeccion.finalizadaEn() : generadoEn,
					generadoEn,
					reunido.detalles(),
					reunido.resumenComparacion(),
					descargarFotos(reunido, elegidas)));
		} catch (RuntimeException error) {
			log.error("No se pudo generar el PDF de la inspección {}", reunido.inspeccion().id(), error);
			throw new ServicioNoDisponibleException(
					"No se pudo generar el PDF. La inspección sigue finalizada; intenta de nuevo.", "PDF_NO_GENERADO");
		}
	}

	// Fotos del acta en el orden de la tabla (espacio → elemento). Si se
	// eligieron ids, solo esas; uno de otra inspección no coincide con ninguno
	// y se ignora. Si una no se puede descargar, se omite.
	private List<FotoActa> descargarFotos(Reunido reunido, List<UUID> elegidas) {
		Set<UUID> filtro = elegidas == null ? null : Set.copyOf(elegidas);
		return reunido.detalles().stream()
				.flatMap(detalle -> detalle.evidencias().stream()
						.filter(foto -> FORMATOS_PDF.contains(foto.mimeType()))
						.filter(foto -> filtro == null || filtro.contains(foto.id()))
						.map(foto -> new Object[] { detalle, foto }))
				.limit(FOTOS_MAXIMAS_EN_INFORME)
				.toList()
				.parallelStream()
				.map(par -> {
					DetalleRespuesta detalle = (DetalleRespuesta) par[0];
					var foto = (com.inmocheck.inspecciones.InspeccionesDtos.Evidencia) par[1];
					String ruta = reunido.rutasDeFotos().get(foto.id());
					if (ruta == null) return null;
					try {
						return new FotoActa(detalle.espacioNombre(), detalle.elementoNombre(),
								supabase.descargarArchivo(BUCKET_EVIDENCIAS, ruta));
					} catch (RuntimeException error) {
						log.warn("No se pudo descargar la foto {} para el acta", foto.id(), error);
						return null;
					}
				})
				.filter(Objects::nonNull)
				.toList();
	}

	private static RuntimeException traducir(RuntimeException error) {
		if (ErroresSql.esViolacionUnica(error)) {
			return new ConflictoException("Otra persona generó el informe al mismo tiempo. Recarga la página.",
					"INFORME_DUPLICADO");
		}
		return ErroresSql.errorDeFuncion(error).<RuntimeException>map(funcion -> switch (funcion.codigo()) {
			case "NO_ENCONTRADA" -> new NoEncontradoException();
			case "INSPECCION_NO_FINALIZADA" -> new ConflictoException(
					"El informe solo se genera para inspecciones finalizadas.", "INSPECCION_NO_FINALIZADA");
			default -> error;
		}).orElse(error);
	}

	private void borrarSinFallar(String ruta) {
		try {
			supabase.borrarArchivo(BUCKET_INFORMES, ruta);
		} catch (RuntimeException error) {
			log.error("No se pudo borrar de Storage el informe {}", ruta, error);
		}
	}

	private static String sha256(byte[] contenido) {
		try {
			return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(contenido));
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("SHA-256 no disponible", e);
		}
	}
}
