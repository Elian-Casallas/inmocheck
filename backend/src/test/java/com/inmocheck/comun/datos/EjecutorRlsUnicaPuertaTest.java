package com.inmocheck.comun.datos;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.RegexPatternTypeFilter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import java.util.regex.Pattern;

// Regla de arquitectura: SOLO EjecutorRls recibe acceso directo a la base.
// Si otra clase de la app inyectara JdbcClient, JdbcTemplate o DataSource,
// podría consultar con el usuario de conexión y saltarse RLS sin que nadie
// lo note. Esta prueba falla en cuanto eso pase.
class EjecutorRlsUnicaPuertaTest {

	private static final Set<Class<?>> ACCESO_DIRECTO = Set.of(
			JdbcClient.class, JdbcTemplate.class, NamedParameterJdbcTemplate.class, DataSource.class);

	@Test
	void soloEjecutorRlsRecibeAccesoDirectoALaBase() throws ClassNotFoundException {
		List<String> infractoras = new ArrayList<>();
		for (Class<?> clase : clasesDeLaApp()) {
			if (clase != EjecutorRls.class && recibeAccesoDirecto(clase)) {
				infractoras.add(clase.getName());
			}
		}
		assertThat(infractoras)
				.as("Estas clases deben usar EjecutorRls en vez de acceso directo a la base")
				.isEmpty();
	}

	private static boolean recibeAccesoDirecto(Class<?> clase) {
		Stream<Class<?>> tiposDeConstructores = Arrays.stream(clase.getDeclaredConstructors())
				.map(Constructor::getParameterTypes)
				.flatMap(Arrays::stream);
		Stream<Class<?>> tiposDeCampos = Arrays.stream(clase.getDeclaredFields()).map(Field::getType);
		return Stream.concat(tiposDeConstructores, tiposDeCampos).anyMatch(ACCESO_DIRECTO::contains);
	}

	// Clases compiladas de src/main (las de las pruebas pueden usar la base directo).
	private static List<Class<?>> clasesDeLaApp() throws ClassNotFoundException {
		ClassPathScanningCandidateComponentProvider escaner = new ClassPathScanningCandidateComponentProvider(false) {
			@Override
			protected boolean isCandidateComponent(
					org.springframework.beans.factory.annotation.AnnotatedBeanDefinition definicion) {
				return true;
			}
		};
		escaner.addIncludeFilter(new RegexPatternTypeFilter(Pattern.compile(".*")));

		List<Class<?>> clases = new ArrayList<>();
		for (BeanDefinition definicion : escaner.findCandidateComponents("com.inmocheck")) {
			Class<?> clase = Class.forName(definicion.getBeanClassName());
			String ubicacion = clase.getProtectionDomain().getCodeSource().getLocation().toString();
			if (!ubicacion.contains("test-classes")) {
				clases.add(clase);
			}
		}
		assertThat(clases).as("el escaneo debe encontrar las clases de la app").contains(EjecutorRls.class);
		return clases;
	}
}
