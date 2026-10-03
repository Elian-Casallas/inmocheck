import type { EstadoElemento } from "@/lib/inspecciones";

type Evaluable = {
  estado: EstadoElemento | null;
  obligatorio: boolean;
  observacion: string | null;
};

// Un elemento obligatorio sigue pendiente si no tiene estado, o si se marcó
// "No aplica" sin explicar por qué. Es la misma regla que aplica la función
// SQL finalizar_inspeccion; aquí sirve para mostrar el avance en pantalla.
export function esObligatorioPendiente({ estado, obligatorio, observacion }: Evaluable): boolean {
  if (!obligatorio) return false;
  if (estado === null) return true;
  return estado === "NO_APLICA" && !observacion?.trim();
}

export function calcularProgreso(detalles: Evaluable[]) {
  return {
    evaluados: detalles.filter((detalle) => detalle.estado !== null).length,
    total: detalles.length,
    obligatoriosPendientes: detalles.filter(esObligatorioPendiente).length,
  };
}
