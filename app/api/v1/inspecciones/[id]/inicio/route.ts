import { inspeccionVersionSchema } from "@/schemas/inspecciones";
import { requireRole } from "@/server/auth/sesion";
import { leerJson } from "@/server/http/problem";
import { ok, responder, validarId, type ContextoConId } from "@/server/http/respuestas";
import { iniciarInspeccion } from "@/server/services/inspecciones.service";

// Las acciones son POST sobre un subrecurso (/inicio, /finalizacion…):
// no son un simple cambio de campo, tienen reglas propias.
export function POST(request: Request, { params }: ContextoConId) {
  return responder(request, async () => {
    await requireRole("INSPECTOR");
    const id = validarId((await params).id);
    const { version } = inspeccionVersionSchema.parse(await leerJson(request));
    return ok({ data: await iniciarInspeccion(id, version) });
  });
}
