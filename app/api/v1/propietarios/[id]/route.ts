import { propietarioEditarSchema } from "@/schemas/propietarios";
import { requireRole } from "@/server/auth/sesion";
import { leerJson } from "@/server/http/problem";
import { ok, responder, validarId, type ContextoConId } from "@/server/http/respuestas";
import { editarPropietario, obtenerPropietario } from "@/server/services/propietarios.service";

export function GET(request: Request, { params }: ContextoConId) {
  return responder(request, async () => {
    await requireRole("ADMIN");
    const id = validarId((await params).id);
    return ok({ data: await obtenerPropietario(id) });
  });
}

export function PATCH(request: Request, { params }: ContextoConId) {
  return responder(request, async () => {
    await requireRole("ADMIN");
    const id = validarId((await params).id);
    const datos = propietarioEditarSchema.parse(await leerJson(request));
    return ok({ data: await editarPropietario(id, datos) });
  });
}
