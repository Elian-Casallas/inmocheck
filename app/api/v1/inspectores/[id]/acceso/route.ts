import { requireRole } from "@/server/auth/sesion";
import { leerJson } from "@/server/http/problem";
import { responder, sinContenido, validarId, type ContextoConId } from "@/server/http/respuestas";
import { reenviarAcceso } from "@/server/services/inspectores.service";

// POST /api/v1/inspectores/{id}/acceso → envía al inspector un enlace nuevo
// para crear su contraseña.
export function POST(request: Request, { params }: ContextoConId) {
  return responder(request, async () => {
    const actor = await requireRole("ADMIN");
    const id = validarId((await params).id);
    await leerJson(request); // valida el origen de la petición (CSRF)
    await reenviarAcceso(actor, id, new URL(request.url).origin);
    return sinContenido();
  });
}
