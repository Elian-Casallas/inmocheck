package com.inmocheck.evidencias;

import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

// Corre dentro de EjecutorRls. Registrar y retirar fotos va por las funciones
// SQL de evidencias_y_buckets.sql: validan que sea el inspector asignado, que
// la inspección esté en proceso y el límite de fotos.
@Repository
public class EvidenciasRepository {

	// ¿Existe ese elemento en ESA inspección y el usuario lo puede ver (RLS)?
	public boolean detalleVisible(JdbcClient jdbc, UUID inspeccionId, UUID detalleId) {
		return jdbc.sql("select exists (select 1 from public.detalles_inspeccion where id = :detalle and inspeccion_id = :inspeccion)")
				.param("detalle", detalleId)
				.param("inspeccion", inspeccionId)
				.query(Boolean.class)
				.single();
	}

	public void registrar(JdbcClient jdbc, UUID id, UUID detalleId, String ruta, TipoImagen tipo, int bytes,
			String descripcion) {
		jdbc.sql("select public.registrar_evidencia(:id, :detalle, :ruta, :mime, :bytes, :descripcion)")
				.param("id", id)
				.param("detalle", detalleId)
				.param("ruta", ruta)
				.param("mime", tipo.mime())
				.param("bytes", bytes)
				.param("descripcion", descripcion, java.sql.Types.VARCHAR)
				.query((fila, numero) -> Boolean.TRUE)
				.list();
	}

	// Ruta del archivo, solo si RLS deja ver la evidencia.
	public Optional<String> rutaVisible(JdbcClient jdbc, UUID id) {
		return jdbc.sql("select storage_path from public.evidencias where id = :id")
				.param("id", id)
				.query(String.class)
				.optional();
	}

	// Borra el registro y devuelve la ruta del archivo para quitarlo de Storage.
	public String eliminar(JdbcClient jdbc, UUID id) {
		return jdbc.sql("select public.eliminar_evidencia(:id)")
				.param("id", id)
				.query(String.class)
				.single();
	}
}
