package com.inmocheck.comun.datos;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.Function;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.json.JsonMapper;

// ÚNICA puerta del back a la base de datos.
//
// El usuario con el que Spring se conecta a Supabase se salta RLS. Por eso
// cada trabajo corre dentro de una transacción que primero:
//   1. baja a "authenticated", el rol al que aplican las políticas RLS, y
//   2. pone los claims del token del usuario en request.jwt.claims, de donde
//      auth.uid() lee quién está conectado.
// Así las políticas, mi_organizacion() y las funciones SQL de estado se
// comportan exactamente como cuando el front hablaba directo con Supabase.
// Ambos ajustes son "local": se deshacen al terminar la transacción y la
// conexión vuelve limpia al pool.
//
// Los repositorios NO reciben JdbcClient por inyección: lo reciben como
// argumento dentro de ejecutar(). EjecutorRlsUnicaPuertaTest lo verifica.
@Component
public class EjecutorRls {

	private final JdbcClient jdbc;
	private final TransactionTemplate transacciones;
	private final JsonMapper json;

	public EjecutorRls(JdbcClient jdbc, TransactionTemplate transacciones, JsonMapper json) {
		this.jdbc = jdbc;
		this.transacciones = transacciones;
		this.json = json;
	}

	public <T> T ejecutar(Jwt token, Function<JdbcClient, T> trabajo) {
		String claims = claimsComoJson(token);
		return transacciones.execute(estado -> {
			jdbc.sql("set local role authenticated").update();
			jdbc.sql("select set_config('request.jwt.claims', :claims, true)")
					.param("claims", claims)
					.query(String.class)
					.single();
			return trabajo.apply(jdbc);
		});
	}

	// Spring convierte exp e iat a Instant; Supabase los usa en segundos.
	String claimsComoJson(Jwt token) {
		Map<String, Object> claims = new LinkedHashMap<>();
		token.getClaims().forEach((nombre, valor) ->
				claims.put(nombre, valor instanceof Instant instante ? instante.getEpochSecond() : valor));
		return json.writeValueAsString(claims);
	}
}
