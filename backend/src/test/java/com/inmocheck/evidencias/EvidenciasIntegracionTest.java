package com.inmocheck.evidencias;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.inmocheck.supabase.ClienteSupabaseAdmin;
import com.jayway.jsonpath.JsonPath;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

// Fotos contra la base REAL (funciones registrar_evidencia y eliminar_evidencia),
// en transacciones que se deshacen. Storage se SIMULA: no se sube ningún archivo.
// Cuando una función SQL falla la transacción queda anulada: la petición que
// debe fallar va de última en cada prueba.
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@EnabledIf("com.inmocheck.BaseDePrueba#hayBaseConfigurada")
class EvidenciasIntegracionTest {

	private static final String RUTA = "/api/v1/inspecciones";
	private static final String ADMIN_PINOS = "a1000000-0000-4000-8000-000000000001";
	private static final String ORG_PINOS = "a0000000-0000-4000-8000-000000000001";
	private static final String LAURA = "a1000000-0000-4000-8000-000000000002";
	private static final String CARLOS = "a1000000-0000-4000-8000-000000000003";
	private static final String APT_302_PINOS = "a3000000-0000-4000-8000-000000000001";
	private static final byte[] JPG = { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 1, 2, 3, 4 };

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private ClienteSupabaseAdmin supabase;

	// ---------- Subir ----------

	@Test
	void subeLaFotoAlBucketPrivadoYQuedaEnElElemento() throws Exception {
		Elemento elemento = elementoDeInspeccionIniciada();

		como(LAURA, multipart(fotosDe(elemento)).file(foto(JPG)).param("descripcion", "  Mancha en la pared  "))
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", startsWith("/api/v1/evidencias/")))
				.andExpect(jsonPath("$.data.mimeType").value("image/jpeg"))
				.andExpect(jsonPath("$.data.sizeBytes").value(JPG.length))
				.andExpect(jsonPath("$.data.descripcion").value("Mancha en la pared"));

		// La ruta la arma el servidor, dentro de la carpeta de SU organización.
		verify(supabase).subirArchivo(eq("evidencias"),
				org.mockito.ArgumentMatchers.startsWith("org/" + ORG_PINOS + "/inspecciones/" + elemento.inspeccion() + "/detalles/" + elemento.detalle() + "/"),
				any(), eq("image/jpeg"));
		como(LAURA, get(RUTA + "/" + elemento.inspeccion() + "/detalles"))
				.andExpect(jsonPath("$.data[?(@.id=='" + elemento.detalle() + "')].evidencias[0].mimeType").value("image/jpeg"));
	}

	@Test
	void unArchivoQueNoEsFotoEs415SinSubirNada() throws Exception {
		Elemento elemento = elementoDeInspeccionIniciada();
		como(LAURA, multipart(fotosDe(elemento)).file(foto("no soy una foto".getBytes())))
				.andExpect(status().isUnsupportedMediaType())
				.andExpect(jsonPath("$.code").value("UNSUPPORTED_MEDIA_TYPE"));
		verify(supabase, never()).subirArchivo(any(), any(), any(), any());
	}

	@Test
	void unArchivoDeMasDe10MbEs413() throws Exception {
		Elemento elemento = elementoDeInspeccionIniciada();
		byte[] enorme = new byte[11 * 1024 * 1024];
		System.arraycopy(JPG, 0, enorme, 0, JPG.length);
		como(LAURA, multipart(fotosDe(elemento)).file(foto(enorme)))
				.andExpect(status().isContentTooLarge())
				.andExpect(jsonPath("$.code").value("FILE_TOO_LARGE"));
		verify(supabase, never()).subirArchivo(any(), any(), any(), any());
	}

	@Test
	void unArchivoVacioOSinCampoEs400() throws Exception {
		Elemento elemento = elementoDeInspeccionIniciada();
		como(LAURA, multipart(fotosDe(elemento)).file(foto(new byte[0]))).andExpect(status().isBadRequest());
		como(LAURA, multipart(fotosDe(elemento)).param("descripcion", "sin archivo"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.detail").value("Falta el campo archivo."));
	}

	@Test
	void otroInspectorRecibe404YElAdmin403() throws Exception {
		Elemento elemento = elementoDeInspeccionIniciada();
		como(CARLOS, multipart(fotosDe(elemento)).file(foto(JPG))).andExpect(status().isNotFound());
		como(ADMIN_PINOS, multipart(fotosDe(elemento)).file(foto(JPG))).andExpect(status().isForbidden());
		verify(supabase, never()).subirArchivo(any(), any(), any(), any());
	}

	@Test
	void sinIniciarSeRechazaYSeBorraElArchivoSubido() throws Exception {
		String inspeccion = programar();
		Elemento elemento = new Elemento(inspeccion, primerDetalle(inspeccion));

		como(LAURA, multipart(fotosDe(elemento)).file(foto(JPG)))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("INSPECCION_NO_INICIADA"));
		// Compensación: Storage y la base no comparten transacción.
		verify(supabase).borrarArchivo(eq("evidencias"), anyString());
	}

	@Test
	void laNovenaFotoDeUnElementoSeRechaza() throws Exception {
		Elemento elemento = elementoDeInspeccionIniciada();
		for (int i = 0; i < 8; i++) {
			como(LAURA, multipart(fotosDe(elemento)).file(foto(JPG))).andExpect(status().isCreated());
		}
		como(LAURA, multipart(fotosDe(elemento)).file(foto(JPG)))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("LIMITE_FOTOS"))
				.andExpect(jsonPath("$.detail").value("Cada elemento admite máximo 8 fotos."));
		verify(supabase).borrarArchivo(eq("evidencias"), anyString());
	}

	// ---------- Enlace firmado ----------

	@Test
	void entregaUnEnlaceFirmadoDe60SegundosOLoRedirige() throws Exception {
		Elemento elemento = elementoDeInspeccionIniciada();
		String evidencia = subir(elemento);
		when(supabase.firmarEnlace(eq("evidencias"), anyString(), anyInt())).thenReturn("https://storage.prueba/firmado?token=1");

		como(LAURA, get("/api/v1/evidencias/" + evidencia + "/acceso"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.url").value("https://storage.prueba/firmado?token=1"))
				.andExpect(jsonPath("$.data.expiresIn").value(60));
		como(ADMIN_PINOS, get("/api/v1/evidencias/" + evidencia + "/acceso").param("redirigir", "1"))
				.andExpect(status().isFound())
				.andExpect(header().string("Location", "https://storage.prueba/firmado?token=1"))
				.andExpect(header().string("Cache-Control", containsString("no-store")));
		// Una vez por cada petición: el enlace nunca se reutiliza.
		verify(supabase, org.mockito.Mockito.times(2)).firmarEnlace("evidencias", rutaDe(evidencia, elemento), 60);
	}

	@Test
	void otroInspectorNoObtieneElEnlace() throws Exception {
		Elemento elemento = elementoDeInspeccionIniciada();
		String evidencia = subir(elemento);
		como(CARLOS, get("/api/v1/evidencias/" + evidencia + "/acceso")).andExpect(status().isNotFound());
		verify(supabase, never()).firmarEnlace(any(), any(), anyInt());
	}

	// ---------- Retirar ----------

	@Test
	void retiraLaFotoYBorraElArchivo() throws Exception {
		Elemento elemento = elementoDeInspeccionIniciada();
		String evidencia = subir(elemento);

		como(LAURA, delete("/api/v1/evidencias/" + evidencia)).andExpect(status().isNoContent());

		verify(supabase).borrarArchivo("evidencias", rutaDe(evidencia, elemento));
		como(LAURA, get(RUTA + "/" + elemento.inspeccion() + "/detalles"))
				.andExpect(jsonPath("$.data[?(@.id=='" + elemento.detalle() + "')].evidencias.length()").value(0));
	}

	@Test
	void elAdminNoRetiraFotosYOtroInspectorTampoco() throws Exception {
		Elemento elemento = elementoDeInspeccionIniciada();
		String evidencia = subir(elemento);
		como(ADMIN_PINOS, delete("/api/v1/evidencias/" + evidencia)).andExpect(status().isForbidden());
		como(CARLOS, delete("/api/v1/evidencias/" + evidencia)).andExpect(status().isNotFound());
	}

	// ---------- Ayudas ----------

	private record Elemento(String inspeccion, String detalle) {
	}

	private static String fotosDe(Elemento elemento) {
		return RUTA + "/" + elemento.inspeccion() + "/detalles/" + elemento.detalle() + "/evidencias";
	}

	private static String rutaDe(String evidencia, Elemento elemento) {
		return "org/%s/inspecciones/%s/detalles/%s/%s.jpg"
				.formatted(ORG_PINOS, elemento.inspeccion(), elemento.detalle(), evidencia);
	}

	private static MockMultipartFile foto(byte[] contenido) {
		return new MockMultipartFile("archivo", "foto.jpg", MediaType.IMAGE_JPEG_VALUE, contenido);
	}

	private String subir(Elemento elemento) throws Exception {
		String cuerpo = como(LAURA, multipart(fotosDe(elemento)).file(foto(JPG)))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		return JsonPath.read(cuerpo, "$.data.id");
	}

	private String programar() throws Exception {
		String cuerpo = como(ADMIN_PINOS, post(RUTA).contentType(MediaType.APPLICATION_JSON).content("""
						{"inmuebleId":"%s","inspectorId":"%s","tipo":"SALIDA","programadaPara":"%s"}"""
						.formatted(APT_302_PINOS, LAURA, OffsetDateTime.now(ZoneOffset.UTC).plusDays(1))))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		return JsonPath.read(cuerpo, "$.data.id");
	}

	private String primerDetalle(String inspeccion) throws Exception {
		String cuerpo = como(LAURA, get(RUTA + "/" + inspeccion + "/detalles"))
				.andReturn().getResponse().getContentAsString();
		return JsonPath.read(cuerpo, "$.data[0].id");
	}

	private Elemento elementoDeInspeccionIniciada() throws Exception {
		String inspeccion = programar();
		como(LAURA, post(RUTA + "/" + inspeccion + "/inicio").contentType(MediaType.APPLICATION_JSON).content("{\"version\":1}"))
				.andExpect(status().isOk());
		return new Elemento(inspeccion, primerDetalle(inspeccion));
	}

	// En Spring 7 el constructor multipart y el normal comparten esta clase base.
	private ResultActions como(String usuario, AbstractMockHttpServletRequestBuilder<?> peticion) throws Exception {
		return mockMvc.perform(peticion.with(jwt().jwt(token -> token
				.subject(usuario)
				.claim("role", "authenticated"))));
	}
}
