package com.inmocheck.inventario;

import com.inmocheck.inventario.InventarioDtos.CrearElemento;
import com.inmocheck.inventario.InventarioDtos.CrearEspacio;
import com.inmocheck.inventario.InventarioDtos.ElementoRespuesta;
import com.inmocheck.inventario.InventarioDtos.EspacioRespuesta;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

// Solo habla con la base: no decide reglas. Corre dentro de EjecutorRls:
// RLS deja ver el inventario al administrador de la organización y al
// inspector que tiene una inspección en ese inmueble; solo el admin escribe.
// Nunca se borra nada: se desactiva (activo = false).
@Repository
public class InventarioRepository {

	private static final TypeReference<List<ElementoRespuesta>> LISTA_ELEMENTOS = new TypeReference<>() {
	};

	private static final String COLUMNAS_ELEMENTO = "id, espacio_id, nombre, obligatorio, orden, activo";

	// Cada espacio trae sus elementos como JSON, ordenados igual que en el BFF.
	private static final String COLUMNAS_ESPACIO = """
			select s.id, s.inmueble_id, s.nombre, s.orden, s.activo,
			       coalesce((select json_agg(json_build_object(
			                   'id', e.id, 'espacioId', e.espacio_id, 'nombre', e.nombre,
			                   'obligatorio', e.obligatorio, 'orden', e.orden, 'activo', e.activo)
			                   order by e.orden, e.created_at)
			                 from public.elementos e where e.espacio_id = s.id), '[]') as elementos
			from public.espacios s
			""";

	private final JsonMapper json;

	public InventarioRepository(JsonMapper json) {
		this.json = json;
	}

	public List<EspacioRespuesta> listarEspacios(JdbcClient jdbc, UUID inmuebleId) {
		return jdbc.sql(COLUMNAS_ESPACIO + " where s.inmueble_id = :inmueble order by s.orden, s.created_at")
				.param("inmueble", inmuebleId)
				.query(this::aEspacio)
				.list();
	}

	public Optional<EspacioRespuesta> buscarEspacio(JdbcClient jdbc, UUID id) {
		return jdbc.sql(COLUMNAS_ESPACIO + " where s.id = :id")
				.param("id", id)
				.query(this::aEspacio)
				.optional();
	}

	// Organización del espacio, para heredarla al crear un elemento.
	public Optional<UUID> organizacionDelEspacio(JdbcClient jdbc, UUID espacioId) {
		return jdbc.sql("select organizacion_id from public.espacios where id = :id")
				.param("id", espacioId)
				.query(UUID.class)
				.optional();
	}

	// "Al final": uno más que los que ya hay (como el BFF).
	public int siguienteOrdenEspacio(JdbcClient jdbc, UUID inmuebleId) {
		return jdbc.sql("select count(*) + 1 from public.espacios where inmueble_id = :id")
				.param("id", inmuebleId).query(Integer.class).single();
	}

	public int siguienteOrdenElemento(JdbcClient jdbc, UUID espacioId) {
		return jdbc.sql("select count(*) + 1 from public.elementos where espacio_id = :id")
				.param("id", espacioId).query(Integer.class).single();
	}

	public UUID insertarEspacio(JdbcClient jdbc, UUID organizacionId, UUID inmuebleId, CrearEspacio datos, int orden) {
		return jdbc.sql("""
				insert into public.espacios (organizacion_id, inmueble_id, nombre, orden)
				values (:organizacion, :inmueble, :nombre, :orden)
				returning id
				""")
				.param("organizacion", organizacionId)
				.param("inmueble", inmuebleId)
				.param("nombre", datos.nombre())
				.param("orden", orden)
				.query(UUID.class)
				.single();
	}

	public Optional<UUID> actualizarEspacio(JdbcClient jdbc, UUID id, Map<String, Object> cambios) {
		return actualizar(jdbc, "espacios", id, cambios);
	}

	public ElementoRespuesta insertarElemento(
			JdbcClient jdbc, UUID organizacionId, UUID espacioId, CrearElemento datos, int orden) {
		return jdbc.sql("""
				insert into public.elementos (organizacion_id, espacio_id, nombre, obligatorio, orden)
				values (:organizacion, :espacio, :nombre, :obligatorio, :orden)
				returning\s""" + COLUMNAS_ELEMENTO)
				.param("organizacion", organizacionId)
				.param("espacio", espacioId)
				.param("nombre", datos.nombre())
				.param("obligatorio", datos.obligatorio())
				.param("orden", orden)
				.query(InventarioRepository::aElemento)
				.single();
	}

	public Optional<ElementoRespuesta> actualizarElemento(JdbcClient jdbc, UUID id, Map<String, Object> cambios) {
		if (cambios.isEmpty()) {
			return jdbc.sql("select " + COLUMNAS_ELEMENTO + " from public.elementos where id = :id")
					.param("id", id).query(InventarioRepository::aElemento).optional();
		}
		return jdbc.sql("update public.elementos set " + asignaciones(cambios)
						+ " where id = :id returning " + COLUMNAS_ELEMENTO)
				.params(cambios)
				.param("id", id)
				.query(InventarioRepository::aElemento)
				.optional();
	}

	// ---------- Ayudas ----------

	// Las claves de "cambios" ya vienen filtradas por CambiosDeInventario
	// (nombre, orden, obligatorio, activo): son columnas reales, nunca texto libre.
	private static Optional<UUID> actualizar(JdbcClient jdbc, String tabla, UUID id, Map<String, Object> cambios) {
		if (cambios.isEmpty()) {
			return jdbc.sql("select id from public." + tabla + " where id = :id")
					.param("id", id).query(UUID.class).optional();
		}
		return jdbc.sql("update public." + tabla + " set " + asignaciones(cambios) + " where id = :id returning id")
				.params(cambios)
				.param("id", id)
				.query(UUID.class)
				.optional();
	}

	private static String asignaciones(Map<String, Object> cambios) {
		return String.join(", ", cambios.keySet().stream().map(columna -> columna + " = :" + columna).toList());
	}

	private EspacioRespuesta aEspacio(ResultSet fila, int numero) throws SQLException {
		return new EspacioRespuesta(
				fila.getObject("id", UUID.class),
				fila.getObject("inmueble_id", UUID.class),
				fila.getString("nombre"),
				fila.getInt("orden"),
				fila.getBoolean("activo"),
				json.readValue(fila.getString("elementos"), LISTA_ELEMENTOS));
	}

	private static ElementoRespuesta aElemento(ResultSet fila, int numero) throws SQLException {
		return new ElementoRespuesta(
				fila.getObject("id", UUID.class),
				fila.getObject("espacio_id", UUID.class),
				fila.getString("nombre"),
				fila.getBoolean("obligatorio"),
				fila.getInt("orden"),
				fila.getBoolean("activo"));
	}
}
