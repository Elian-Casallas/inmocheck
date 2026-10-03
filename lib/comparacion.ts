import type { EstadoElemento } from "@/lib/inspecciones";

// Lo mínimo que se necesita de un detalle para comparar. No depende de la
// base de datos ni de React: es una función pura, fácil de probar.
export type DetalleComparable = {
  elementoId: string;
  espacioNombre: string;
  elementoNombre: string;
  estado: EstadoElemento | null;
  observacion: string | null;
  evidencias: { id: string }[];
};

export type LadoComparado = {
  estado: EstadoElemento | null;
  observacion: string | null;
  evidenciaIds: string[];
};

export type ResultadoComparacion = "SIN_CAMBIO" | "CAMBIO" | "NO_COMPARABLE";

export type ElementoComparado = {
  elementoId: string;
  espacio: string;
  nombre: string;
  entrada: LadoComparado | null;
  salida: LadoComparado | null;
  resultado: ResultadoComparacion;
};

export type Comparacion = {
  resumen: { elementosComparados: number; cambios: number; noComparables: number };
  elementos: ElementoComparado[];
};

const aLado = (detalle: DetalleComparable): LadoComparado => ({
  estado: detalle.estado,
  observacion: detalle.observacion,
  evidenciaIds: detalle.evidencias.map(({ id }) => id),
});

// Empareja los detalles de entrada y salida por elementoId (el id estable
// del elemento del inventario) y clasifica cada pareja:
//   - está en las dos y el estado es igual      → SIN_CAMBIO
//   - está en las dos y el estado es distinto   → CAMBIO
//   - está solo en una (se agregó o se retiró)  → NO_COMPARABLE
// Un CAMBIO es solo "el estado registrado difiere": no dice quién lo causó.
export function compararDetalles(entrada: DetalleComparable[], salida: DetalleComparable[]): Comparacion {
  const entradaPorElemento = new Map(entrada.map((detalle) => [detalle.elementoId, detalle]));
  const idsEnSalida = new Set(salida.map((detalle) => detalle.elementoId));

  const elementos: ElementoComparado[] = salida.map((detalleSalida) => {
    const detalleEntrada = entradaPorElemento.get(detalleSalida.elementoId);
    return {
      elementoId: detalleSalida.elementoId,
      espacio: detalleSalida.espacioNombre,
      nombre: detalleSalida.elementoNombre,
      entrada: detalleEntrada ? aLado(detalleEntrada) : null,
      salida: aLado(detalleSalida),
      resultado: !detalleEntrada
        ? "NO_COMPARABLE"
        : detalleEntrada.estado === detalleSalida.estado
          ? "SIN_CAMBIO"
          : "CAMBIO",
    };
  });

  // Elementos que estaban en la entrada y ya no están en la salida.
  for (const detalleEntrada of entrada) {
    if (idsEnSalida.has(detalleEntrada.elementoId)) continue;
    elementos.push({
      elementoId: detalleEntrada.elementoId,
      espacio: detalleEntrada.espacioNombre,
      nombre: detalleEntrada.elementoNombre,
      entrada: aLado(detalleEntrada),
      salida: null,
      resultado: "NO_COMPARABLE",
    });
  }

  const contar = (resultado: ResultadoComparacion) =>
    elementos.filter((elemento) => elemento.resultado === resultado).length;

  return {
    resumen: {
      elementosComparados: elementos.length - contar("NO_COMPARABLE"),
      cambios: contar("CAMBIO"),
      noComparables: contar("NO_COMPARABLE"),
    },
    elementos,
  };
}
