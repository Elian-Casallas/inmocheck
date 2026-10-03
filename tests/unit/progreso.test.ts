import { describe, expect, it } from "vitest";
import { calcularProgreso, esObligatorioPendiente } from "@/lib/progreso";

describe("esObligatorioPendiente", () => {
  it("un obligatorio sin estado está pendiente", () => {
    expect(esObligatorioPendiente({ estado: null, obligatorio: true, observacion: null })).toBe(true);
  });

  it("un obligatorio evaluado no está pendiente", () => {
    expect(esObligatorioPendiente({ estado: "DANADO", obligatorio: true, observacion: null })).toBe(false);
  });

  it("un opcional sin estado no bloquea el cierre", () => {
    expect(esObligatorioPendiente({ estado: null, obligatorio: false, observacion: null })).toBe(false);
  });

  it("'No aplica' en un obligatorio exige observación", () => {
    expect(esObligatorioPendiente({ estado: "NO_APLICA", obligatorio: true, observacion: null })).toBe(true);
    expect(esObligatorioPendiente({ estado: "NO_APLICA", obligatorio: true, observacion: "   " })).toBe(true);
    expect(
      esObligatorioPendiente({ estado: "NO_APLICA", obligatorio: true, observacion: "No hay balcón" }),
    ).toBe(false);
  });
});

describe("calcularProgreso", () => {
  it("devuelve ceros cuando no hay detalles", () => {
    expect(calcularProgreso([])).toEqual({ evaluados: 0, total: 0, obligatoriosPendientes: 0 });
  });

  it("cuenta evaluados, total y obligatorios pendientes", () => {
    const progreso = calcularProgreso([
      { estado: "BUENO", obligatorio: true, observacion: null },
      { estado: null, obligatorio: true, observacion: null },
      { estado: null, obligatorio: false, observacion: null },
      { estado: "NO_APLICA", obligatorio: true, observacion: null },
    ]);

    expect(progreso).toEqual({ evaluados: 2, total: 4, obligatoriosPendientes: 2 });
  });
});
