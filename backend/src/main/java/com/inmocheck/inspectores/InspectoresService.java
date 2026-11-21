package com.inmocheck.inspectores;

import com.inmocheck.comun.datos.EjecutorRls;
import com.inmocheck.comun.errores.ConflictoException;
import com.inmocheck.comun.errores.DatosInvalidosException;
import com.inmocheck.comun.errores.NoEncontradoException;
import com.inmocheck.comun.errores.ServicioNoDisponibleException;
import com.inmocheck.comun.http.CuerpoParcial;
import com.inmocheck.comun.http.ErrorDeCampo;
import com.inmocheck.comun.http.Pagina;
import com.inmocheck.comun.http.ParametrosPagina;
import com.inmocheck.comun.sesion.Actor;
import com.inmocheck.config.PropiedadesFront;
import com.inmocheck.inspectores.InspectoresDtos.InspectorInvitado;
import com.inmocheck.inspectores.InspectoresDtos.InspectorRespuesta;
import com.inmocheck.inspectores.InspectoresDtos.InvitarInspector;
import com.inmocheck.supabase.ClienteSupabaseAdmin;
import jakarta.validation.Validator;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

// Reglas de los inspectores (equivale a inspectores.service.ts).
@Service
public class InspectoresService {

	private static final Logger log = LoggerFactory.getLogger(InspectoresService.class);
	private static final Set<String> CAMPOS_EDITABLES = Set.of("nombre", "activo");

	private final EjecutorRls ejecutor;
	private final InspectoresRepository repositorio;
	private final ClienteSupabaseAdmin supabase;
	private final PropiedadesFront front;
	private final Validator validador;

	public InspectoresService(EjecutorRls ejecutor, InspectoresRepository repositorio,
			ClienteSupabaseAdmin supabase, PropiedadesFront front, Validator validador) {
		this.ejecutor = ejecutor;
		this.repositorio = repositorio;
		this.supabase = supabase;
		this.front = front;
		this.validador = validador;
	}

	public Pagina<InspectorRespuesta> listar(Actor actor, String busqueda, Boolean activo, ParametrosPagina pagina) {
		return ejecutor.ejecutar(actor.token(), jdbc -> Pagina.de(
				repositorio.listar(jdbc, busqueda, activo, pagina),
				repositorio.contar(jdbc, busqueda, activo),
				pagina));
	}

	// Invitar necesita la API de administración de Supabase (service_role):
	// crea la cuenta en auth.users y envía el correo. El rol y la organización
	// los fija el servidor: INSPECTOR, en la organización del admin que invita.
	public InspectorInvitado invitar(Actor actor, InvitarInspector datos) {
		UUID usuarioId;
		try {
			usuarioId = supabase.invitar(datos.email(), datos.nombre(), front.urlEnlaceCorreo());
		} catch (RuntimeException error) {
			if (error instanceof ServicioNoDisponibleException || !ClienteSupabaseAdmin.esRechazo(error)) {
				throw error;
			}
			throw new ConflictoException(
					"No se pudo enviar la invitación. Es posible que ese correo ya tenga una cuenta.",
					"INVITACION_FALLIDA");
		}

		try {
			supabase.insertar("perfiles", Map.of(
					"id", usuarioId,
					"organizacion_id", actor.organizacion().id(),
					"nombre", datos.nombre(),
					"email", datos.email(),
					"rol", "INSPECTOR"));
		} catch (RuntimeException error) {
			// Compensación: sin perfil la cuenta quedaría huérfana, así que se elimina.
			supabase.borrarUsuario(usuarioId);
			throw error;
		}

		auditar(actor, usuarioId, "INVITADO");
		return new InspectorInvitado(usuarioId, datos.nombre(), datos.email(), true);
	}

	// Si la invitación venció, se perdió o cayó en correo no deseado, el admin
	// puede enviar un enlace nuevo para crear la contraseña.
	public void reenviarAcceso(Actor actor, UUID id) {
		// Se busca bajo RLS con la sesión del admin: garantiza que sea de su organización.
		InspectorRespuesta inspector = ejecutor.ejecutar(actor.token(), jdbc -> repositorio.buscar(jdbc, id))
				.orElseThrow(NoEncontradoException::new);
		if (!inspector.activo()) {
			throw new ConflictoException("La cuenta está desactivada. Reactívala antes de enviar el enlace.",
					"CUENTA_INACTIVA");
		}

		try {
			supabase.enviarEnlaceDeContrasena(inspector.email(), front.urlEnlaceCorreo());
		} catch (RuntimeException error) {
			if (error instanceof ServicioNoDisponibleException || !ClienteSupabaseAdmin.esRechazo(error)) {
				throw error;
			}
			// Supabase limita cuántos correos se envían por hora.
			throw new ServicioNoDisponibleException(
					"No se pudo enviar el correo. Espera unos minutos e intenta de nuevo.", "CORREO_NO_ENVIADO");
		}

		auditar(actor, inspector.id(), "ACCESO_REENVIADO");
	}

	public InspectorRespuesta editar(Actor actor, UUID id, JsonNode cuerpo) {
		Map<String, Object> cambios = leerCambios(cuerpo);
		return ejecutor.ejecutar(actor.token(), jdbc -> {
			// No se desactiva a alguien con visitas por hacer: quedarían sin responsable.
			if (Boolean.FALSE.equals(cambios.get("activo"))) {
				int abiertas = repositorio.buscar(jdbc, id).map(InspectorRespuesta::inspeccionesAbiertas).orElse(0);
				if (abiertas > 0) {
					throw new ConflictoException(
							"El inspector tiene inspecciones abiertas. Reasígnalas antes de desactivar la cuenta.",
							"INSPECTOR_CON_INSPECCIONES_ABIERTAS");
				}
			}
			if (!cambios.isEmpty() && repositorio.actualizar(jdbc, id, cambios).isEmpty()) {
				throw new NoEncontradoException();
			}
			return repositorio.buscar(jdbc, id).orElseThrow(NoEncontradoException::new);
		});
	}

	// ---------- Ayudas ----------

	// La auditoría no se puede escribir con la sesión del usuario (no hay
	// política de inserción): va con service_role. Si falla, la operación ya
	// ocurrió; se registra en el log en vez de deshacerla (como el BFF).
	private void auditar(Actor actor, UUID inspectorId, String accion) {
		try {
			supabase.insertar("auditoria", Map.of(
					"organizacion_id", actor.organizacion().id(),
					"actor_id", actor.id(),
					"recurso", "INSPECTOR",
					"recurso_id", inspectorId,
					"accion", accion));
		} catch (RuntimeException error) {
			log.error("No se pudo registrar la auditoría {} del inspector {}", accion, inspectorId, error);
		}
	}

	// PATCH (inspectorEditarSchema): nombre y activo, sin null.
	private Map<String, Object> leerCambios(JsonNode cuerpo) {
		CuerpoParcial parcial = CuerpoParcial.de(cuerpo, CAMPOS_EDITABLES);
		Optional<String> nombre = parcial.texto("nombre");
		Optional<Boolean> activo = parcial.booleano("activo");
		parcial.exigirSinErrores();

		List<ErrorDeCampo> errores = new ArrayList<>();
		Map<String, Object> cambios = new LinkedHashMap<>();
		if (nombre != null) {
			validador.validateValue(InvitarInspector.class, "nombre", nombre.orElse(null))
					.forEach(violacion -> errores.add(new ErrorDeCampo("nombre", violacion.getMessage())));
			cambios.put("nombre", nombre.orElse(null));
		}
		if (activo != null) {
			if (activo.isEmpty()) {
				errores.add(new ErrorDeCampo("activo", "Debe ser verdadero o falso."));
			}
			cambios.put("activo", activo.orElse(null));
		}
		if (!errores.isEmpty()) {
			throw new DatosInvalidosException(errores);
		}
		return cambios;
	}
}
