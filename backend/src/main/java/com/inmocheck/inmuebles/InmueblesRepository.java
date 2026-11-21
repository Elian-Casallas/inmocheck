package com.inmocheck.inmuebles;

import com.inmocheck.comun.datos.Busqueda;
import com.inmocheck.comun.http.ParametrosPagina;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

// Solo habla con la base: no decide reglas. Corre siempre dentro de
// EjecutorRls, así que RLS decide qué filas ve cada uno: el administrador,
// los inmuebles de su organización; el inspector, solo los de sus inspecciones.
@Repository
public class InmueblesRepository {

	// LEFT JOIN con personas: el inspector no puede ver propietarios (RLS),
	// así que para él el propietario llega vacío, como en el BFF.
	private static final String COLUMNAS = """
			select i.id, i.codigo, i.tipo::text as tipo, i.direccion, i.barrio, i.ciudad, i.departamento,
			       i.habitaciones, i.banos, i.area_m2, i.descripcion, i.activo, i.created_at,
			       pe.id as propietario_id, pe.nombre as propietario_nombre,
			       pe.email as propietario_email, pe.telefono as propietario_telefono
			from public.inmuebles i
			left join public.personas pe on pe.id = i.propietario_id
			""";

	// Del nombre del JSON a la columna. Lo que no esté aquí no se puede cambiar.
	private static final Map<String, String> COLUMNA_DE = Map.ofEntries(
			Map.entry("codigo", "codigo"),
			Map.entry("tipo", "tipo"),
			Map.entry("direccion", "direccion"),
			Map.entry("barrio", "barrio"),
			Map.entry("ciudad", "ciudad"),
			Map.entry("departamento", "departamento"),
			Map.entry("habitaciones", "habitaciones"),
			Map.entry("banos", "banos"),
			Map.entry("areaM2", "area_m2"),
			Map.entry("propietarioId", "propietario_id"),
			Map.entry("descripcion", "descripcion"),
			Map.entry("activo", "activo"));

	public List<InmuebleRespuesta> listar(JdbcClient jdbc, FiltroInmuebles filtro, ParametrosPagina pagina) {
		Consulta consulta = filtrar(filtro);
		return jdbc.sql(COLUMNAS + consulta.where()
						+ " order by " + filtro.orden().sql() + ", i.id limit :limite offset :desde")
				.params(consulta.parametros())
				.param("limite", pagina.pageSize())
				.param("desde", pagina.desde())
				.query(InmueblesRepository::aRespuesta)
				.list();
	}

	public long contar(JdbcClient jdbc, FiltroInmuebles filtro) {
		Consulta consulta = filtrar(filtro);
		return jdbc.sql("select count(*) from public.inmuebles i" + consulta.where())
				.params(consulta.parametros())
				.query(Long.class)
				.single();
	}

	public Optional<InmuebleRespuesta> buscar(JdbcClient jdbc, UUID id) {
		return jdbc.sql(COLUMNAS + " where i.id = :id")
				.param("id", id)
				.query(InmueblesRepository::aRespuesta)
				.optional();
	}

	public UUID insertar(JdbcClient jdbc, UUID organizacionId, CrearInmueble datos) {
		return jdbc.sql("""
				insert into public.inmuebles
				  (organizacion_id, codigo, tipo, direccion, barrio, ciudad, departamento,
				   habitaciones, banos, area_m2, descripcion, propietario_id)
				values
				  (:organizacion, :codigo, :tipo::public.inmueble_tipo, :direccion, :barrio, :ciudad, :departamento,
				   :habitaciones, :banos, :areaM2, :descripcion, :propietarioId)
				returning id
				""")
				.param("organizacion", organizacionId)
				.param("codigo", datos.codigo())
				.param("tipo", datos.tipo().name())
				.param("direccion", datos.direccion())
				.param("barrio", datos.barrio())
				.param("ciudad", datos.ciudad())
				.param("departamento", datos.departamento())
				.param("habitaciones", datos.habitaciones())
				.param("banos", datos.banos())
				.param("areaM2", datos.areaM2())
				.param("descripcion", datos.descripcion())
				.param("propietarioId", datos.propietarioId())
				.query(UUID.class)
				.single();
	}

	// Solo cambia los campos que llegaron. Vacío si no existe o RLS lo oculta.
	public Optional<UUID> actualizar(JdbcClient jdbc, UUID id, Map<String, Object> cambios) {
		List<String> asignaciones = cambios.keySet().stream()
				.map(campo -> COLUMNA_DE.get(campo) + " = :" + campo + ("tipo".equals(campo) ? "::public.inmueble_tipo" : ""))
				.toList();
		return jdbc.sql("update public.inmuebles set " + String.join(", ", asignaciones) + " where id = :id returning id")
				.params(cambios)
				.param("id", id)
				.query(UUID.class)
				.optional();
	}

	public long contarInspeccionesAbiertas(JdbcClient jdbc, UUID inmuebleId) {
		return jdbc.sql("""
				select count(*) from public.inspecciones
				where inmueble_id = :id and estado in ('PENDIENTE', 'EN_PROCESO')
				""")
				.param("id", inmuebleId)
				.query(Long.class)
				.single();
	}

	// Historial: las inspecciones del inmueble, de la más reciente a la más antigua.
	public List<InspeccionResumen> historial(JdbcClient jdbc, UUID inmuebleId) {
		return jdbc.sql("""
				select s.id, s.tipo::text as tipo, s.estado::text as estado, s.programada_para, s.finalizada_en,
				       im.id as inmueble_id, im.codigo as inmueble_codigo, im.direccion as inmueble_direccion,
				       pf.id as inspector_id, pf.nombre as inspector_nombre
				from public.inspecciones s
				left join public.inmuebles im on im.id = s.inmueble_id
				left join public.perfiles pf on pf.id = s.inspector_id
				where s.inmueble_id = :id
				order by s.programada_para desc
				""")
				.param("id", inmuebleId)
				.query(InmueblesRepository::aResumen)
				.list();
	}

	// ---------- Ayudas ----------

	private record Consulta(String where, Map<String, Object> parametros) {
	}

	private static Consulta filtrar(FiltroInmuebles filtro) {
		List<String> condiciones = new ArrayList<>();
		Map<String, Object> parametros = new LinkedHashMap<>();

		if (filtro.tipo() != null) {
			condiciones.add("i.tipo = :tipo::public.inmueble_tipo");
			parametros.put("tipo", filtro.tipo().name());
		}
		if (filtro.activo() != null) {
			condiciones.add("i.activo = :activo");
			parametros.put("activo", filtro.activo());
		}
		if (filtro.busqueda() != null) {
			condiciones.add("(i.codigo ilike :patron or i.direccion ilike :patron"
					+ " or i.barrio ilike :patron or i.ciudad ilike :patron)");
			parametros.put("patron", Busqueda.contiene(filtro.busqueda()));
		}
		String where = condiciones.isEmpty() ? "" : " where " + String.join(" and ", condiciones);
		return new Consulta(where, parametros);
	}

	private static InmuebleRespuesta aRespuesta(ResultSet fila, int numero) throws SQLException {
		UUID propietarioId = fila.getObject("propietario_id", UUID.class);
		return new InmuebleRespuesta(
				fila.getObject("id", UUID.class),
				fila.getString("codigo"),
				TipoInmueble.valueOf(fila.getString("tipo")),
				fila.getString("direccion"),
				fila.getString("barrio"),
				fila.getString("ciudad"),
				fila.getString("departamento"),
				fila.getInt("habitaciones"),
				fila.getInt("banos"),
				fila.getBigDecimal("area_m2"),
				fila.getString("descripcion"),
				fila.getBoolean("activo"),
				fila.getObject("created_at", OffsetDateTime.class),
				propietarioId == null ? null : new InmuebleRespuesta.Propietario(
						propietarioId,
						fila.getString("propietario_nombre"),
						fila.getString("propietario_email"),
						fila.getString("propietario_telefono")));
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
}
