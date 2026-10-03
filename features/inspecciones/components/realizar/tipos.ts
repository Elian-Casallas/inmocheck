import type { EstadoElemento } from "@/lib/inspecciones";

// Lo que la persona está editando y aún no se ha guardado.
export type Borrador = { estado: EstadoElemento | null; observacion: string };

// Estados de guardado de un elemento. "guardado" solo se alcanza cuando el
// servidor respondió bien: nunca se muestra por adelantado.
export type EstadoGuardado =
  | { tipo: "sin-cambios" }
  | { tipo: "sucio" }
  | { tipo: "guardando" }
  | { tipo: "guardado" }
  | { tipo: "error"; mensaje: string }
  | { tipo: "conflicto" };

export type EspacioAgrupado<T> = { nombre: string; detalles: T[] };

// Agrupa los detalles por espacio conservando el orden en que llegan.
export function agruparPorEspacio<T extends { espacioNombre: string }>(detalles: T[]): EspacioAgrupado<T>[] {
  const espacios: EspacioAgrupado<T>[] = [];
  for (const detalle of detalles) {
    let espacio = espacios.find((candidato) => candidato.nombre === detalle.espacioNombre);
    if (!espacio) {
      espacio = { nombre: detalle.espacioNombre, detalles: [] };
      espacios.push(espacio);
    }
    espacio.detalles.push(detalle);
  }
  return espacios;
}
