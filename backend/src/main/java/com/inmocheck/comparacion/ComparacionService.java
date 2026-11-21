package com.inmocheck.comparacion;

import com.inmocheck.comparacion.Comparador.Comparacion;
import com.inmocheck.comparacion.Comparador.ElementoComparado;
import com.inmocheck.comparacion.Comparador.Resumen;
import com.inmocheck.comun.datos.EjecutorRls;
import com.inmocheck.comun.errores.ConflictoException;
import com.inmocheck.comun.errores.NoEncontradoException;
import com.inmocheck.comun.sesion.Actor;
import com.inmocheck.inspecciones.InspeccionesDtos.EstadoInspeccion;
import com.inmocheck.inspecciones.InspeccionesDtos.InspeccionRespuesta;
import com.inmocheck.inspecciones.InspeccionesDtos.TipoInspeccion;
import com.inmocheck.inspecciones.InspeccionesRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

// Comparación entrada/salida (equivale a comparacion.service.ts).
// Se calcula al momento con la copia (snapshot) de cada inspección: no se
// guarda en ninguna tabla. Si alguna de las dos no es visible para el
// usuario (RLS), se responde 404 antes de comparar.
@Service
public class ComparacionService {

	private final EjecutorRls ejecutor;
	private final InspeccionesRepository inspecciones;

	public ComparacionService(EjecutorRls ejecutor, InspeccionesRepository inspecciones) {
		this.ejecutor = ejecutor;
		this.inspecciones = inspecciones;
	}

	// Respuesta: { entradaId, salidaId, resumen, elementos }.
	public record Resultado(UUID entradaId, UUID salidaId, Resumen resumen, List<ElementoComparado> elementos) {
	}

	public Resultado comparar(Actor actor, UUID salidaId, UUID entradaId) {
		return ejecutor.ejecutar(actor.token(), jdbc -> {
			InspeccionRespuesta salida = buscar(jdbc, salidaId);
			InspeccionRespuesta entrada = buscar(jdbc, entradaId);
			exigirComparables(salida, entrada);
			Comparacion comparacion = Comparador.comparar(
					inspecciones.listarDetalles(jdbc, entradaId), inspecciones.listarDetalles(jdbc, salidaId));
			return new Resultado(entradaId, salidaId, comparacion.resumen(), comparacion.elementos());
		});
	}

	// La salida solo se compara con una entrada anterior del mismo inmueble (RN-06).
	private static void exigirComparables(InspeccionRespuesta salida, InspeccionRespuesta entrada) {
		if (!salida.inmueble().id().equals(entrada.inmueble().id())) {
			throw invalida("Solo se pueden comparar inspecciones del mismo inmueble.");
		}
		if (salida.tipo() != TipoInspeccion.SALIDA || entrada.tipo() != TipoInspeccion.ENTRADA) {
			throw invalida("La comparación es entre una inspección de salida y una de entrada.");
		}
		if (salida.estado() != EstadoInspeccion.FINALIZADA || entrada.estado() != EstadoInspeccion.FINALIZADA) {
			throw invalida("Las dos inspecciones deben estar finalizadas.");
		}
		if (!entrada.finalizadaEn().isBefore(salida.finalizadaEn())) {
			throw invalida("La entrada debe ser anterior a la salida.");
		}
	}

	private InspeccionRespuesta buscar(JdbcClient jdbc, UUID id) {
		return inspecciones.buscar(jdbc, id).orElseThrow(NoEncontradoException::new);
	}

	private static ConflictoException invalida(String detalle) {
		return new ConflictoException(detalle, "COMPARACION_INVALIDA");
	}
}
