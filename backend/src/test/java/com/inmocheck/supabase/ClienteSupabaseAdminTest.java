package com.inmocheck.supabase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.inmocheck.comun.errores.ServicioNoDisponibleException;
import com.inmocheck.config.PropiedadesSupabase;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

// Lo que Spring le pide a Supabase, comprobado sin red y SIN enviar correos:
// un servidor falso revisa la ruta, las cabeceras y el cuerpo de cada llamada.
class ClienteSupabaseAdminTest {

	private static final String URL = "https://proyecto.supabase.co";
	private static final String LLAVE = "llave-service-role-de-prueba";
	private static final String ENLACE = "http://localhost:3000/auth/enlace?siguiente=/auth/actualizar-contrasena";
	private static final String ENLACE_CODIFICADO =
			"http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fenlace%3Fsiguiente%3D%2Fauth%2Factualizar-contrasena";

	private final RestClient.Builder fabrica = RestClient.builder();
	private final MockRestServiceServer supabase = MockRestServiceServer.bindTo(fabrica).build();
	private final ClienteSupabaseAdmin cliente = new ClienteSupabaseAdmin(new PropiedadesSupabase(URL, LLAVE), fabrica);

	@Test
	void invitarCreaLaCuentaConElNombreYDevuelveElId() {
		UUID id = UUID.randomUUID();
		supabase.expect(requestTo(URL + "/auth/v1/invite?redirect_to=" + ENLACE_CODIFICADO))
				.andExpect(method(HttpMethod.POST))
				.andExpect(header("apikey", LLAVE))
				.andExpect(header("Authorization", "Bearer " + LLAVE))
				.andExpect(content().json("{\"email\":\"ana@prueba.co\",\"data\":{\"nombre\":\"Ana Prueba\"}}"))
				.andRespond(withSuccess("{\"id\":\"" + id + "\",\"email\":\"ana@prueba.co\"}", MediaType.APPLICATION_JSON));

		assertThat(cliente.invitar("ana@prueba.co", "Ana Prueba", ENLACE)).isEqualTo(id);
		supabase.verify();
	}

	@Test
	void unRechazoDeSupabaseSeReconoce() {
		supabase.expect(requestTo(URL + "/auth/v1/invite?redirect_to=" + ENLACE_CODIFICADO))
				.andRespond(withStatus(HttpStatus.UNPROCESSABLE_CONTENT)
						.body("{\"msg\":\"A user with this email address has already been registered\"}")
						.contentType(MediaType.APPLICATION_JSON));

		assertThatThrownBy(() -> cliente.invitar("ana@prueba.co", "Ana", ENLACE))
				.isInstanceOf(RestClientResponseException.class)
				.satisfies(error -> assertThat(ClienteSupabaseAdmin.esRechazo((RuntimeException) error)).isTrue());
	}

	@Test
	void enviarEnlaceUsaRecoverSinCodigoPkce() {
		supabase.expect(requestTo(URL + "/auth/v1/recover?redirect_to=" + ENLACE_CODIFICADO))
				.andExpect(method(HttpMethod.POST))
				.andExpect(content().json("{\"email\":\"laura@pinos.test\"}", true))
				.andRespond(withSuccess());

		cliente.enviarEnlaceDeContrasena("laura@pinos.test", ENLACE);
		supabase.verify();
	}

	@Test
	void insertarUsaLaApiRestSinPedirLaFilaDeVuelta() {
		supabase.expect(requestTo(URL + "/rest/v1/auditoria"))
				.andExpect(method(HttpMethod.POST))
				.andExpect(header("Prefer", "return=minimal"))
				.andExpect(header("apikey", LLAVE))
				.andExpect(content().json("{\"accion\":\"INVITADO\"}"))
				.andRespond(withStatus(HttpStatus.CREATED));

		cliente.insertar("auditoria", Map.of("accion", "INVITADO"));
		supabase.verify();
	}

	@Test
	void borrarUsuarioUsaLaApiAdmin() {
		UUID id = UUID.randomUUID();
		supabase.expect(requestTo(URL + "/auth/v1/admin/users/" + id))
				.andExpect(method(HttpMethod.DELETE))
				.andRespond(withSuccess());

		cliente.borrarUsuario(id);
		supabase.verify();
	}

	@Test
	void sinLlaveResponde503SinLlamarASupabase() {
		ClienteSupabaseAdmin sinLlave = new ClienteSupabaseAdmin(new PropiedadesSupabase(URL, ""));

		assertThatThrownBy(() -> sinLlave.invitar("ana@prueba.co", "Ana", ENLACE))
				.isInstanceOf(ServicioNoDisponibleException.class)
				.hasMessageContaining("SUPABASE_SERVICE_ROLE_KEY");
	}
}
