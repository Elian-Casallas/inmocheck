import { inspectoresFiltroSchema } from "@/schemas/inspectores";
import { requireRole } from "@/server/auth/sesion";
import { ok, parametrosDeUrl, responder } from "@/server/http/respuestas";
import { listarInspectores } from "@/server/services/inspectores.service";

export function GET(request: Request) {
  return responder(request, async () => {
    await requireRole("ADMIN");
    const filtro = inspectoresFiltroSchema.parse(parametrosDeUrl(request));
    return ok(await listarInspectores(filtro));
  });
}
