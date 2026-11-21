package com.inmocheck.comparacion;

import static org.assertj.core.api.Assertions.assertThat;

import com.inmocheck.comparacion.Comparador.Comparacion;
import com.inmocheck.comparacion.Comparador.Resultado;
import com.inmocheck.comparacion.Comparador.Resumen;
import com.inmocheck.inspecciones.InspeccionesDtos.DetalleRespuesta;
import com.inmocheck.inspecciones.InspeccionesDtos.EstadoElemento;
import com.inmocheck.inspecciones.InspeccionesDtos.Evidencia;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

// Los MISMOS casos que tests/unit/comparacion.test.ts: la regla en Java debe
// decir exactamente lo mismo que la del front.
class ComparadorTest {

	@Test
	void marcaSinCambioCuandoElEstadoEsIgual() {
		Comparacion resultado = Comparador.comparar(List.of(detalle("a")), List.of(detalle("a")));

		assertThat(resultado.elementos().get(0).resultado()).isEqualTo(Resultado.SIN_CAMBIO);
		assertThat(resultado.resumen()).isEqualTo(new Resumen(1, 0, 0));
	}

	@Test
	void marcaCambioCuandoElEstadoEsDistinto() {
		Comparacion resultado = Comparador.comparar(
				List.of(detalle("a", EstadoElemento.BUENO, null)),
				List.of(detalle("a", EstadoElemento.DANADO, "Roto")));

		var elemento = resultado.elementos().get(0);
		assertThat(elemento.resultado()).isEqualTo(Resultado.CAMBIO);
		assertThat(elemento.entrada().estado()).isEqualTo(EstadoElemento.BUENO);
		assertThat(elemento.salida().estado()).isEqualTo(EstadoElemento.DANADO);
		assertThat(elemento.salida().observacion()).isEqualTo("Roto");
		assertThat(resultado.resumen().cambios()).isEqualTo(1);
	}

	@Test
	void unaObservacionDistintaConElMismoEstadoNoEsCambio() {
		Comparacion resultado = Comparador.comparar(
				List.of(detalle("a", EstadoElemento.BUENO, null)),
				List.of(detalle("a", EstadoElemento.BUENO, "Sigue igual")));

		assertThat(resultado.elementos().get(0).resultado()).isEqualTo(Resultado.SIN_CAMBIO);
	}

	@Test
	void unElementoQueSoloEstaEnLaSalidaNoEsComparable() {
		Comparacion resultado = Comparador.comparar(List.of(), List.of(detalle("nuevo")));

		assertThat(resultado.elementos().get(0).resultado()).isEqualTo(Resultado.NO_COMPARABLE);
		assertThat(resultado.elementos().get(0).entrada()).isNull();
		assertThat(resultado.resumen()).isEqualTo(new Resumen(0, 0, 1));
	}

	@Test
	void unElementoQueSoloEstaEnLaEntradaNoEsComparable() {
		Comparacion resultado = Comparador.comparar(List.of(detalle("retirado")), List.of());

		var elemento = resultado.elementos().get(0);
		assertThat(elemento.elementoId()).isEqualTo(id("retirado"));
		assertThat(elemento.resultado()).isEqualTo(Resultado.NO_COMPARABLE);
		assertThat(elemento.salida()).isNull();
	}

	@Test
	void emparejaPorElementoIdAunqueElNombreHayaCambiado() {
		Comparacion resultado = Comparador.comparar(
				List.of(conNombre("a", "Llave")), List.of(conNombre("a", "Grifería")));

		assertThat(resultado.elementos()).hasSize(1);
		assertThat(resultado.elementos().get(0).nombre()).isEqualTo("Grifería");
		assertThat(resultado.elementos().get(0).resultado()).isEqualTo(Resultado.SIN_CAMBIO);
	}

	@Test
	void llevaLosIdsDeLasFotosDeCadaLado() {
		Comparacion resultado = Comparador.comparar(
				List.of(conFotos("a", "foto-entrada")), List.of(conFotos("a", "foto-1", "foto-2")));

		assertThat(resultado.elementos().get(0).entrada().evidenciaIds()).containsExactly(id("foto-entrada"));
		assertThat(resultado.elementos().get(0).salida().evidenciaIds()).containsExactly(id("foto-1"), id("foto-2"));
	}

	@Test
	void resumeUnCasoMixto() {
		var entrada = List.of(detalle("a"), detalle("b", EstadoElemento.BUENO, null), detalle("retirado"));
		var salida = List.of(detalle("a"), detalle("b", EstadoElemento.REGULAR, null), detalle("nuevo"));

		assertThat(Comparador.comparar(entrada, salida).resumen()).isEqualTo(new Resumen(2, 1, 2));
	}

	// ---------- Fábrica de datos: cada prueba solo escribe lo que le importa ----------

	private static UUID id(String nombre) {
		return UUID.nameUUIDFromBytes(nombre.getBytes(StandardCharsets.UTF_8));
	}

	private static DetalleRespuesta detalle(String elemento) {
		return detalle(elemento, EstadoElemento.BUENO, null);
	}

	private static DetalleRespuesta detalle(String elemento, EstadoElemento estado, String observacion) {
		return new DetalleRespuesta(UUID.randomUUID(), id(elemento), "Cocina", "Elemento " + elemento, true,
				estado, observacion, 1, List.of());
	}

	private static DetalleRespuesta conNombre(String elemento, String nombre) {
		return new DetalleRespuesta(UUID.randomUUID(), id(elemento), "Cocina", nombre, true,
				EstadoElemento.BUENO, null, 1, List.of());
	}

	private static DetalleRespuesta conFotos(String elemento, String... fotos) {
		List<Evidencia> evidencias = java.util.Arrays.stream(fotos)
				.map(foto -> new Evidencia(id(foto), "image/jpeg", 1, null, null))
				.toList();
		return new DetalleRespuesta(UUID.randomUUID(), id(elemento), "Cocina", "Elemento " + elemento, true,
				EstadoElemento.BUENO, null, 1, evidencias);
	}
}
