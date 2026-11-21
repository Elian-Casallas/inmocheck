package com.inmocheck.inspecciones;

import com.inmocheck.comun.http.ParametrosPagina;
import com.inmocheck.inspecciones.InspeccionesDtos.DetalleRespuesta;
import com.inmocheck.inspecciones.InspeccionesDtos.EstadoElemento;
import com.inmocheck.inspecciones.InspeccionesDtos.EstadoInspeccion;
import com.inmocheck.inspecciones.InspeccionesDtos.Evidencia;
import com.inmocheck.inspecciones.InspeccionesDtos.GuardarDetalle;
import com.inmocheck.inspecciones.InspeccionesDtos.InspeccionRespuesta;
import com.inmocheck.inspecciones.InspeccionesDtos.Progreso;
import com.inmocheck.inspecciones.InspeccionesDtos.TipoInspeccion;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

// Corre dentro de EjecutorRls: RLS deja al administrador ver las inspecciones
// de su organización y al inspector solo las asignadas a él (CA-06).
//
// Las ESCRITURAS van siempre por las funciones SQL de flujo_inspecciones.sql:
// cada una valida permiso, estado y versión dentro de una transacción y deja
// la auditoría. Aquí nunca se hace un UPDATE directo a inspecciones.
@Repository
public class InspeccionesRepository {

	private static final TypeReference<List<Evidencia>> LISTA_EVIDENCIAS = new TypeReference<>() {
	};

	private final JsonMapper json;

	public InspeccionesRepository(JsonMapper json) {
		this.json = json;
	}

	private static final String COLUMNAS_RESUMEN = """
			select s.id, s.tipo::text as tipo, s.estado::text as estado, s.programada_para, s.finalizada_en,
			       im.id as inmueble_id, im.codigo as inmueble_codigo, im.direccion as inmueble_direccion,
			       pf.id as inspector_id, pf.nombre as inspector_nombre
			from public.inspecciones s
			left join public.inmuebles im on im.id = s.inmueble_id
			left join public.perfiles pf on pf.id = s.inspector_id
			""";

	// El progreso se cuenta en la base con la MISMA regla de lib/progreso.ts y
	// de finalizar_inspeccion: un obligatorio sigue pendiente si no tiene
	// estado, o si es "No aplica" sin explicación.
	private static final String COLUMNAS_INSPECCION = """
			select s.id, s.tipo::text as tipo, s.estado::text as estado, s.programada_para, s.nota,
			       s.iniciada_en, s.finalizada_en, s.cancelada_en, s.motivo_cancelacion, s.version,
			       im.id as inmueble_id, im.codigo as inmueble_codigo, im.direccion as inmueble_direccion,
			       im.barrio as inmueble_barrio, im.ciudad as inmueble_ciudad,
			       pf.id as inspector_id, pf.nombre as inspector_nombre,
			       (select count(*) from public.detalles_inspeccion d
			        where d.inspeccion_id = s.id and d.estado is not null) as evaluados,
			       (select count(*) from public.detalles_inspeccion d where d.inspeccion_id = s.id) as total,
			       (select count(*) from public.detalles_inspeccion d
			        where d.inspeccion_id = s.id and d.obligatorio_snapshot
			          and (d.estado is null or (d.estado = 'NO_APLICA' and coalesce(trim(d.observacion), '') = '')))
			         as pendientes
			from public.inspecciones s
			left join public.inmuebles im on im.id = s.inmueble_id
			left join public.perfiles pf on pf.id = s.inspector_id
			""";

	// ---------- Lecturas ----------

	public List<InspeccionResumen> listar(JdbcClient jdbc, FiltroInspecciones filtro, ParametrosPagina pagina) {
		Consulta consulta = filtrar(filtro);
		String orden = filtro.soloCerradas() ? "desc" : "asc";
		return jdbc.sql(COLUMNAS_RESUMEN + consulta.where()
						+ " order by s.programada_para " + orden + ", s.id limit :limite offset :desde")
				.params(consulta.parametros())
				.param("limite", pagina.pageSize())
				.param("desde", pagina.desde())
				.query(InspeccionesRepository::aResumen)
				.list();
	}

	public long contar(JdbcClient jdbc, FiltroInspecciones filtro) {
		Consulta consulta = filtrar(filtro);
		return jdbc.sql("select count(*) from public.inspecciones s" + consulta.where())
				.params(consulta.parametros())
				.query(Long.class)
				.single();
	}

	public Optional<InspeccionRespuesta> buscar(JdbcClient jdbc, UUID id) {
		return jdbc.sql(COLUMNAS_INSPECCION + " where s.id = :id")
				.param("id", id)
				.query(InspeccionesRepository::aInspeccion)
				.optional();
	}

	// ¿Todavía se puede iniciar en esa fecha? Usa la MISMA función SQL que
	// iniciar_inspeccion (7:00 p. m., hora de Colombia): una sola regla.
	public boolean plazoVigente(JdbcClient jdbc, OffsetDateTime programadaPara) {
		return jdbc.sql("select public.limite_para_iniciar(:fecha) > now()")
				.param("fecha", programadaPara)
				.query(Boolean.class)
				.single();
	}

	// ---------- Escrituras: siempre por función SQL ----------

	public UUID crear(JdbcClient jdbc, InspeccionesDtos.CrearInspeccion datos) {
		return jdbc.sql("""
				select public.crear_inspeccion(:inmueble, :inspector, :tipo::public.inspeccion_tipo, :fecha, :nota)
				""")
				.param("inmueble", datos.inmuebleId())
				.param("inspector", datos.inspectorId())
				.param("tipo", datos.tipo().name())
				.param("fecha", datos.programadaPara())
				.param("nota", datos.nota())
				.query(UUID.class)
				.single();
	}

	// nota: null = no cambiarla; "" = borrarla (así lo interpreta la función).
	public void editar(JdbcClient jdbc, UUID id, int version, OffsetDateTime programadaPara, String nota) {
		ejecutar(jdbc.sql("select public.editar_inspeccion(:id, :version, :fecha, :nota)")
				.param("id", id)
				.param("version", version)
				.param("fecha", programadaPara, java.sql.Types.TIMESTAMP_WITH_TIMEZONE)
				.param("nota", nota, java.sql.Types.VARCHAR));
	}

	public void iniciar(JdbcClient jdbc, UUID id, int version) {
		ejecutar(jdbc.sql("select public.iniciar_inspeccion(:id, :version)")
				.param("id", id).param("version", version));
	}

	public void cancelar(JdbcClient jdbc, UUID id, String motivo, int version) {
		ejecutar(jdbc.sql("select public.cancelar_inspeccion(:id, :motivo, :version)")
				.param("id", id).param("motivo", motivo).param("version", version));
	}

	public void reasignar(JdbcClient jdbc, UUID id, UUID inspectorId, String motivo, int version) {
		ejecutar(jdbc.sql("select public.reasignar_inspeccion(:id, :inspector, :motivo, :version)")
				.param("id", id).param("inspector", inspectorId)
				.param("motivo", motivo == null ? "" : motivo).param("version", version));
	}

	public void finalizar(JdbcClient jdbc, UUID id, int version) {
		ejecutar(jdbc.sql("select public.finalizar_inspeccion(:id, :version)")
				.param("id", id).param("version", version));
	}

	// Devuelve la versión nueva del elemento.
	public int guardarDetalle(JdbcClient jdbc, UUID inspeccionId, UUID detalleId, GuardarDetalle datos) {
		return jdbc.sql("""
				select public.guardar_detalle(:inspeccion, :detalle, :estado::public.elemento_estado, :observacion, :version)
				""")
				.param("inspeccion", inspeccionId)
				.param("detalle", detalleId)
				.param("estado", datos.estado().name())
				.param("observacion", datos.observacion(), java.sql.Types.VARCHAR)
				.param("version", datos.version())
				.query(Integer.class)
				.single();
	}

	// Elementos de la inspección en el orden del inventario (copia guardada al
	// programar), con sus fotos de la más antigua a la más nueva.
	public List<DetalleRespuesta> listarDetalles(JdbcClient jdbc, UUID inspeccionId) {
		return jdbc.sql("""
				select d.id, d.elemento_id, d.espacio_nombre_snapshot, d.elemento_nombre_snapshot,
				       d.obligatorio_snapshot, d.estado::text as estado, d.observacion, d.version,
				       coalesce((select json_agg(json_build_object(
				                   'id', e.id, 'mimeType', e.mime_type, 'sizeBytes', e.size_bytes,
				                   'descripcion', e.descripcion, 'createdAt', e.created_at)
				                   order by e.created_at)
				                 from public.evidencias e where e.detalle_id = d.id), '[]') as evidencias
				from public.detalles_inspeccion d
				where d.inspeccion_id = :id
				order by d.espacio_orden_snapshot, d.espacio_nombre_snapshot, d.elemento_orden_snapshot
				""")
				.param("id", inspeccionId)
				.query(this::aDetalle)
				.list();
	}

	// Las funciones que devuelven "void" igual entregan una fila: se lee y se descarta.
	private static void ejecutar(JdbcClient.StatementSpec llamada) {
		llamada.query((fila, numero) -> Boolean.TRUE).list();
	}

	// ---------- Ayudas ----------

	private record Consulta(String where, Map<String, Object> parametros) {
	}

	private static Consulta filtrar(FiltroInspecciones filtro) {
		List<String> condiciones = new ArrayList<>();
		Map<String, Object> parametros = new LinkedHashMap<>();
		if (!filtro.estados().isEmpty()) {
			condiciones.add("s.estado::text in (:estados)");
			parametros.put("estados", filtro.estados().stream().map(EstadoInspeccion::name).toList());
		}
		if (filtro.tipo() != null) {
			condiciones.add("s.tipo = :tipo::public.inspeccion_tipo");
			parametros.put("tipo", filtro.tipo().name());
		}
		if (filtro.inmuebleId() != null) {
			condiciones.add("s.inmueble_id = :inmueble");
			parametros.put("inmueble", filtro.inmuebleId());
		}
		if (filtro.inspectorId() != null) {
			condiciones.add("s.inspector_id = :inspector");
			parametros.put("inspector", filtro.inspectorId());
		}
		// Igual que el BFF: desde el inicio del día "desde" hasta el final del día "hasta" (UTC).
		if (filtro.desde() != null) {
			condiciones.add("s.programada_para >= :fechaDesde");
			parametros.put("fechaDesde", filtro.desde().atStartOfDay().atOffset(ZoneOffset.UTC));
		}
		if (filtro.hasta() != null) {
			condiciones.add("s.programada_para <= :fechaHasta");
			parametros.put("fechaHasta", filtro.hasta().atTime(23, 59, 59).atOffset(ZoneOffset.UTC));
		}
		String where = condiciones.isEmpty() ? "" : " where " + String.join(" and ", condiciones);
		return new Consulta(where, parametros);
	}

	private static InspeccionResumen aResumen(ResultSet fila, int numero) throws SQLException {
		UUID inmuebleId = fila.getObject("inmueble_id", UUID.class);
		UUID inspectorId = fila.getObject("inspector_id", UUID.class);
		return new InspeccionResumen(
				fila.getObject("id", UUID.class),
				fila.getString("tipo"),
				fila.getString("estado"),
				fila.getObject("programada_para", OffsetDateTime.class),
				fila.getObject("finalizada_en", OffsetDateTime.class),
				inmuebleId == null ? null : new InspeccionResumen.Inmueble(
						inmuebleId, fila.getString("inmueble_codigo"), fila.getString("inmueble_direccion")),
				inspectorId == null ? null : new InspeccionResumen.Inspector(
						inspectorId, fila.getString("inspector_nombre")));
	}

	private DetalleRespuesta aDetalle(ResultSet fila, int numero) throws SQLException {
		String estado = fila.getString("estado");
		return new DetalleRespuesta(
				fila.getObject("id", UUID.class),
				fila.getObject("elemento_id", UUID.class),
				fila.getString("espacio_nombre_snapshot"),
				fila.getString("elemento_nombre_snapshot"),
				fila.getBoolean("obligatorio_snapshot"),
				estado == null ? null : EstadoElemento.valueOf(estado),
				fila.getString("observacion"),
				fila.getInt("version"),
				json.readValue(fila.getString("evidencias"), LISTA_EVIDENCIAS));
	}

	private static InspeccionRespuesta aInspeccion(ResultSet fila, int numero) throws SQLException {
		UUID inspectorId = fila.getObject("inspector_id", UUID.class);
		return new InspeccionRespuesta(
				fila.getObject("id", UUID.class),
				TipoInspeccion.valueOf(fila.getString("tipo")),
				EstadoInspeccion.valueOf(fila.getString("estado")),
				fila.getObject("programada_para", OffsetDateTime.class),
				fila.getString("nota"),
				fila.getObject("iniciada_en", OffsetDateTime.class),
				fila.getObject("finalizada_en", OffsetDateTime.class),
				fila.getObject("cancelada_en", OffsetDateTime.class),
				fila.getString("motivo_cancelacion"),
				fila.getInt("version"),
				new InspeccionRespuesta.Inmueble(
						fila.getObject("inmueble_id", UUID.class),
						fila.getString("inmueble_codigo"),
						fila.getString("inmueble_direccion"),
						fila.getString("inmueble_barrio"),
						fila.getString("inmueble_ciudad")),
				inspectorId == null ? null : new InspeccionRespuesta.Inspector(inspectorId, fila.getString("inspector_nombre")),
				new Progreso(fila.getInt("evaluados"), fila.getInt("total"), fila.getInt("pendientes")));
	}
}
