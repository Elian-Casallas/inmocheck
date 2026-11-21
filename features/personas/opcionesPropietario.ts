import "server-only";
import { leerTodasLasPaginas } from "@/lib/api/servidor";
import type { Propietario } from "@/schemas/propietarios";

export type OpcionPropietario = { id: string; nombre: string };

// Opciones del <select> de propietario del formulario de inmueble. Salen de
// GET /propietarios en Spring (RLS: solo los de la inmobiliaria del admin),
// todas las páginas, ordenadas por nombre como las devuelve la API.
export async function listarOpcionesPropietario(): Promise<OpcionPropietario[]> {
  const propietarios = await leerTodasLasPaginas<Propietario>("propietarios");
  return propietarios.map(({ id, nombre }) => ({ id, nombre }));
}
