import "server-only";
import { cache } from "react";
import { leerDeSpring } from "@/lib/api/servidor";
import type { Inmueble } from "@/schemas/inmuebles";

// Carga el inmueble para una página desde Spring. Si no existe, el id no es
// válido o el usuario no puede verlo, Spring responde 404 y leerDeSpring()
// muestra la página "no encontrado". cache() evita pedirlo dos veces cuando
// lo piden el layout de pestañas y la página en la misma petición.
export const cargarInmueble = cache(async (id: string): Promise<Inmueble> => {
  const { data } = await leerDeSpring<{ data: Inmueble }>(`inmuebles/${encodeURIComponent(id)}`);
  return data;
});
