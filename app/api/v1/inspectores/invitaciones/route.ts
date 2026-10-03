import { inspectorInvitarSchema } from "@/schemas/inspectores";
import { requireRole } from "@/server/auth/sesion";
import { leerJson } from "@/server/http/problem";
import { creado, responder } from "@/server/http/respuestas";
import { invitarInspector } from "@/server/services/inspectores.service";

export function POST(request: Request) {
  return responder(request, async () => {
    const actor = await requireRole("ADMIN");
    const datos = inspectorInvitarSchema.parse(await leerJson(request));
    const inspector = await invitarInspector(actor, datos, new URL(request.url).origin);
    return creado(inspector, `/api/v1/inspectores/${inspector.id}`);
  });
}
