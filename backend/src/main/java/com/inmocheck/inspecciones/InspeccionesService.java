package com.inmocheck.inspecciones;

import com.inmocheck.comun.datos.EjecutorRls;
import com.inmocheck.comun.errores.DatosInvalidosException;
import com.inmocheck.comun.errores.NoEncontradoException;
import com.inmocheck.comun.http.CuerpoParcial;
import com.inmocheck.comun.http.ErrorDeCampo;
import com.inmocheck.comun.http.Pagina;
import com.inmocheck.comun.http.ParametrosPagina;
import com.inmocheck.comun.sesion.Actor;
import com.inmocheck.inspecciones.InspeccionesDtos.Cancelar;
import com.inmocheck.inspecciones.InspeccionesDtos.CrearInspeccion;
import com.inmocheck.inspecciones.InspeccionesDtos.DetalleGuardado;
import com.inmocheck.inspecciones.InspeccionesDtos.DetalleRespuesta;
import com.inmocheck.inspecciones.InspeccionesDtos.GuardarDetalle;
import com.inmocheck.inspecciones.InspeccionesDtos.InspeccionRespuesta;
import com.inmocheck.inspecciones.InspeccionesDtos.ListaDetalles;
import com.inmocheck.inspecciones.InspeccionesDtos.Progreso;
import com.inmocheck.inspecciones.InspeccionesDtos.Reasignar;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

// Las reglas del flujo (transiciones, versión, plazo) viven en las funciones
// SQL. Este servicio las invoca y traduce sus errores (ErroresDeFlujo).
// Después de cada acción devuelve la inspección actualizada, como el BFF.
@Service
public class InspeccionesService {

	private static final Set<String> CAMPOS_EDITABLES = Set.of("programadaPara", "nota", "version");
	private static final int NOTA_MAXIMA = 1000;

	private final EjecutorRls ejecutor;
	private final InspeccionesRepository repositorio;

	public InspeccionesService(EjecutorRls ejecutor, InspeccionesRepository repositorio) {
		this.ejecutor = ejecutor;
		this.repositorio = repositorio;
	}

	// ---------- Consultas ----------

	public Pagina<InspeccionResumen> listar(Actor actor, FiltroInspecciones filtro, ParametrosPagina pagina) {
		return ejecutor.ejecutar(actor.token(), jdbc -> Pagina.de(
				repositorio.listar(jdbc, filtro, pagina),
				repositorio.contar(jdbc, filtro),
				pagina));
	}

	// RLS oculta las de otra organización y las no asignadas: 404 en todos los casos.
	public InspeccionRespuesta obtener(Actor actor, UUID id) {
		return ejecutor.ejecutar(actor.token(), jdbc -> buscar(jdbc, id));
	}

	// ---------- Acciones ----------

	public InspeccionRespuesta crear(Actor actor, CrearInspeccion datos) {
		return accion(actor, jdbc -> {
			exigirFechaVigente(jdbc, datos.programadaPara());
			return repositorio.crear(jdbc, datos);
		});
	}

	public InspeccionRespuesta editar(Actor actor, UUID id, JsonNode cuerpo) {
		CuerpoParcial parcial = CuerpoParcial.de(cuerpo, CAMPOS_EDITABLES);
		Optional<OffsetDateTime> fecha = parcial.fechaHora("programadaPara");
		Optional<String> nota = parcial.texto("nota");
		Optional<Integer> version = parcial.entero("version");
		parcial.exigirSinErrores();
		validarEdicion(fecha, nota, version);

		return accion(actor, jdbc -> {
			OffsetDateTime nuevaFecha = fecha == null ? null : fecha.get();
			if (nuevaFecha != null) {
				exigirFechaVigente(jdbc, nuevaFecha);
			}
			// Para la función: null = no cambiar la nota; "" = borrarla.
			String nuevaNota = nota == null ? null : nota.orElse("");
			repositorio.editar(jdbc, id, version.get(), nuevaFecha, nuevaNota);
			return id;
		});
	}

	public InspeccionRespuesta iniciar(Actor actor, UUID id, int version) {
		return accion(actor, jdbc -> {
			repositorio.iniciar(jdbc, id, version);
			return id;
		});
	}

	public InspeccionRespuesta cancelar(Actor actor, UUID id, Cancelar datos) {
		return accion(actor, jdbc -> {
			repositorio.cancelar(jdbc, id, datos.motivo(), datos.version());
			return id;
		});
	}

	public InspeccionRespuesta reasignar(Actor actor, UUID id, Reasignar datos) {
		return accion(actor, jdbc -> {
			repositorio.reasignar(jdbc, id, datos.inspectorId(), datos.motivo(), datos.version());
			return id;
		});
	}

	// ---------- Realizar la inspección ----------

	// Elementos a evaluar y el progreso. Si la inspección no es visible: 404.
	public ListaDetalles detalles(Actor actor, UUID id) {
		return ejecutor.ejecutar(actor.token(), jdbc -> {
			buscar(jdbc, id);
			List<DetalleRespuesta> detalles = repositorio.listarDetalles(jdbc, id);
			return new ListaDetalles(detalles, Progreso.de(detalles));
		});
	}

	// Guarda la evaluación de UN elemento con su versión: si otra petición ya
	// lo cambió, guardar_detalle responde VERSION_CONFLICT en vez de pisarlo.
	public DetalleGuardado guardarDetalle(Actor actor, UUID inspeccionId, UUID detalleId, GuardarDetalle datos) {
		int version = ErroresDeFlujo.traducir(() -> ejecutor.ejecutar(actor.token(),
				jdbc -> repositorio.guardarDetalle(jdbc, inspeccionId, detalleId, datos)));
		return new DetalleGuardado(detalleId, datos.estado(), datos.observacion(), version);
	}

	// Cierra solo si no quedan obligatorios pendientes (INSPECCION_INCOMPLETA
	// con cuántos faltan). Una vez finalizada no se modifica más (RN-05).
	public InspeccionRespuesta finalizar(Actor actor, UUID id, int version) {
		return accion(actor, jdbc -> {
			repositorio.finalizar(jdbc, id, version);
			return id;
		});
	}

	// ---------- Ayudas ----------

	// Ejecuta la acción en UNA transacción con RLS, traduce los errores de las
	// funciones SQL y devuelve la inspección como quedó.
	private InspeccionRespuesta accion(Actor actor, java.util.function.Function<JdbcClient, UUID> hacer) {
		return ErroresDeFlujo.traducir(() -> ejecutor.ejecutar(actor.token(), jdbc -> buscar(jdbc, hacer.apply(jdbc))));
	}

	private InspeccionRespuesta buscar(JdbcClient jdbc, UUID id) {
		return repositorio.buscar(jdbc, id).orElseThrow(NoEncontradoException::new);
	}

	// El formulario ya impide elegir una fecha pasada, pero esa validación se
	// puede saltar llamando a la API directamente; por eso se repite aquí (RN-16).
	private void exigirFechaVigente(JdbcClient jdbc, OffsetDateTime programadaPara) {
		if (!repositorio.plazoVigente(jdbc, programadaPara)) {
			throw new FechaPasadaException();
		}
	}

	// inspeccionEditarSchema: version obligatoria; fecha opcional (sin null);
	// nota opcional, null la borra, máximo 1000.
	private static void validarEdicion(Optional<OffsetDateTime> fecha, Optional<String> nota, Optional<Integer> version) {
		List<ErrorDeCampo> errores = new ArrayList<>();
		if (version == null || version.isEmpty() || version.get() < 1) {
			errores.add(new ErrorDeCampo("version", InspeccionesDtos.MENSAJE_VERSION));
		}
		if (fecha != null && fecha.isEmpty()) {
			errores.add(new ErrorDeCampo("programadaPara", "Fecha inválida."));
		}
		if (nota != null && nota.isPresent() && nota.get().length() > NOTA_MAXIMA) {
			errores.add(new ErrorDeCampo("nota", "La nota puede tener máximo 1000 caracteres."));
		}
		if (!errores.isEmpty()) {
			throw new DatosInvalidosException(errores);
		}
	}
}
