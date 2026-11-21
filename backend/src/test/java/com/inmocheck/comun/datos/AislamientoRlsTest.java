package com.inmocheck.comun.datos;

import static org.assertj.core.api.Assertions.assertThat;

import com.inmocheck.comun.sesion.PerfilesRepository;
import com.inmocheck.comun.sesion.PerfilesRepository.PerfilEncontrado;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.oauth2.jwt.Jwt;

// Prueba CONTRA LA BASE REAL de Supabase, con los datos de supabase/seed.sql
// (dos inmobiliarias: Los Pinos y Andes). Solo lee; no cambia nada.
//
// Se salta sola si backend/.env no tiene SUPABASE_DB_URL.
//
// Demuestra que, a través de EjecutorRls, un administrador de una
// inmobiliaria NO ve datos de la otra (CA-14, RN-10), y que sin
// EjecutorRls el usuario de conexión sí vería todo: por eso es la única puerta.
@SpringBootTest
@EnabledIf("com.inmocheck.BaseDePrueba#hayBaseConfigurada")
class AislamientoRlsTest {

	private static final UUID LOS_PINOS = UUID.fromString("a0000000-0000-4000-8000-000000000001");
	private static final UUID ANDES = UUID.fromString("b0000000-0000-4000-8000-000000000001");
	private static final UUID ADMIN_PINOS = UUID.fromString("a1000000-0000-4000-8000-000000000001");
	private static final UUID ADMIN_ANDES = UUID.fromString("b1000000-0000-4000-8000-000000000001");

	@Autowired
	private EjecutorRls ejecutor;

	@Autowired
	private PerfilesRepository perfiles;

	// Solo para el control "sin RLS". La app nunca hace esto (EjecutorRlsUnicaPuertaTest).
	@Autowired
	private JdbcClient jdbcSinRls;

	@Test
	void elAdminDeLosPinosSoloVeSuInmobiliaria() {
		Jwt token = tokenDe(ADMIN_PINOS);

		PerfilEncontrado perfil = ejecutor.ejecutar(token, jdbc -> perfiles.buscar(jdbc, ADMIN_PINOS)).orElseThrow();
		assertThat(perfil.organizacionId()).isEqualTo(LOS_PINOS);

		assertThat(contar(token, "select count(*) from public.inmuebles where organizacion_id = '" + LOS_PINOS + "'"))
				.as("ve los inmuebles de su inmobiliaria").isPositive();
		assertThat(contar(token, "select count(*) from public.inmuebles where organizacion_id = '" + ANDES + "'"))
				.as("no ve inmuebles de Andes").isZero();
		assertThat(contar(token, "select count(*) from public.perfiles where organizacion_id = '" + ANDES + "'"))
				.as("no ve personal de Andes").isZero();
		assertThat(contar(token, "select count(*) from public.organizaciones"))
				.as("solo ve su organización").isEqualTo(1);
	}

	@Test
	void elAdminDeAndesNoVeLosPinos() {
		Jwt token = tokenDe(ADMIN_ANDES);

		assertThat(contar(token, "select count(*) from public.inmuebles where organizacion_id = '" + ANDES + "'"))
				.isPositive();
		assertThat(contar(token, "select count(*) from public.inmuebles where organizacion_id = '" + LOS_PINOS + "'"))
				.isZero();
	}

	@Test
	void dentroDeEjecutorRlsAuthUidEsElUsuarioDelToken() {
		String uid = ejecutor.ejecutar(tokenDe(ADMIN_ANDES), jdbc ->
				jdbc.sql("select auth.uid()::text").query(String.class).single());

		assertThat(uid).isEqualTo(ADMIN_ANDES.toString());
	}

	@Test
	void sinEjecutorRlsElUsuarioDeConexionVeriaTodo() {
		long organizaciones = jdbcSinRls.sql("select count(*) from public.organizaciones").query(Long.class).single();

		assertThat(organizaciones)
				.as("control: sin EjecutorRls no hay aislamiento, por eso es la única puerta")
				.isGreaterThanOrEqualTo(2);
	}

	private long contar(Jwt token, String consulta) {
		return ejecutor.ejecutar(token, jdbc -> jdbc.sql(consulta).query(Long.class).single());
	}

	// Token como el que valida SeguridadConfig. Aquí no se verifica la firma:
	// lo que se prueba es lo que pasa en la base con esos claims.
	private static Jwt tokenDe(UUID usuario) {
		return Jwt.withTokenValue("prueba")
				.header("alg", "ES256")
				.subject(usuario.toString())
				.claim("role", "authenticated")
				.build();
	}
}
