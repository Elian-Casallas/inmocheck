package com.inmocheck.propietarios;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.inmocheck.comun.errores.DatosInvalidosException;
import com.inmocheck.comun.errores.SolicitudInvalidaException;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

// El PATCH debe distinguir "campo ausente", "campo en null" y "campo con valor".
// (Jackson 3 no lo hace en un record: por eso existe CuerpoParcial.)
class EditarPropietarioTest {

	private final JsonMapper json = JsonMapper.builder().build();

	private EditarPropietario leer(String cuerpo) {
		return EditarPropietario.desde(json.readTree(cuerpo));
	}

	@Test
	void distingueAusenteNullYValor() {
		EditarPropietario datos = leer("{\"email\":null,\"telefono\":\"  300  \"}");

		assertThat(datos.nombre()).as("ausente").isNull();
		assertThat(datos.email()).as("null explícito").isEqualTo(Optional.empty());
		assertThat(datos.telefono()).as("con valor, recortado").isEqualTo(Optional.of("300"));
	}

	@Test
	void unCuerpoVacioNoCambiaNada() {
		assertThat(leer("{}").estaVacio()).isTrue();
	}

	@Test
	void rechazaCamposNoPermitidosYTiposEquivocados() {
		assertThatThrownBy(() -> leer("{\"organizacionId\":\"x\",\"nombre\":5}"))
				.isInstanceOf(DatosInvalidosException.class)
				.satisfies(error -> assertThat(((DatosInvalidosException) error).errores())
						.extracting("field")
						.containsExactlyInAnyOrder("organizacionId", "nombre"));
	}

	@Test
	void rechazaUnCuerpoQueNoEsObjeto() {
		assertThatThrownBy(() -> leer("[1,2]")).isInstanceOf(SolicitudInvalidaException.class);
	}
}
