import { inspeccionEditarSchema } from "@/schemas/inspecciones";
import { requireActor, requireRole } from "@/server/auth/sesion";
import { leerJson } from "@/server/http/problem";
import { ok, responder, validarId, type ContextoConId } from "@/server/http/respuestas";
import { editarInspeccion, obtenerInspeccion } from "@/server/services/inspecciones.service";

export function GET(request: Request, { params }: ContextoConId) {
  return responder(request, async () => {
    await requireActor();
    const id = validarId((await params).id);
    return ok({ data: await obtenerInspeccion(id) });
  });
}

// Solo cambia fecha o nota, y solo mientras está pendiente.
export function PATCH(request: Request, { params }: ContextoConId) {
  return responder(request, async () => {
    await requireRole("ADMIN");
    const id = validarId((await params).id);
    const datos = inspeccionEditarSchema.parse(await leerJson(request));
    return ok({ data: await editarInspeccion(id, datos) });
  });
}
