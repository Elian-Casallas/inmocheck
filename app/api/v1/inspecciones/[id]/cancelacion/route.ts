import { inspeccionCancelarSchema } from "@/schemas/inspecciones";
import { requireRole } from "@/server/auth/sesion";
import { leerJson } from "@/server/http/problem";
import { ok, responder, validarId, type ContextoConId } from "@/server/http/respuestas";
import { cancelarInspeccion } from "@/server/services/inspecciones.service";

export function POST(request: Request, { params }: ContextoConId) {
  return responder(request, async () => {
    await requireRole("ADMIN");
    const id = validarId((await params).id);
    const datos = inspeccionCancelarSchema.parse(await leerJson(request));
    return ok({ data: await cancelarInspeccion(id, datos) });
  });
}
