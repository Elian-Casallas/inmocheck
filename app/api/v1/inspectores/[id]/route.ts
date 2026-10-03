import { inspectorEditarSchema } from "@/schemas/inspectores";
import { requireRole } from "@/server/auth/sesion";
import { leerJson } from "@/server/http/problem";
import { ok, responder, validarId, type ContextoConId } from "@/server/http/respuestas";
import { editarInspector } from "@/server/services/inspectores.service";

export function PATCH(request: Request, { params }: ContextoConId) {
  return responder(request, async () => {
    await requireRole("ADMIN");
    const id = validarId((await params).id);
    const datos = inspectorEditarSchema.parse(await leerJson(request));
    return ok({ data: await editarInspector(id, datos) });
  });
}
