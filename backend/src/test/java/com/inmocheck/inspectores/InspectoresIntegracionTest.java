package com.inmocheck.inspectores;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.inmocheck.supabase.ClienteSupabaseAdmin;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;

// /api/v1/inspectores contra la base REAL (datos de seed.sql), en
// transacciones que se deshacen. Supabase Auth Admin se SIMULA: estas pruebas
// nunca crean cuentas ni envían correos de verdad.
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@EnabledIf("com.inmocheck.BaseDePrueba#hayBaseConfigurada")
class InspectoresIntegracionTest {

	private static final String RUTA = "/api/v1/inspectores";
	private static final String ADMIN_PINOS = "a1000000-0000-4000-8000-000000000001";
	private static final String ORG_PINOS = "a0000000-0000-4000-8000-000000000001";
	private static final String LAURA = "a1000000-0000-4000-8000-000000000002";
	private static final String CARLOS = "a1000000-0000-4000-8000-000000000003";
	private static final String SOFIA_ANDES = "b1000000-0000-4000-8000-000000000002";
	private static final String CASA_014_PINOS = "a3000000-0000-4000-8000-000000000002";
	private static final String ENLACE = "http://localhost:3000/auth/enlace?siguiente=/auth/actualizar-contrasena";

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private JdbcClient jdbcSinRls;

	@MockitoBean
	private ClienteSupabaseAdmin supabase;

	// ---------- Listar ----------

	@Test
	void elAdminVeSoloLosInspectoresDeSuInmobiliaria() throws Exception {
		como(ADMIN_PINOS, get(RUTA).param("pageSize", "100"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data[*].id").value(hasItems(LAURA, CARLOS)))
				.andExpect(jsonPath("$.data[*].id").value(not(hasItem(SOFIA_ANDES))))
				.andExpect(jsonPath("$.data[*].id").value(not(hasItem(ADMIN_PINOS))))
				.andExpect(jsonPath("$.data[0].inspeccionesAbiertas").isNumber());
	}

	@Test
	void buscaPorNombreYFiltraPorEstado() throws Exception {
		como(ADMIN_PINOS, get(RUTA).param("search", "laura"))
				.andExpect(jsonPath("$.data[*].id").value(hasItem(LAURA)));
		como(ADMIN_PINOS, get(RUTA).param("activo", "true"))
				.andExpect(jsonPath("$.data[*].activo").value(everyItem(is(true))));
	}

	@Test
	void elInspectorNoPuedeVerLaLista() throws Exception {
		como(LAURA, get(RUTA)).andExpect(status().isForbidden());
	}

	// ---------- Editar ----------

	@Test
	void editaElNombre() throws Exception {
		como(ADMIN_PINOS, patch(RUTA + "/" + CARLOS).contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":\"  Carlos Prueba  \"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.nombre").value("Carlos Prueba"))
				.andExpect(jsonPath("$.data.email").value("carlos@pinos.test"));
	}

	@Test
	void noSeDesactivaAQuienTieneInspeccionesAbiertas() throws Exception {
		jdbcSinRls.sql("""
				insert into public.inspecciones
				  (organizacion_id, inmueble_id, inspector_id, tipo, programada_para, creada_por)
				values (:org::uuid, :inmueble::uuid, :inspector::uuid, 'SALIDA', now() + interval '1 day', :admin::uuid)
				""")
				.param("org", ORG_PINOS).param("inmueble", CASA_014_PINOS)
				.param("inspector", CARLOS).param("admin", ADMIN_PINOS)
				.update();

		como(ADMIN_PINOS, patch(RUTA + "/" + CARLOS).contentType(MediaType.APPLICATION_JSON)
						.content("{\"activo\":false}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("INSPECTOR_CON_INSPECCIONES_ABIERTAS"));
	}

	@Test
	void datosInvalidosYCamposNoPermitidosSon422() throws Exception {
		como(ADMIN_PINOS, patch(RUTA + "/" + CARLOS).contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":\"A\",\"activo\":null,\"rol\":\"ADMIN\"}"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[*].field").value(hasItems("rol")));
		como(ADMIN_PINOS, patch(RUTA + "/" + CARLOS).contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":\"A\",\"activo\":null}"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[*].field").value(hasItems("nombre", "activo")));
	}

	@Test
	void noSeEditaAUnInspectorDeOtraInmobiliariaNiAUnAdmin() throws Exception {
		como(ADMIN_PINOS, patch(RUTA + "/" + SOFIA_ANDES).contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":\"Cambiado\"}"))
				.andExpect(status().isNotFound());
		como(ADMIN_PINOS, patch(RUTA + "/" + ADMIN_PINOS).contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":\"Cambiado\"}"))
				.andExpect(status().isNotFound());
	}

	// ---------- Invitar (Supabase simulado) ----------

	@Test
	void invitarCreaLaCuentaYElPerfilEnLaOrganizacionDelAdmin() throws Exception {
		UUID nuevo = UUID.randomUUID();
		when(supabase.invitar("ana@prueba.co", "Ana Prueba", ENLACE)).thenReturn(nuevo);

		como(ADMIN_PINOS, post(RUTA + "/invitaciones").contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":\" Ana Prueba \",\"email\":\"  ANA@Prueba.co \"}"))
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", RUTA + "/" + nuevo))
				.andExpect(jsonPath("$.data.email").value("ana@prueba.co"))
				.andExpect(jsonPath("$.data.activo").value(true));

		// El rol y la organización los pone el servidor, nunca el cliente.
		verify(supabase).insertar(eq("perfiles"), argThat(fila ->
				fila.get("rol").equals("INSPECTOR")
						&& fila.get("organizacion_id").toString().equals(ORG_PINOS)
						&& fila.get("id").equals(nuevo)));
		verify(supabase).insertar(eq("auditoria"), argThat(fila -> fila.get("accion").equals("INVITADO")));
	}

	@Test
	void siSupabaseRechazaElCorreoEs409() throws Exception {
		when(supabase.invitar(any(), any(), any())).thenThrow(
				HttpClientErrorException.create(HttpStatus.UNPROCESSABLE_CONTENT, "ya existe", HttpHeaders.EMPTY, new byte[0], null));

		como(ADMIN_PINOS, post(RUTA + "/invitaciones").contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":\"Ana Prueba\",\"email\":\"ana@prueba.co\"}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("INVITACION_FALLIDA"));
	}

	@Test
	void siNoSePuedeCrearElPerfilSeBorraLaCuenta() throws Exception {
		UUID nuevo = UUID.randomUUID();
		when(supabase.invitar(any(), any(), any())).thenReturn(nuevo);
		doThrow(new IllegalStateException("fallo al insertar")).when(supabase).insertar(eq("perfiles"), anyMap());

		como(ADMIN_PINOS, post(RUTA + "/invitaciones").contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":\"Ana Prueba\",\"email\":\"ana@prueba.co\"}"))
				.andExpect(status().isInternalServerError());

		verify(supabase).borrarUsuario(nuevo);
	}

	@Test
	void invitarConDatosInvalidosEs422SinLlamarASupabase() throws Exception {
		como(ADMIN_PINOS, post(RUTA + "/invitaciones").contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":\"A\",\"email\":\"no-es-correo\"}"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.errors[*].field").value(hasItems("nombre", "email")));
		verify(supabase, never()).invitar(any(), any(), any());
	}

	@Test
	void elInspectorNoPuedeInvitar() throws Exception {
		como(LAURA, post(RUTA + "/invitaciones").contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":\"Ana Prueba\",\"email\":\"ana@prueba.co\"}"))
				.andExpect(status().isForbidden());
		verify(supabase, never()).invitar(any(), any(), any());
	}

	// ---------- Reenviar acceso (Supabase simulado) ----------

	@Test
	void reenviaElEnlaceAlCorreoDelInspector() throws Exception {
		como(ADMIN_PINOS, post(RUTA + "/" + LAURA + "/acceso").contentType(MediaType.APPLICATION_JSON).content("{}"))
				.andExpect(status().isNoContent());

		verify(supabase).enviarEnlaceDeContrasena("laura@pinos.test", ENLACE);
		verify(supabase).insertar(eq("auditoria"), argThat(fila -> fila.get("accion").equals("ACCESO_REENVIADO")));
	}

	@Test
	void noSeReenviaAUnaCuentaDesactivada() throws Exception {
		jdbcSinRls.sql("update public.perfiles set activo = false where id = :id::uuid").param("id", CARLOS).update();

		como(ADMIN_PINOS, post(RUTA + "/" + CARLOS + "/acceso").contentType(MediaType.APPLICATION_JSON).content("{}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("CUENTA_INACTIVA"));
		verify(supabase, never()).enviarEnlaceDeContrasena(any(), any());
	}

	@Test
	void noSeReenviaAUnInspectorDeOtraInmobiliaria() throws Exception {
		como(ADMIN_PINOS, post(RUTA + "/" + SOFIA_ANDES + "/acceso").contentType(MediaType.APPLICATION_JSON).content("{}"))
				.andExpect(status().isNotFound());
		verify(supabase, never()).enviarEnlaceDeContrasena(any(), any());
	}

	@Test
	void siSupabaseLimitaLosCorreosEs503() throws Exception {
		doThrow(HttpClientErrorException.create(HttpStatus.TOO_MANY_REQUESTS, "límite", HttpHeaders.EMPTY, new byte[0], null))
				.when(supabase).enviarEnlaceDeContrasena(any(), any());

		como(ADMIN_PINOS, post(RUTA + "/" + LAURA + "/acceso").contentType(MediaType.APPLICATION_JSON).content("{}"))
				.andExpect(status().isServiceUnavailable())
				.andExpect(jsonPath("$.code").value("CORREO_NO_ENVIADO"));
	}

	// ---------- Ayudas ----------

	private ResultActions como(String usuario, MockHttpServletRequestBuilder peticion) throws Exception {
		return mockMvc.perform(peticion.with(jwt().jwt(token -> token
				.subject(usuario)
				.claim("role", "authenticated"))));
	}
}
