package com.inmocheck.informes;

import com.inmocheck.comun.datos.Busqueda;
import com.inmocheck.comun.http.ParametrosPagina;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

// Corre dentro de EjecutorRls: RLS deja ver al administrador los informes de
// su organización y al inspector los de sus inspecciones.
@Repository
public class InformesRepository {

	public record Informe(UUID id, UUID inspeccionId, int version, OffsetDateTime generadoEn, GeneradoPor generadoPor) {
	}

	public record GeneradoPor(String nombre) {
	}

	// Para la biblioteca: el informe con su inspección e inmueble.
	public record InformeConInspeccion(UUID id, UUID inspeccionId, int version, OffsetDateTime generadoEn,
			GeneradoPor generadoPor, Inspeccion inspeccion) {

		public record Inspeccion(UUID id, String tipo, Inmueble inmueble) {
		}

		public record Inmueble(String codigo, String direccion) {
		}
	}

	record ParaDescarga(String ruta, int version, OffsetDateTime generadoEn) {
	}

	private static final String COLUMNAS = """
			select i.id, i.inspeccion_id, i.version, i.generado_en, pf.nombre as generado_por,
			       s.id as s_id, s.tipo::text as s_tipo, im.codigo as im_codigo, im.direccion as im_direccion
			from public.informes i
			left join public.perfiles pf on pf.id = i.generado_por
			left join public.inspecciones s on s.id = i.inspeccion_id
			left join public.inmuebles im on im.id = s.inmueble_id
			""";

	public List<Informe> listarDeInspeccion(JdbcClient jdbc, UUID inspeccionId) {
		return jdbc.sql(COLUMNAS + " where i.inspeccion_id = :id order by i.version desc")
				.param("id", inspeccionId)
				.query((fila, numero) -> new Informe(
						fila.getObject("id", UUID.class),
						fila.getObject("inspeccion_id", UUID.class),
						fila.getInt("version"),
						fila.getObject("generado_en", OffsetDateTime.class),
						generadoPor(fila)))
				.list();
	}

	public List<InformeConInspeccion> listar(JdbcClient jdbc, String busqueda, String tipo, ParametrosPagina pagina) {
		Consulta consulta = filtrar(busqueda, tipo);
		return jdbc.sql(COLUMNAS + consulta.where() + " order by i.generado_en desc, i.id limit :limite offset :desde")
				.params(consulta.parametros())
				.param("limite", pagina.pageSize())
				.param("desde", pagina.desde())
				.query(InformesRepository::aConInspeccion)
				.list();
	}

	public long contar(JdbcClient jdbc, String busqueda, String tipo) {
		Consulta consulta = filtrar(busqueda, tipo);
		return jdbc.sql("""
				select count(*) from public.informes i
				left join public.inspecciones s on s.id = i.inspeccion_id
				left join public.inmuebles im on im.id = s.inmueble_id
				""" + consulta.where())
				.params(consulta.parametros())
				.query(Long.class)
				.single();
	}

	public int ultimaVersion(JdbcClient jdbc, UUID inspeccionId) {
		return jdbc.sql("select coalesce(max(version), 0) from public.informes where inspeccion_id = :id")
				.param("id", inspeccionId).query(Integer.class).single();
	}

	// Ruta en Storage de cada foto de la inspección (para meterlas en el acta).
	public Map<UUID, String> rutasDeFotos(JdbcClient jdbc, UUID inspeccionId) {
		Map<UUID, String> rutas = new HashMap<>();
		jdbc.sql("""
				select e.id, e.storage_path from public.evidencias e
				join public.detalles_inspeccion d on d.id = e.detalle_id
				where d.inspeccion_id = :id
				""")
				.param("id", inspeccionId)
				.query((fila, numero) -> rutas.put(fila.getObject("id", UUID.class), fila.getString("storage_path")))
				.list();
		return rutas;
	}

	// registrar_informe valida que la inspección esté finalizada y sea visible,
	// y deja la auditoría. UNIQUE(inspeccion_id, version) evita duplicados.
	public void registrar(JdbcClient jdbc, UUID id, UUID inspeccionId, int version, String ruta, String sha256) {
		jdbc.sql("select public.registrar_informe(:id, :inspeccion, :version, :ruta, :sha)")
				.param("id", id).param("inspeccion", inspeccionId).param("version", version)
				.param("ruta", ruta).param("sha", sha256)
				.query((fila, numero) -> Boolean.TRUE)
				.list();
	}

	Optional<ParaDescarga> paraDescarga(JdbcClient jdbc, UUID id) {
		return jdbc.sql("select storage_path, version, generado_en from public.informes where id = :id")
				.param("id", id)
				.query((fila, numero) -> new ParaDescarga(
						fila.getString("storage_path"), fila.getInt("version"),
						fila.getObject("generado_en", OffsetDateTime.class)))
				.optional();
	}

	// ---------- Ayudas ----------

	private record Consulta(String where, Map<String, Object> parametros) {
	}

	private static Consulta filtrar(String busqueda, String tipo) {
		List<String> condiciones = new ArrayList<>();
		Map<String, Object> parametros = new LinkedHashMap<>();
		if (tipo != null) {
			condiciones.add("s.tipo = :tipo::public.inspeccion_tipo");
			parametros.put("tipo", tipo);
		}
		if (busqueda != null) {
			condiciones.add("(im.codigo ilike :patron or im.direccion ilike :patron or im.barrio ilike :patron)");
			parametros.put("patron", Busqueda.contiene(busqueda));
		}
		return new Consulta(condiciones.isEmpty() ? "" : " where " + String.join(" and ", condiciones), parametros);
	}

	private static GeneradoPor generadoPor(ResultSet fila) throws SQLException {
		String nombre = fila.getString("generado_por");
		return nombre == null ? null : new GeneradoPor(nombre);
	}

	private static InformeConInspeccion aConInspeccion(ResultSet fila, int numero) throws SQLException {
		UUID inspeccionId = fila.getObject("s_id", UUID.class);
		String codigo = fila.getString("im_codigo");
		return new InformeConInspeccion(
				fila.getObject("id", UUID.class),
				fila.getObject("inspeccion_id", UUID.class),
				fila.getInt("version"),
				fila.getObject("generado_en", OffsetDateTime.class),
				generadoPor(fila),
				inspeccionId == null ? null : new InformeConInspeccion.Inspeccion(inspeccionId, fila.getString("s_tipo"),
						codigo == null ? null : new InformeConInspeccion.Inmueble(codigo, fila.getString("im_direccion"))));
	}
}
