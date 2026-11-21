package com.inmocheck.inmuebles;

import com.inmocheck.comun.datos.EjecutorRls;
import com.inmocheck.comun.datos.ErroresSql;
import com.inmocheck.comun.errores.ConflictoException;
import com.inmocheck.comun.errores.DatosInvalidosException;
import com.inmocheck.comun.errores.NoEncontradoException;
import com.inmocheck.comun.http.ErrorDeCampo;
import com.inmocheck.comun.http.Pagina;
import com.inmocheck.comun.http.ParametrosPagina;
import com.inmocheck.inspecciones.InspeccionResumen;
import com.inmocheck.comun.sesion.Actor;
import jakarta.validation.Validator;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Supplier;
import org.springframework.stereotype.Service;

// Reglas de negocio de los inmuebles (equivale a inmuebles.service.ts).
// La organización sale SIEMPRE del Actor. RLS decide qué ve cada rol.
@Service
public class InmueblesService {

	private final EjecutorRls ejecutor;
	private final InmueblesRepository repositorio;
	private final Validator validador;

	public InmueblesService(EjecutorRls ejecutor, InmueblesRepository repositorio, Validator validador) {
		this.ejecutor = ejecutor;
		this.repositorio = repositorio;
		this.validador = validador;
	}

	public Pagina<InmuebleRespuesta> listar(Actor actor, FiltroInmuebles filtro, ParametrosPagina pagina) {
		return ejecutor.ejecutar(actor.token(), jdbc -> Pagina.de(
				repositorio.listar(jdbc, filtro, pagina),
				repositorio.contar(jdbc, filtro),
				pagina));
	}

	// Si es de otra organización (o el inspector no tiene inspecciones ahí),
	// RLS lo oculta y llega vacío: 404 en ambos casos.
	public InmuebleRespuesta obtener(Actor actor, UUID id) {
		return ejecutor.ejecutar(actor.token(), jdbc -> repositorio.buscar(jdbc, id))
				.orElseThrow(NoEncontradoException::new);
	}

	public List<InspeccionResumen> historial(Actor actor, UUID id) {
		return ejecutor.ejecutar(actor.token(), jdbc -> {
			repositorio.buscar(jdbc, id).orElseThrow(NoEncontradoException::new);
			return repositorio.historial(jdbc, id);
		});
	}

	public InmuebleRespuesta crear(Actor actor, CrearInmueble datos) {
		return traducirErroresDeGuardado(() -> ejecutor.ejecutar(actor.token(), jdbc -> {
			UUID id = repositorio.insertar(jdbc, actor.organizacion().id(), datos);
			return repositorio.buscar(jdbc, id).orElseThrow();
		}));
	}

	public InmuebleRespuesta editar(Actor actor, UUID id, EditarInmueble datos) {
		Map<String, Object> cambios = validarYArmarCambios(datos);
		return traducirErroresDeGuardado(() -> ejecutor.ejecutar(actor.token(), jdbc -> {
			// "Eliminar" es desactivar, y no se permite si hay visitas por hacer:
			// quedarían inspecciones abiertas sobre un inmueble inactivo.
			if (datos.desactiva() && repositorio.contarInspeccionesAbiertas(jdbc, id) > 0) {
				throw new ConflictoException(
						"El inmueble tiene inspecciones pendientes o en proceso. Cancélalas o espera a que finalicen.",
						"INMUEBLE_CON_INSPECCIONES_ABIERTAS");
			}
			if (!cambios.isEmpty() && repositorio.actualizar(jdbc, id, cambios).isEmpty()) {
				throw new NoEncontradoException();
			}
			return repositorio.buscar(jdbc, id).orElseThrow(NoEncontradoException::new);
		}));
	}

	// DELETE: el inmueble y todo su historial se conservan (CA-13, RN-09).
	public void desactivar(Actor actor, UUID id) {
		editar(actor, id, EditarInmueble.desactivar());
	}

	// ---------- Ayudas ----------

	// La base garantiza las reglas (UNIQUE, llave foránea compuesta con la
	// organización); aquí solo se traduce su error a uno que el front muestre.
	private static <T> T traducirErroresDeGuardado(Supplier<T> guardar) {
		try {
			return guardar.get();
		} catch (RuntimeException error) {
			if (ErroresSql.esViolacionUnica(error)) {
				throw new ConflictoException("Ya existe un inmueble con ese código en tu inmobiliaria.",
						"CODIGO_INMUEBLE_DUPLICADO");
			}
			// Incluye un propietario de OTRA inmobiliaria: la llave foránea es
			// (propietario_id, organizacion_id), así que tampoco "existe" aquí.
			if (ErroresSql.esLlaveForaneaInvalida(error)) {
				throw new ConflictoException("El propietario seleccionado no existe.", "PROPIETARIO_INVALIDO");
			}
			throw error;
		}
	}

	// En un PATCH solo se validan los campos que llegaron, con las MISMAS reglas
	// de CrearInmueble. Devuelve los cambios por nombre de campo del JSON.
	private Map<String, Object> validarYArmarCambios(EditarInmueble datos) {
		Map<String, Optional<?>> llegaron = new LinkedHashMap<>();
		llegaron.put("codigo", datos.codigo());
		llegaron.put("tipo", datos.tipo());
		llegaron.put("direccion", datos.direccion());
		llegaron.put("barrio", datos.barrio());
		llegaron.put("ciudad", datos.ciudad());
		llegaron.put("departamento", datos.departamento());
		llegaron.put("habitaciones", datos.habitaciones());
		llegaron.put("banos", datos.banos());
		llegaron.put("areaM2", datos.areaM2());
		llegaron.put("propietarioId", datos.propietarioId());
		llegaron.put("descripcion", datos.descripcion());

		List<ErrorDeCampo> errores = new ArrayList<>();
		Map<String, Object> cambios = new LinkedHashMap<>();
		llegaron.forEach((campo, valor) -> {
			if (valor == null) {
				return;
			}
			Object nuevo = valor.orElse(null);
			validador.validateValue(CrearInmueble.class, campo, nuevo)
					.forEach(violacion -> errores.add(new ErrorDeCampo(campo, violacion.getMessage())));
			cambios.put(campo, nuevo instanceof TipoInmueble tipo ? tipo.name() : nuevo);
		});

		if (datos.activo() != null) {
			if (datos.activo().isEmpty()) {
				errores.add(new ErrorDeCampo("activo", "Debe ser verdadero o falso."));
			} else {
				cambios.put("activo", datos.activo().get());
			}
		}
		if (!errores.isEmpty()) {
			throw new DatosInvalidosException(errores);
		}
		return cambios;
	}
}
