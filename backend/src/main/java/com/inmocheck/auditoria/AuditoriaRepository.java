package com.inmocheck.auditoria;

import com.inmocheck.comun.http.ParametrosPagina;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

// Solo lectura. La auditoría la escriben los triggers y las funciones SQL;
// RLS (auditoria_admin_ver) solo deja verla al administrador de su organización.
@Repository
public class AuditoriaRepository {

	public record Evento(UUID id, String recurso, UUID recursoId, String accion, OffsetDateTime fecha, Actor actor) {

		// null si el cambio lo hizo el sistema o RLS no deja ver el perfil.
		public record Actor(UUID id, String nombre) {
		}
	}

	public record Filtro(String recurso, UUID recursoId, LocalDate desde, LocalDate hasta) {
	}

	public List<Evento> listar(JdbcClient jdbc, Filtro filtro, ParametrosPagina pagina) {
		Consulta consulta = filtrar(filtro);
		return jdbc.sql("""
				select a.id, a.recurso, a.recurso_id, a.accion, a.fecha, pf.id as actor_id, pf.nombre as actor_nombre
				from public.auditoria a
				left join public.perfiles pf on pf.id = a.actor_id
				""" + consulta.where() + " order by a.fecha desc, a.id limit :limite offset :desde")
				.params(consulta.parametros())
				.param("limite", pagina.pageSize())
				.param("desde", pagina.desde())
				.query(AuditoriaRepository::aEvento)
				.list();
	}

	public long contar(JdbcClient jdbc, Filtro filtro) {
		Consulta consulta = filtrar(filtro);
		return jdbc.sql("select count(*) from public.auditoria a" + consulta.where())
				.params(consulta.parametros())
				.query(Long.class)
				.single();
	}

	private record Consulta(String where, Map<String, Object> parametros) {
	}

	private static Consulta filtrar(Filtro filtro) {
		List<String> condiciones = new ArrayList<>();
		Map<String, Object> parametros = new LinkedHashMap<>();
		if (filtro.recurso() != null) {
			condiciones.add("a.recurso = :recurso");
			parametros.put("recurso", filtro.recurso());
		}
		if (filtro.recursoId() != null) {
			condiciones.add("a.recurso_id = :recursoId");
			parametros.put("recursoId", filtro.recursoId());
		}
		// Igual que el BFF: desde el inicio del día "desde" hasta el final del día "hasta" (UTC).
		if (filtro.desde() != null) {
			condiciones.add("a.fecha >= :fechaDesde");
			parametros.put("fechaDesde", filtro.desde().atStartOfDay().atOffset(ZoneOffset.UTC));
		}
		if (filtro.hasta() != null) {
			condiciones.add("a.fecha <= :fechaHasta");
			parametros.put("fechaHasta", filtro.hasta().atTime(23, 59, 59).atOffset(ZoneOffset.UTC));
		}
		return new Consulta(condiciones.isEmpty() ? "" : " where " + String.join(" and ", condiciones), parametros);
	}

	private static Evento aEvento(ResultSet fila, int numero) throws SQLException {
		UUID actorId = fila.getObject("actor_id", UUID.class);
		return new Evento(
				fila.getObject("id", UUID.class),
				fila.getString("recurso"),
				fila.getObject("recurso_id", UUID.class),
				fila.getString("accion"),
				fila.getObject("fecha", OffsetDateTime.class),
				actorId == null ? null : new Evento.Actor(actorId, fila.getString("actor_nombre")));
	}
}
