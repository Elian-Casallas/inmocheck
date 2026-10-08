import { informeCrearSchema } from "@/schemas/informes";
import { requireActor } from "@/server/auth/sesion";
import { leerJson } from "@/server/http/problem";
import { creado, ok, responder, validarId, type ContextoConId } from "@/server/http/respuestas";
import { generarInforme, listarInformesDeInspeccion } from "@/server/services/informes.service";

export function GET(request: Request, { params }: ContextoConId) {
  return responder(request, async () => {
    await requireActor();
    const id = validarId((await params).id);
    return ok({ data: await listarInformesDeInspeccion(id) });
  });
}

// Genera una versión nueva del acta. Se puede reintentar: nunca cambia la inspección.
export function POST(request: Request, { params }: ContextoConId) {
  return responder(request, async () => {
    const actor = await requireActor();
    const id = validarId((await params).id);
    const { evidenciaIds } = informeCrearSchema.parse(await leerJson(request));
    const informe = await generarInforme(actor, id, evidenciaIds);
    return creado(informe, `/api/v1/informes/${informe.id}/descarga`);
  });
}
