import "server-only";
import { leerDeSpring, leerTodasLasPaginas, parametrosDeFiltro } from "@/lib/api/servidor";
import { ESTADOS_INSPECCION, type EstadoInspeccion, type InspeccionResumen } from "@/lib/inspecciones";
import type { Paginado } from "@/schemas/comun";
import type { Comparacion } from "@/lib/comparacion";
import type { Detalle, Inspeccion, Progreso } from "@/schemas/inspecciones";

// Consultas de inspecciones que usan varias páginas. Todas van a Spring
// (GET /inspecciones); RLS decide qué ve cada rol.

// Cuántas hay en cada estado (pestañas de los listados). Sale del total de
// la lista filtrada por estado, pidiendo una sola fila: no hace falta un
// endpoint de conteo.
export async function contarPorEstado(): Promise<Record<EstadoInspeccion, number>> {
  const totales = await Promise.all(
    ESTADOS_INSPECCION.map(async (estado) => {
      const { meta } = await leerDeSpring<Paginado<InspeccionResumen>>(
        "inspecciones",
        parametrosDeFiltro({ estado, pageSize: 1 }),
      );
      return [estado, meta.total] as const;
    }),
  );
  return Object.fromEntries(totales) as Record<EstadoInspeccion, number>;
}

// Pendientes y en proceso de un inspector (panel lateral de Inspectores),
// de la más próxima a la más lejana.
export function listarAbiertasDeInspector(inspectorId: string): Promise<InspeccionResumen[]> {
  return leerTodasLasPaginas<InspeccionResumen>("inspecciones", {
    inspectorId,
    estado: "PENDIENTE,EN_PROCESO",
  });
}

// Actividad de una inspección, de lo más reciente a lo más antiguo
// (GET /auditoria, solo el administrador). La escriben las funciones SQL.
export type Actividad = { id: string; accion: string; fecha: string; actor: { nombre: string } | null };

export function listarActividad(inspeccionId: string): Promise<Actividad[]> {
  return leerTodasLasPaginas<Actividad>("auditoria", { recursoId: inspeccionId });
}

// Elementos a evaluar de una inspección y su progreso (GET /inspecciones/{id}/detalles).
export function listarDetalles(inspeccionId: string): Promise<{ data: Detalle[]; meta: Progreso }> {
  return leerDeSpring<{ data: Detalle[]; meta: Progreso }>(`inspecciones/${encodeURIComponent(inspeccionId)}/detalles`);
}

// Comparación entrada/salida, calculada por Spring al momento.
export function compararInspecciones(salidaId: string, entradaId: string): Promise<Comparacion> {
  return leerDeSpring<{ data: Comparacion }>(
    `inspecciones/${encodeURIComponent(salidaId)}/comparacion`,
    parametrosDeFiltro({ contra: entradaId }),
  ).then(({ data }) => data);
}

// Entradas finalizadas del mismo inmueble y anteriores a la salida, de la
// más reciente a la más antigua (el historial ya viene en ese orden).
export async function listarEntradasComparables(salida: Inspeccion): Promise<InspeccionResumen[]> {
  const { data } = await leerDeSpring<{ data: InspeccionResumen[] }>(
    `inmuebles/${encodeURIComponent(salida.inmueble.id)}/historial`,
  );
  const finSalida = salida.finalizadaEn ? Date.parse(salida.finalizadaEn) : 0;
  return data.filter(
    (inspeccion) =>
      inspeccion.tipo === "ENTRADA" &&
      inspeccion.estado === "FINALIZADA" &&
      inspeccion.finalizadaEn !== null &&
      Date.parse(inspeccion.finalizadaEn) < finSalida,
  );
}
