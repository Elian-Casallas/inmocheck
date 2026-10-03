import { ZONA_HORARIA } from "@/lib/constantes";

// La base guarda las fechas en UTC; aquí se muestran en hora de Bogotá.

const FORMATO_FECHA = new Intl.DateTimeFormat("es-CO", {
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

export function formatearArea(areaM2: number | null): string {
  if (areaM2 === null) return "—";
  return `${new Intl.NumberFormat("es-CO").format(areaM2)} m²`;
}

// "1 inmueble" / "3 inmuebles"
export function plural(cantidad: number, singular: string, pluralTexto = `${singular}s`): string {
  return `${cantidad} ${cantidad === 1 ? singular : pluralTexto}`;
}
