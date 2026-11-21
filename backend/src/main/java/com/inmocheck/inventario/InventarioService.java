package com.inmocheck.inventario;

import com.inmocheck.comun.datos.EjecutorRls;
import com.inmocheck.comun.errores.NoEncontradoException;
import com.inmocheck.comun.sesion.Actor;
import com.inmocheck.inmuebles.InmueblesRepository;
import com.inmocheck.inventario.InventarioDtos.CrearElemento;
import com.inmocheck.inventario.InventarioDtos.CrearEspacio;
import com.inmocheck.inventario.InventarioDtos.ElementoRespuesta;
import com.inmocheck.inventario.InventarioDtos.EspacioRespuesta;
import jakarta.validation.Validator;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

// Reglas del inventario (equivale a inventario.service.ts).
// Regla clave: editarlo solo afecta inspecciones FUTURAS. Las ya creadas
// guardan su propia copia (snapshot) en detalles_inspeccion, por eso aquí
// nunca se toca esa tabla, y nada se borra: se desactiva.
@Service
public class InventarioService {

	private final EjecutorRls ejecutor;
	private final InventarioRepository repositorio;
	private final InmueblesRepository inmuebles;
	private final Validator validador;

	public InventarioService(EjecutorRls ejecutor, InventarioRepository repositorio,
			InmueblesRepository inmuebles, Validator validador) {
		this.ejecutor = ejecutor;
		this.repositorio = repositorio;
		this.inmuebles = inmuebles;
		this.validador = validador;
	}

	// Si el inmueble no es visible (otra organización o inspector no
	// asignado), RLS lo oculta y se responde 404.
	public List<EspacioRespuesta> listarEspacios(Actor actor, UUID inmuebleId) {
		return ejecutor.ejecutar(actor.token(), jdbc -> {
			inmuebles.buscar(jdbc, inmuebleId).orElseThrow(NoEncontradoException::new);
			return repositorio.listarEspacios(jdbc, inmuebleId);
		});
	}

	public EspacioRespuesta crearEspacio(Actor actor, UUID inmuebleId, CrearEspacio datos) {
		return ejecutor.ejecutar(actor.token(), jdbc -> {
			inmuebles.buscar(jdbc, inmuebleId).orElseThrow(NoEncontradoException::new);
			int orden = datos.orden() != null ? datos.orden() : repositorio.siguienteOrdenEspacio(jdbc, inmuebleId);
			UUID id = repositorio.insertarEspacio(jdbc, actor.organizacion().id(), inmuebleId, datos, orden);
			return repositorio.buscarEspacio(jdbc, id).orElseThrow();
		});
	}

	public EspacioRespuesta editarEspacio(Actor actor, UUID id, JsonNode cuerpo) {
		var cambios = CambiosDeInventario.deEspacio(cuerpo, validador);
		return ejecutor.ejecutar(actor.token(), jdbc -> {
			repositorio.actualizarEspacio(jdbc, id, cambios).orElseThrow(NoEncontradoException::new);
			return repositorio.buscarEspacio(jdbc, id).orElseThrow(NoEncontradoException::new);
		});
	}

	// El espacio debe existir y ser de MI organización. RLS ya filtra la
	// lectura; además la llave foránea compuesta (espacio_id, organizacion_id)
	// impide colgar un elemento de un espacio ajeno.
	public ElementoRespuesta crearElemento(Actor actor, UUID espacioId, CrearElemento datos) {
		return ejecutor.ejecutar(actor.token(), jdbc -> {
			UUID organizacion = repositorio.organizacionDelEspacio(jdbc, espacioId)
					.filter(actor.organizacion().id()::equals)
					.orElseThrow(NoEncontradoException::new);
			int orden = datos.orden() != null ? datos.orden() : repositorio.siguienteOrdenElemento(jdbc, espacioId);
			return repositorio.insertarElemento(jdbc, organizacion, espacioId, datos, orden);
		});
	}

	public ElementoRespuesta editarElemento(Actor actor, UUID id, JsonNode cuerpo) {
		var cambios = CambiosDeInventario.deElemento(cuerpo, validador);
		return ejecutor.ejecutar(actor.token(), jdbc -> repositorio.actualizarElemento(jdbc, id, cambios))
				.orElseThrow(NoEncontradoException::new);
	}
}
