import { ZONA_HORARIA } from "@/lib/constantes";

// La base guarda las fechas en UTC; aquí se muestran en hora de Bogotá.

// Colombia no tiene horario de verano: su desfase frente a UTC es fijo.
export const DESFASE_BOGOTA = "-05:00";

const FORMATO_FECHA =new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: ZONA_HORARIA,
});

const FORMATO_FECHA_HORA = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: ZONA_HORARIA,
});

export function formatearFecha(iso: string): string {
  return FORMATO_FECHA.format(new Date(iso));
}

export function formatearFechaHora(iso: string): string {
  return FORMATO_FECHA_HORA.format(new Date(iso));
}

// Parte un instante en la fecha y la hora de Colombia, con el formato que
// usan los campos <input type="date"> y <input type="time">.
export function aFechaYHoraDeCampo(iso: string): { fecha: string; hora: string } {
  const CINCO_HORAS_MS = 5 * 60 * 60 * 1000;
  const [fecha, resto] = new Date(new Date(iso).getTime() - CINCO_HORAS_MS).toISOString().split("T");
  return { fecha, hora: resto.slice(0, 5) };
}

export function formatearArea(areaM2: number | null): string {
  if (areaM2 === null) return "—";
  return `${new Intl.NumberFormat("es-CO").format(areaM2)} m²`;
}

// "1 inmueble" / "3 inmuebles"
export function plural(cantidad: number, singular: string, pluralTexto = `${singular}s`): string {
  return `${cantidad} ${cantidad === 1 ? singular : pluralTexto}`;
}
