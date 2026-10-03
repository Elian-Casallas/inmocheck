import { inspeccionReasignarSchema } from "@/schemas/inspecciones";
import { requireRole } from "@/server/auth/sesion";
import { leerJson } from "@/server/http/problem";
import { ok, responder, validarId, type ContextoConId } from "@/server/http/respuestas";
import { reasignarInspeccion } from "@/server/services/inspecciones.service";

export function POST(request: Request, { params }: ContextoConId) {
  return responder(request, async () => {
    await requireRole("ADMIN");
    const id = validarId((await params).id);
    const datos = inspeccionReasignarSchema.parse(await leerJson(request));
    return ok({ data: await reasignarInspeccion(id, datos) });
  });
}
