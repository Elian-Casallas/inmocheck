import { elementoEditarSchema } from "@/schemas/inventario";
import { requireRole } from "@/server/auth/sesion";
import { leerJson } from "@/server/http/problem";
import { ok, responder, validarId, type ContextoConId } from "@/server/http/respuestas";
import { editarElemento } from "@/server/services/inventario.service";

export function PATCH(request: Request, { params }: ContextoConId) {
  return responder(request, async () => {
    await requireRole("ADMIN");
    const id = validarId((await params).id);
    const datos = elementoEditarSchema.parse(await leerJson(request));
    return ok({ data: await editarElemento(id, datos) });
  });
}
