package com.inmocheck.propietarios;

import com.inmocheck.comun.datos.EjecutorRls;
import com.inmocheck.comun.errores.DatosInvalidosException;
import com.inmocheck.comun.errores.NoEncontradoException;
import com.inmocheck.comun.http.ErrorDeCampo;
import com.inmocheck.comun.http.Pagina;
import com.inmocheck.comun.http.ParametrosPagina;
import com.inmocheck.comun.sesion.Actor;
import jakarta.validation.Validator;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

// Reglas de negocio de los propietarios (equivale a propietarios.service.ts).
// La organización sale SIEMPRE del Actor, nunca del cuerpo de la petición.
@Service
public class PropietariosService {

	private final EjecutorRls ejecutor;
	private final PropietariosRepository repositorio;
	private final Validator validador;

	public PropietariosService(EjecutorRls ejecutor, PropietariosRepository repositorio, Validator validador) {
		this.ejecutor = ejecutor;
		this.repositorio = repositorio;
		this.validador = validador;
	}

	public Pagina<PropietarioRespuesta> listar(Actor actor, FiltroPropietarios filtro, ParametrosPagina pagina) {
		return ejecutor.ejecutar(actor.token(), jdbc -> Pagina.de(
				repositorio.listar(jdbc, filtro, pagina),
				repositorio.contar(jdbc, filtro),
				pagina));
	}

	public PropietarioRespuesta obtener(Actor actor, UUID id) {
		return ejecutor.ejecutar(actor.token(), jdbc -> repositorio.buscar(jdbc, id))
				.orElseThrow(NoEncontradoException::new);
	}

	public PropietarioRespuesta crear(Actor actor, CrearPropietario datos) {
		return ejecutor.ejecutar(actor.token(), jdbc -> {
			UUID id = repositorio.insertar(jdbc, actor.organizacion().id(), datos);
			return repositorio.buscar(jdbc, id).orElseThrow();
		});
	}

	public PropietarioRespuesta editar(Actor actor, UUID id, EditarPropietario datos) {
		validar(datos);
		return ejecutor.ejecutar(actor.token(), jdbc -> {
			if (!datos.estaVacio() && repositorio.actualizar(jdbc, id, datos).isEmpty()) {
				throw new NoEncontradoException();
			}
			return repositorio.buscar(jdbc, id).orElseThrow(NoEncontradoException::new);
		});
	}

	// En un PATCH solo se validan los campos que llegaron, con las MISMAS reglas
	// de CrearPropietario (no se repiten aquí).
	private void validar(EditarPropietario datos) {
		List<ErrorDeCampo> errores = new ArrayList<>();
		revisar("nombre", datos.nombre(), errores);
		revisar("email", datos.email(), errores);
		revisar("telefono", datos.telefono(), errores);
		if (!errores.isEmpty()) {
			throw new DatosInvalidosException(errores);
		}
	}

	private void revisar(String campo, Optional<String> valor, List<ErrorDeCampo> errores) {
		if (valor == null) {
			return;
		}
		validador.validateValue(CrearPropietario.class, campo, valor.orElse(null))
				.forEach(violacion -> errores.add(new ErrorDeCampo(campo, violacion.getMessage())));
	}
}
