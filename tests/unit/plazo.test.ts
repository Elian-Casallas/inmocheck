import { describe, expect, it } from "vitest";
import { aFechaYHoraDeCampo } from "@/lib/formato";
import { estaVencida, limiteParaIniciar } from "@/lib/inspecciones";

// Todas las horas se escriben en hora de Colombia (-05:00).
const colombia = (fechaHora: string) => new Date(`${fechaHora}:00-05:00`);

describe("limiteParaIniciar", () => {
  it("una visita de la mañana se puede iniciar hasta las 7:00 p. m. de ese día", () => {
    expect(limiteParaIniciar("2026-10-08T10:50:00-05:00")).toEqual(colombia("2026-10-08T19:00"));
  });

  it("una visita justo antes del cierre también vence a las 7:00 p. m.", () => {
    expect(limiteParaIniciar("2026-10-08T18:59:00-05:00")).toEqual(colombia("2026-10-08T19:00"));
  });

  it("una visita programada después del cierre vence al terminar ese día", () => {
    expect(limiteParaIniciar("2026-10-08T21:30:00-05:00")).toEqual(colombia("2026-10-09T00:00"));
  });

  it("usa el día de Colombia aunque en UTC ya sea el día siguiente", () => {
    // 8:00 p. m. del 8 en Colombia es la 1:00 a. m. del 9 en UTC.
    expect(limiteParaIniciar("2026-10-09T01:00:00Z")).toEqual(colombia("2026-10-09T00:00"));
  });
});

describe("estaVencida", () => {
  const pendiente = { estado: "PENDIENTE" as const, programadaPara: "2026-10-08T10:50:00-05:00" };

  it("llegar 10 minutos antes no es problema", () => {
    expect(estaVencida(pendiente, colombia("2026-10-08T10:40"))).toBe(false);
  });

  it("llegar 30 minutos o 1 hora tarde tampoco", () => {
    expect(estaVencida(pendiente, colombia("2026-10-08T11:20"))).toBe(false);
    expect(estaVencida(pendiente, colombia("2026-10-08T11:50"))).toBe(false);
  });

  it("a las 7:00 p. m. en punto todavía se puede iniciar", () => {
    expect(estaVencida(pendiente, colombia("2026-10-08T19:00"))).toBe(false);
  });

  it("después de las 7:00 p. m. queda como no realizada", () => {
    expect(estaVencida(pendiente, colombia("2026-10-08T19:01"))).toBe(true);
    expect(estaVencida(pendiente, colombia("2026-10-09T08:00"))).toBe(true);
  });

  it("solo aplica a las pendientes: una en proceso o finalizada nunca vence", () => {
    const despues = colombia("2026-10-09T08:00");

    expect(estaVencida({ ...pendiente, estado: "EN_PROCESO" }, despues)).toBe(false);
    expect(estaVencida({ ...pendiente, estado: "FINALIZADA" }, despues)).toBe(false);
    expect(estaVencida({ ...pendiente, estado: "CANCELADA" }, despues)).toBe(false);
  });
});

describe("aFechaYHoraDeCampo", () => {
  it("convierte un instante en UTC a la fecha y hora de Colombia", () => {
    expect(aFechaYHoraDeCampo("2026-10-08T15:50:00Z")).toEqual({ fecha: "2026-10-08", hora: "10:50" });
  });

  it("retrocede de día cuando en UTC ya es el siguiente", () => {
    expect(aFechaYHoraDeCampo("2026-10-09T01:00:00Z")).toEqual({ fecha: "2026-10-08", hora: "20:00" });
  });
});
