package com.inmocheck.dashboard;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

// Conteos del resumen que no son de inspecciones. Corre dentro de EjecutorRls:
// RLS solo deja ver filas de la organización del administrador.
@Repository
public class DashboardRepository {

	public long contarInmueblesActivos(JdbcClient jdbc) {
		return jdbc.sql("select count(*) from public.inmuebles where activo")
				.query(Long.class).single();
	}

	public long contarInspectoresActivos(JdbcClient jdbc) {
		return jdbc.sql("select count(*) from public.perfiles where rol = 'INSPECTOR' and activo")
				.query(Long.class).single();
	}
}
