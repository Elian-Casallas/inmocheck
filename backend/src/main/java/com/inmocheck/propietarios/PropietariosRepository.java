package com.inmocheck.propietarios;

import com.inmocheck.comun.http.ParametrosPagina;
import com.inmocheck.propietarios.PropietarioRespuesta.InmuebleResumen;
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
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

// Solo habla con la base: no decide reglas. Todas las consultas corren dentro
// de EjecutorRls, así que RLS ya limita a la organización del administrador
// (política personas_admin_ver): por eso no hay "where organizacion_id".
@Repository
public class PropietariosRepository {

	private static final TypeReference<List<InmuebleResumen>> LISTA_INMUEBLES = new TypeReference<>() {
	};

	// Los inmuebles del propietario van en la misma fila como JSON.
	private static final String COLUMNAS = """
			select p.id, p.nombre, p.email, p.telefono, p.tipo::text as tipo, p.created_at,
			       coalesce((select json_agg(json_build_object('id', i.id, 'codigo', i.codigo, 'activo', i.activo)
			                                 order by i.codigo)
			                 from public.inmuebles i
			                 where i.propietario_id = p.id), '[]') as inmuebles
			from public.personas p
			""";

	private final JsonMapper json;

	public PropietariosRepository(JsonMapper json) {
		this.json = json;
	}

	public List<PropietarioRespuesta> listar(JdbcClient jdbc, FiltroPropietarios filtro, ParametrosPagina pagina) {
		Consulta consulta = filtrar(filtro);
		return jdbc.sql(COLUMNAS + consulta.where() + " order by p.nombre limit :limite offset :desde")
				.params(consulta.parametros())
				.param("limite", pagina.pageSize())
				.param("desde", pagina.desde())
				.query(this::aRespuesta)
				.list();
	}

	public long contar(JdbcClient jdbc, FiltroPropietarios filtro) {
		Consulta consulta = filtrar(filtro);
		return jdbc.sql("select count(*) from public.personas p " + consulta.where())
				.params(consulta.parametros())
				.query(Long.class)
				.single();
	}

	// Por id, sin filtrar por tipo ni activo (igual que el BFF).
	// De otra organización: RLS lo oculta y llega vacío → 404 en el servicio.
	public Optional<PropietarioRespuesta> buscar(JdbcClient jdbc, UUID id) {
		return jdbc.sql(COLUMNAS + " where p.id = :id")
				.param("id", id)
				.query(this::aRespuesta)
				.optional();
	}

	public UUID insertar(JdbcClient jdbc, UUID organizacionId, CrearPropietario datos) {
		return jdbc.sql("""
				insert into public.personas (organizacion_id, nombre, email, telefono, tipo)
				values (:organizacion, :nombre, :email, :telefono, 'PROPIETARIO')
				returning id
				""")
				.param("organizacion", organizacionId)
				.param("nombre", datos.nombre())
				.param("email", datos.email())
				.param("telefono", datos.telefono())
				.query(UUID.class)
				.single();
	}

	// Solo cambia los campos que llegaron. Vacío si no existe o RLS lo oculta.
	public Optional<UUID> actualizar(JdbcClient jdbc, UUID id, EditarPropietario datos) {
		Map<String, Object> cambios = new LinkedHashMap<>();
		if (datos.nombre() != null) cambios.put("nombre", datos.nombre().orElse(null));
		if (datos.email() != null) cambios.put("email", datos.email().orElse(null));
		if (datos.telefono() != null) cambios.put("telefono", datos.telefono().orElse(null));

		List<String> asignaciones = cambios.keySet().stream().map(columna -> columna + " = :" + columna).toList();
		return jdbc.sql("update public.personas set " + String.join(", ", asignaciones)
						+ " where id = :id returning id")
				.params(cambios)
				.param("id", id)
				.query(UUID.class)
				.optional();
	}

	// ---------- Ayudas ----------

	private record Consulta(String where, Map<String, Object> parametros) {
	}

	private static Consulta filtrar(FiltroPropietarios filtro) {
		List<String> condiciones = new ArrayList<>(List.of("p.tipo = 'PROPIETARIO'", "p.activo"));
		Map<String, Object> parametros = new LinkedHashMap<>();

		if (filtro.busqueda() != null) {
			condiciones.add("(p.nombre ilike :patron or p.email ilike :patron)");
			parametros.put("patron", "%" + escaparComodines(filtro.busqueda()) + "%");
		}
		String tieneInmuebles = "exists (select 1 from public.inmuebles i where i.propietario_id = p.id)";
		if (filtro.inmuebles() == FiltroPropietarios.ConInmuebles.CON) condiciones.add(tieneInmuebles);
		if (filtro.inmuebles() == FiltroPropietarios.ConInmuebles.SIN) condiciones.add("not " + tieneInmuebles);

		return new Consulta(" where " + String.join(" and ", condiciones), parametros);
	}

	// En ILIKE, % y _ son comodines: buscar "50%" debe encontrar "50%", no todo.
	static String escaparComodines(String texto) {
		return texto.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
	}

	private PropietarioRespuesta aRespuesta(ResultSet fila, int numero) throws SQLException {
		return new PropietarioRespuesta(
				fila.getObject("id", UUID.class),
				fila.getString("nombre"),
				fila.getString("email"),
				fila.getString("telefono"),
				fila.getString("tipo"),
				fila.getObject("created_at", OffsetDateTime.class),
				json.readValue(fila.getString("inmuebles"), LISTA_INMUEBLES));
	}
}
