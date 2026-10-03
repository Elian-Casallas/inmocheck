import { describe, expect, it } from "vitest";
import { compararDetalles, type DetalleComparable } from "@/lib/comparacion";

// Fábrica de datos: cada prueba solo escribe lo que le importa.
function detalle(elementoId: string, cambios: Partial<DetalleComparable> = {}): DetalleComparable {
  return {
    elementoId,
    espacioNombre: "Cocina",
    elementoNombre: `Elemento ${elementoId}`,
    estado: "BUENO",
    observacion: null,
    evidencias: [],
    ...cambios,
  };
}

describe("compararDetalles", () => {
  it("marca SIN_CAMBIO cuando el estado es igual en entrada y salida", () => {
    const { elementos, resumen } = compararDetalles([detalle("a")], [detalle("a")]);

    expect(elementos[0].resultado).toBe("SIN_CAMBIO");
    expect(resumen).toEqual({ elementosComparados: 1, cambios: 0, noComparables: 0 });
  });

  it("marca CAMBIO cuando el estado es distinto", () => {
    const { elementos, resumen } = compararDetalles(
      [detalle("a", { estado: "BUENO" })],
      [detalle("a", { estado: "DANADO", observacion: "Roto" })],
    );

    expect(elementos[0].resultado).toBe("CAMBIO");
    expect(elementos[0].entrada?.estado).toBe("BUENO");
    expect(elementos[0].salida).toMatchObject({ estado: "DANADO", observacion: "Roto" });
    expect(resumen.cambios).toBe(1);
  });

  it("no cuenta como cambio una observación distinta con el mismo estado", () => {
    const { elementos } = compararDetalles(
      [detalle("a", { observacion: null })],
      [detalle("a", { observacion: "Sigue igual" })],
    );

    expect(elementos[0].resultado).toBe("SIN_CAMBIO");
  });

  it("marca NO_COMPARABLE un elemento que solo está en la salida (se agregó)", () => {
    const { elementos, resumen } = compararDetalles([], [detalle("nuevo")]);

    expect(elementos[0]).toMatchObject({ resultado: "NO_COMPARABLE", entrada: null });
    expect(resumen).toEqual({ elementosComparados: 0, cambios: 0, noComparables: 1 });
  });

  it("marca NO_COMPARABLE un elemento que solo está en la entrada (se retiró)", () => {
    const { elementos } = compararDetalles([detalle("retirado")], []);

    expect(elementos[0]).toMatchObject({ elementoId: "retirado", resultado: "NO_COMPARABLE", salida: null });
  });

  it("empareja por elementoId aunque el nombre haya cambiado", () => {
    const { elementos } = compararDetalles(
      [detalle("a", { elementoNombre: "Llave" })],
      [detalle("a", { elementoNombre: "Grifería" })],
    );

    expect(elementos).toHaveLength(1);
    expect(elementos[0].nombre).toBe("Grifería");
    expect(elementos[0].resultado).toBe("SIN_CAMBIO");
  });

  it("lleva los ids de las fotos de cada lado", () => {
    const { elementos } = compararDetalles(
      [detalle("a", { evidencias: [{ id: "foto-entrada" }] })],
      [detalle("a", { evidencias: [{ id: "foto-1" }, { id: "foto-2" }] })],
    );

    expect(elementos[0].entrada?.evidenciaIds).toEqual(["foto-entrada"]);
    expect(elementos[0].salida?.evidenciaIds).toEqual(["foto-1", "foto-2"]);
  });

  it("resume un caso mixto", () => {
    const entrada = [detalle("a"), detalle("b", { estado: "BUENO" }), detalle("retirado")];
    const salida = [detalle("a"), detalle("b", { estado: "REGULAR" }), detalle("nuevo")];

    expect(compararDetalles(entrada, salida).resumen).toEqual({
      elementosComparados: 2,
      cambios: 1,
      noComparables: 2,
    });
  });
});
