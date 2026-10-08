import "server-only";
import { estaVencida, type EstadoInspeccion } from "@/lib/inspecciones";
import { crearClienteServidor } from "@/lib/supabase/server";
import { z } from "@/schemas/zod";
import { contarInmueblesActivos } from "@/server/repositories/inmuebles.repository";
import { contarInspectoresActivos } from "@/server/repositories/inspectores.repository";
import { listarInspecciones, listarPendientesPasadas } from "@/server/repositories/inspecciones.repository";
import { inspeccionesFiltroSchema } from "@/schemas/inspecciones";

export const resumenFiltroSchema = z.object({
  desde: z.iso.date().optional(),
  hasta: z.iso.date().optional(),
});
export type ResumenFiltro = z.infer<typeof resumenFiltroSchema>;

const PROXIMAS_EN_EL_RESUMEN = 5;

// Todos los números del resumen en una sola tanda de consultas en paralelo.
// Los conteos de inspecciones salen de UNA consulta (se cuenta en memoria),
// no de una consulta por cada tarjeta. No hace falta filtrar por
// organización: RLS solo devuelve filas de la del administrador.
export async function obtenerResumen({ desde, hasta }: ResumenFiltro) {
  const supabase = await crearClienteServidor();

  let estados = supabase.from("inspecciones").select("estado");
  // El rango de fechas aplica sobre la fecha programada.
  if (desde) estados = estados.gte("programada_para", desde);
  if (hasta) estados = estados.lte("programada_para", `${hasta}T23:59:59Z`);

  const [{ data, error }, inmueblesActivos, inspectoresActivos, proximas, pasadas] = await Promise.all([
    estados,
    contarInmueblesActivos(),
    contarInspectoresActivos(),
    listarInspecciones(inspeccionesFiltroSchema.parse({ pageSize: PROXIMAS_EN_EL_RESUMEN }), ["PENDIENTE", "EN_PROCESO"]),
    listarPendientesPasadas(),
  ]);
  if (error) throw error;

  // Pendientes que no se iniciaron antes del cierre de su día: requieren
  // que el administrador las reprograme, reasigne o cancele.
  const noRealizadas = pasadas.filter((inspeccion) => estaVencida(inspeccion));

  const conteo: Record<EstadoInspeccion, number> = { PENDIENTE: 0, EN_PROCESO: 0, FINALIZADA: 0, CANCELADA: 0 };
  for (const { estado } of (data ?? []) as { estado: EstadoInspeccion }[]) conteo[estado] += 1;

  return {
    // Actuales, no históricos: cuántos hay activos hoy.
    inmueblesActivos,
    inspectoresActivos,
    inspecciones: {
      pendientes: conteo.PENDIENTE,
      enProceso: conteo.EN_PROCESO,
      finalizadas: conteo.FINALIZADA,
      canceladas: conteo.CANCELADA,
    },
    proximas: proximas.filas.filter((inspeccion) => !estaVencida(inspeccion)),
    noRealizadas,
  };
}
