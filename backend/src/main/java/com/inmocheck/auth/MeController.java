package com.inmocheck.auth;

import com.inmocheck.comun.http.Datos;
import com.inmocheck.comun.sesion.Actor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

// GET /api/v1/auth/me: perfil, rol y organización de quien inició sesión.
// Lo pueden pedir el administrador y el inspector (docs/contratos/api.md).
// Sin token: 401. Cuenta desactivada: 403 CUENTA_INACTIVA (ActorResolver).
@RestController
public class MeController {

	@GetMapping("/api/v1/auth/me")
	Datos<PerfilActual> me(Actor actor) {
		return Datos.de(PerfilActual.de(actor));
	}
}
