package com.inmocheck;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

// Ayuda para las pruebas que usan la base REAL de Supabase (datos de seed.sql).
// Se usan con @EnabledIf("com.inmocheck.BaseDePrueba#hayBaseConfigurada"):
// si backend/.env no tiene SUPABASE_DB_URL, la prueba se salta.
public final class BaseDePrueba {

	private static final String CLAVE = "SUPABASE_DB_URL=";

	private BaseDePrueba() {
	}

	public static boolean hayBaseConfigurada() throws IOException {
		Path env = Path.of(".env");
		return Files.exists(env) && Files.readAllLines(env).stream()
				.anyMatch(linea -> linea.startsWith(CLAVE) && linea.length() > CLAVE.length());
	}
}
