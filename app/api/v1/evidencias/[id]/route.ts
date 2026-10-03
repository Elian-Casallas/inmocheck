import { requireRole } from "@/server/auth/sesion";
import { responder, sinContenido, validarId, type ContextoConId } from "@/server/http/respuestas";
import { eliminarEvidencia } from "@/server/services/evidencias.service";

// Solo el inspector asignado y solo mientras la inspección está en proceso.
export function DELETE(request: Request, { params }: ContextoConId) {
  return responder(request, async () => {
    await requireRole("INSPECTOR");
    await eliminarEvidencia(validarId((await params).id));
    return sinContenido();
  });
}
