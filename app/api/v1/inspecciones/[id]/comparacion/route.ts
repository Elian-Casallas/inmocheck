import { uuidSchema } from "@/schemas/comun";
import { z } from "@/schemas/zod";
import { requireActor } from "@/server/auth/sesion";
import { ok, parametrosDeUrl, responder, validarId, type ContextoConId } from "@/server/http/respuestas";
import { compararInspecciones } from "@/server/services/comparacion.service";

const consultaSchema = z.object({ contra: uuidSchema });

// GET /api/v1/inspecciones/{salidaId}/comparacion?contra={entradaId}
export function GET(request: Request, { params }: ContextoConId) {
  return responder(request, async () => {
    await requireActor();
    const salidaId = validarId((await params).id);
    const { contra } = consultaSchema.parse(parametrosDeUrl(request));
    return ok({ data: await compararInspecciones(salidaId, contra) });
  });
}
