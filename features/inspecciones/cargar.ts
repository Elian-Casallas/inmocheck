import "server-only";
import { cache } from "react";
import { leerDeSpring } from "@/lib/api/servidor";
import type { Inspeccion } from "@/schemas/inspecciones";

// Carga la inspección para una página desde Spring. Si no existe, el id no es
// válido o el usuario no puede verla (otra organización, inspector no
// asignado), Spring responde 404 y leerDeSpring() muestra "no encontrado".
export const cargarInspeccion = cache(async (id: string): Promise<Inspeccion> => {
  const { data } = await leerDeSpring<{ data: Inspeccion }>(`inspecciones/${encodeURIComponent(id)}`);
  return data;
});
