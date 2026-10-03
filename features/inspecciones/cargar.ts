import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { NotFoundError } from "@/server/http/errores";
import { validarId } from "@/server/http/respuestas";
import { obtenerInspeccion } from "@/server/services/inspecciones.service";

// Carga la inspección para una página; si no existe o el usuario no puede
// verla (otra organización, inspector no asignado) muestra el 404.
export const cargarInspeccion = cache(async (id: string) => {
  try {
    return await obtenerInspeccion(validarId(id));
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
});
