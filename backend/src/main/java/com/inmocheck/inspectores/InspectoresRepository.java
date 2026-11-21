package com.inmocheck.inspectores;

import com.inmocheck.comun.datos.Busqueda;
import com.inmocheck.comun.http.ParametrosPagina;
import com.inmocheck.inspectores.InspectoresDtos.InspectorRespuesta;
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

// Inspectores = perfiles con rol INSPECTOR. Corre dentro de EjecutorRls:
// RLS deja al administrador ver y editar solo los de su organización.
@Repository
public class InspectoresRepository {

	// Las inspecciones abiertas se cuentan en la misma consulta (una sola ida a la base).
	private static final String COLUMNAS = """
			select p.id, p.nombre, p.email, p.activo, p.created_at,
			       (select count(*) from public.inspecciones s
			        where s.inspector_id = p.id and s.estado in ('PENDIENTE', 'EN_PROCESO')) as abiertas
			from public.perfiles p
			""";

	public List<InspectorRespuesta> listar(JdbcClient jdbc, String busqueda, Boolean activo, ParametrosPagina pagina) {
		Consulta consulta = filtrar(busqueda, activo);
		return jdbc.sql(COLUMNAS + consulta.where() + " order by p.nombre, p.id limit :limite offset :desde")
				.params(consulta.parametros())
				.param("limite", pagina.pageSize())
				.param("desde", pagina.desde())
				.query(InspectoresRepository::aRespuesta)
				.list();
	}

	public long contar(JdbcClient jdbc, String busqueda, Boolean activo) {
		Consulta consulta = filtrar(busqueda, activo);
		return jdbc.sql("select count(*) from public.perfiles p" + consulta.where())
				.params(consulta.parametros())
				.query(Long.class)
				.single();
	}

	public Optional<InspectorRespuesta> buscar(JdbcClient jdbc, UUID id) {
		return jdbc.sql(COLUMNAS + " where p.id = :id and p.rol = 'INSPECTOR'")
				.param("id", id)
				.query(InspectoresRepository::aRespuesta)
				.optional();
	}

	// Solo nombre y activo: la base no deja cambiar rol ni organización
	// (grant update (nombre, activo) on perfiles).
	public Optional<UUID> actualizar(JdbcClient jdbc, UUID id, Map<String, Object> cambios) {
		String asignaciones = String.join(", ", cambios.keySet().stream().map(c -> c + " = :" + c).toList());
		return jdbc.sql("update public.perfiles set " + asignaciones
						+ " where id = :id and rol = 'INSPECTOR' returning id")
				.params(cambios)
				.param("id", id)
				.query(UUID.class)
				.optional();
	}

	private record Consulta(String where, Map<String, Object> parametros) {
	}

	private static Consulta filtrar(String busqueda, Boolean activo) {
		List<String> condiciones = new ArrayList<>(List.of("p.rol = 'INSPECTOR'"));
		Map<String, Object> parametros = new LinkedHashMap<>();
		if (activo != null) {
			condiciones.add("p.activo = :activo");
			parametros.put("activo", activo);
		}
		if (busqueda != null) {
			condiciones.add("(p.nombre ilike :patron or p.email ilike :patron)");
			parametros.put("patron", Busqueda.contiene(busqueda));
		}
		return new Consulta(" where " + String.join(" and ", condiciones), parametros);
	}

	private static InspectorRespuesta aRespuesta(ResultSet fila, int numero) throws SQLException {
		return new InspectorRespuesta(
				fila.getObject("id", UUID.class),
				fila.getString("nombre"),
				fila.getString("email"),
				fila.getBoolean("activo"),
				fila.getObject("created_at", OffsetDateTime.class),
				fila.getInt("abiertas"));
	}
}
