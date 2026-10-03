import { requireActor } from "@/server/auth/sesion";
import { ok, responder, validarId, type ContextoConId } from "@/server/http/respuestas";
import { listarDetalles } from "@/server/services/inspecciones.service";

export function GET(request: Request, { params }: ContextoConId) {
  return responder(request, async () => {
    await requireActor();
    const id = validarId((await params).id);
    return ok(await listarDetalles(id));
  });
}
