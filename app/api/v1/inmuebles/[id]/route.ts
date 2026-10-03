import { inmuebleEditarSchema } from "@/schemas/inmuebles";
import { requireActor, requireRole } from "@/server/auth/sesion";
import { leerJson } from "@/server/http/problem";
import { ok, responder, sinContenido, validarId, type ContextoConId } from "@/server/http/respuestas";
import { desactivarInmueble, editarInmueble, obtenerInmueble } from "@/server/services/inmuebles.service";

export function GET(request: Request, { params }: ContextoConId) {
  return responder(request, async () => {
    await requireActor();
    const id = validarId((await params).id);
    return ok({ data: await obtenerInmueble(id) });
  });
}

export function PATCH(request: Request, { params }: ContextoConId) {
  return responder(request, async () => {
    await requireRole("ADMIN");
    const id = validarId((await params).id);
    const datos = inmuebleEditarSchema.parse(await leerJson(request));
    return ok({ data: await editarInmueble(id, datos) });
  });
}

// DELETE no borra la fila: la desactiva.
export function DELETE(request: Request, { params }: ContextoConId) {
  return responder(request, async () => {
    await requireRole("ADMIN");
    const id = validarId((await params).id);
    await desactivarInmueble(id);
    return sinContenido();
  });
}
