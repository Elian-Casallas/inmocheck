import "server-only";
import { leerDeSpring, parametrosDeFiltro } from "@/lib/api/servidor";
import type { InspeccionResumen } from "@/lib/inspecciones";

// Resumen del administrador (GET /dashboard/resumen), calculado en Spring.
export type Resumen = {
  // Actuales, no históricos: cuántos hay activos hoy.
  inmueblesActivos: number;
  inspectoresActivos: number;
  inspecciones: { pendientes: number; enProceso: number; finalizadas: number; canceladas: number };
  // Pendientes o en proceso que todavía se pueden hacer, de la más próxima a la más lejana.
  proximas: InspeccionResumen[];
  // Pendientes que no se iniciaron antes de las 7:00 p. m. de su día.
  noRealizadas: InspeccionResumen[];
};

// desde / hasta (AAAA-MM-DD) filtran los conteos por la fecha programada.
export async function obtenerResumen(filtro: { desde?: string; hasta?: string } = {}): Promise<Resumen> {
  const { data } = await leerDeSpring<{ data: Resumen }>("dashboard/resumen", parametrosDeFiltro(filtro));
  return data;
}
