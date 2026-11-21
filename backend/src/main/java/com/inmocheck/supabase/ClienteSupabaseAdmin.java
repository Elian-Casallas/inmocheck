package com.inmocheck.supabase;

import com.inmocheck.comun.errores.ServicioNoDisponibleException;
import com.inmocheck.config.PropiedadesSupabase;
import java.net.URI;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriBuilder;

// Llamadas a Supabase con la llave service_role (equivale a lib/supabase/admin.ts).
//
// ⚠ Esta llave SALTA las políticas RLS. Reglas:
//   * Solo para lo que no se puede hacer con la sesión del usuario:
//     crear cuentas, enviar correos y escribir perfiles o auditoría.
//   * Siempre DESPUÉS de autorizar al usuario (rol en el controller y,
//     cuando aplica, una consulta bajo RLS en el servicio).
//   * La llave sale de variables de entorno y nunca se registra en el log.
@Component
public class ClienteSupabaseAdmin {

	private static final Duration TIEMPO_PARA_CONECTAR = Duration.ofSeconds(5);
	private static final Duration TIEMPO_PARA_RESPONDER = Duration.ofSeconds(20);

	private final PropiedadesSupabase supabase;
	private final RestClient http;

	// Conector HTTP clásico (HttpURLConnection) a propósito: el cliente HTTP
	// moderno de Java abre un socket interno que falla en Windows cuando el
	// usuario tiene espacios en el nombre (ver backend/README.md). Para unas
	// pocas llamadas administrativas el conector clásico es suficiente.
	@Autowired
	public ClienteSupabaseAdmin(PropiedadesSupabase supabase) {
		this(supabase, RestClient.builder().requestFactory(conectorClasico()));
	}

	// Para las pruebas: permite conectar un Supabase falso (MockRestServiceServer).
	ClienteSupabaseAdmin(PropiedadesSupabase supabase, RestClient.Builder fabrica) {
		this.supabase = supabase;
		this.http = fabrica.baseUrl(supabase.base()).build();
	}

	private static SimpleClientHttpRequestFactory conectorClasico() {
		SimpleClientHttpRequestFactory conector = new SimpleClientHttpRequestFactory();
		conector.setConnectTimeout(TIEMPO_PARA_CONECTAR);
		conector.setReadTimeout(TIEMPO_PARA_RESPONDER);
		return conector;
	}

	// Crea la cuenta y le envía el correo de invitación. Devuelve el id del usuario.
	public UUID invitar(String email, String nombre, String enlace) {
		UsuarioCreado usuario = http.post()
				.uri(ruta -> conEnlace(ruta, "/auth/v1/invite", enlace))
				.headers(this::autorizar)
				.contentType(MediaType.APPLICATION_JSON)
				.body(Map.of("email", email, "data", Map.of("nombre", nombre)))
				.retrieve()
				.body(UsuarioCreado.class);
		return usuario.id();
	}

	// Para deshacer una invitación cuando no se pudo crear el perfil.
	public void borrarUsuario(UUID id) {
		http.delete()
				.uri("/auth/v1/admin/users/{id}", id)
				.headers(this::autorizar)
				.retrieve()
				.toBodilessEntity();
	}

	// Envía un enlace para crear o cambiar la contraseña. Sin "code_challenge"
	// es el flujo implícito: el enlace funciona aunque lo abra otra persona en
	// otro dispositivo (el inspector en su celular), como en lib/supabase/correo.ts.
	public void enviarEnlaceDeContrasena(String email, String enlace) {
		http.post()
				.uri(ruta -> conEnlace(ruta, "/auth/v1/recover", enlace))
				.headers(this::autorizar)
				.contentType(MediaType.APPLICATION_JSON)
				.body(Map.of("email", email))
				.retrieve()
				.toBodilessEntity();
	}

	// Inserta una fila con la API REST de Supabase (sin RLS).
	public void insertar(String tabla, Map<String, Object> fila) {
		http.post()
				.uri("/rest/v1/{tabla}", tabla)
				.headers(this::autorizar)
				.header("Prefer", "return=minimal")
				.contentType(MediaType.APPLICATION_JSON)
				.body(fila)
				.retrieve()
				.toBodilessEntity();
	}

	// ---------- Storage (buckets privados) ----------
	// La ruta la arma SIEMPRE el servidor (con UUIDs): nunca viene del cliente.

	public void subirArchivo(String bucket, String ruta, byte[] contenido, String tipo) {
		http.post()
				.uri(uri -> uri.path("/storage/v1/object/" + bucket + "/" + ruta).build())
				.headers(this::autorizar)
				.contentType(MediaType.parseMediaType(tipo))
				.body(contenido)
				.retrieve()
				.toBodilessEntity();
	}

	// Enlace que vence en "segundos". Supabase lo devuelve relativo a /storage/v1.
	public String firmarEnlace(String bucket, String ruta, int segundos) {
		EnlaceFirmado firmado = http.post()
				.uri(uri -> uri.path("/storage/v1/object/sign/" + bucket + "/" + ruta).build())
				.headers(this::autorizar)
				.contentType(MediaType.APPLICATION_JSON)
				.body(Map.of("expiresIn", segundos))
				.retrieve()
				.body(EnlaceFirmado.class);
		return supabase.base() + "/storage/v1" + firmado.signedURL();
	}

	// Enlace firmado que el navegador descarga con ese nombre de archivo
	// (Supabase lo indica con el parámetro "download").
	public String firmarEnlaceDeDescarga(String bucket, String ruta, int segundos, String nombreArchivo) {
		return firmarEnlace(bucket, ruta, segundos) + "&download="
				+ java.net.URLEncoder.encode(nombreArchivo, java.nio.charset.StandardCharsets.UTF_8);
	}

	public byte[] descargarArchivo(String bucket, String ruta) {
		return http.get()
				.uri(uri -> uri.path("/storage/v1/object/" + bucket + "/" + ruta).build())
				.headers(this::autorizar)
				.retrieve()
				.body(byte[].class);
	}

	public void borrarArchivo(String bucket, String ruta) {
		http.delete()
				.uri(uri -> uri.path("/storage/v1/object/" + bucket + "/" + ruta).build())
				.headers(this::autorizar)
				.retrieve()
				.toBodilessEntity();
	}

	private record EnlaceFirmado(String signedURL) {
	}

	private void autorizar(org.springframework.http.HttpHeaders cabeceras) {
		if (!supabase.tieneServiceRole()) {
			throw new ServicioNoDisponibleException("Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.");
		}
		cabeceras.set("apikey", supabase.serviceRoleKey());
		cabeceras.setBearerAuth(supabase.serviceRoleKey());
	}

	// El enlace va como valor de plantilla ({enlace}) para que se codifique
	// COMPLETO: su "?" y su "=" no deben confundirse con los de la URL de Supabase.
	private static URI conEnlace(UriBuilder ruta, String camino, String enlace) {
		return ruta.path(camino).queryParam("redirect_to", "{enlace}").build(enlace);
	}

	private record UsuarioCreado(UUID id) {
	}

	// Supabase respondió con error (correo repetido, límite de envíos…).
	public static boolean esRechazo(RuntimeException error) {
		return error instanceof RestClientResponseException;
	}
}
