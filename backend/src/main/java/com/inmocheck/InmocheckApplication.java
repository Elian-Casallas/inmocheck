package com.inmocheck;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

// Punto de entrada del backend de InmoCheck. Cada módulo (inmuebles,
// inspecciones…) vive en su propio paquete bajo com.inmocheck.
@SpringBootApplication
@ConfigurationPropertiesScan
public class InmocheckApplication {

	// Java recuerda 10 s una búsqueda de DNS fallida: en ese tiempo cada
	// reintento de conexión a Supabase falla sin volver a preguntar. Con 0,
	// cada reintento pregunta de nuevo y un tropiezo de DNS dura un instante.
	// Va en un bloque estático para que aplique también en las pruebas.
	static {
		java.security.Security.setProperty("networkaddress.cache.negative.ttl", "0");
	}

	public static void main(String[] args) {
		SpringApplication.run(InmocheckApplication.class, args);
	}
}
