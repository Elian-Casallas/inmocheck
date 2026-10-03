import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { NotFoundError } from "@/server/http/errores";
import { validarId } from "@/server/http/respuestas";
import { obtenerInmueble } from "@/server/services/inmuebles.service";

// Carga el inmueble para una página. Si no existe o el usuario no puede
// verlo, muestra la página 404. cache() evita consultarlo dos veces cuando
// lo piden el layout de pestañas y la página en la misma petición.
export const cargarInmueble = cache(async (id: string) => {
  try {
    return await obtenerInmueble(validarId(id));
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
});
