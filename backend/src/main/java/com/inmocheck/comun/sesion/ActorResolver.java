package com.inmocheck.comun.sesion;

import com.inmocheck.comun.datos.EjecutorRls;
import com.inmocheck.comun.errores.NoAutenticadoException;
import com.inmocheck.comun.errores.SinPermisoException;
import com.inmocheck.comun.sesion.PerfilesRepository.PerfilEncontrado;
import java.util.UUID;
import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

// Cuando un controller pide un parámetro Actor, Spring llama a esta clase:
// toma el token ya validado por SeguridadConfig, busca el perfil bajo RLS y
//   - sin perfil              → 401 UNAUTHENTICATED
//   - cuenta desactivada      → 403 CUENTA_INACTIVA (aunque el token siga vigente)
//   - todo bien               → Actor con rol y organización de la base
// Equivale a requireActor() de server/auth/sesion.ts.
@Component
public class ActorResolver implements HandlerMethodArgumentResolver {

	private final EjecutorRls ejecutor;
	private final PerfilesRepository perfiles;

	public ActorResolver(EjecutorRls ejecutor, PerfilesRepository perfiles) {
		this.ejecutor = ejecutor;
		this.perfiles = perfiles;
	}

	@Override
	public boolean supportsParameter(MethodParameter parametro) {
		return Actor.class.equals(parametro.getParameterType());
	}

	@Override
	public Actor resolveArgument(
			MethodParameter parametro,
			ModelAndViewContainer modelo,
			NativeWebRequest peticion,
			WebDataBinderFactory fabricaDeBinders) {
		Authentication autenticacion = SecurityContextHolder.getContext().getAuthentication();
		if (!(autenticacion instanceof JwtAuthenticationToken sesion)) {
			throw new NoAutenticadoException();
		}

		UUID usuarioId = UUID.fromString(sesion.getToken().getSubject());
		PerfilEncontrado perfil = ejecutor
				.ejecutar(sesion.getToken(), jdbc -> perfiles.buscar(jdbc, usuarioId))
				.orElseThrow(NoAutenticadoException::new);

		if (!perfil.activo()) {
			throw SinPermisoException.cuentaInactiva();
		}

		return new Actor(
				perfil.id(),
				perfil.nombre(),
				perfil.email(),
				perfil.rol(),
				new Actor.Organizacion(perfil.organizacionId(), perfil.organizacionNombre()),
				sesion.getToken());
	}
}
