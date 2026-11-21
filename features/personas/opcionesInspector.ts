import "server-only";
import { leerTodasLasPaginas } from "@/lib/api/servidor";
import type { Inspector } from "@/schemas/inspectores";

export type OpcionInspector = { id: string; nombre: string };

// Opciones del <select> de inspector (programar y reasignar inspecciones).
// Salen de GET /inspectores?activo=true en Spring: solo los activos de la
// inmobiliaria del admin (RLS), todas las páginas, ordenados por nombre.
export async function listarOpcionesInspector(): Promise<OpcionInspector[]> {
  const inspectores = await leerTodasLasPaginas<Inspector>("inspectores", { activo: true });
  return inspectores.map(({ id, nombre }) => ({ id, nombre }));
}
