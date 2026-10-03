import { requireRole } from "@/server/auth/sesion";
import { ok, parametrosDeUrl, responder } from "@/server/http/respuestas";
import { obtenerResumen, resumenFiltroSchema } from "@/server/services/dashboard.service";

export function GET(request: Request) {
  return responder(request, async () => {
    await requireRole("ADMIN");
    const filtro = resumenFiltroSchema.parse(parametrosDeUrl(request));
    return ok({ data: await obtenerResumen(filtro) });
  });
}
