package com.inmocheck;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

// Punto de entrada del backend de InmoCheck. Cada módulo (inmuebles,
// inspecciones…) vive en su propio paquete bajo com.inmocheck.
@SpringBootApplication
@ConfigurationPropertiesScan
public class InmocheckApplication {

	public static void main(String[] args) {
		SpringApplication.run(InmocheckApplication.class, args);
	}
}
