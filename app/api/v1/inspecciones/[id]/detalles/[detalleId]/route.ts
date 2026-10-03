import { detalleGuardarSchema } from "@/schemas/inspecciones";
import { requireRole } from "@/server/auth/sesion";
import { leerJson } from "@/server/http/problem";
import { ok, responder, validarId } from "@/server/http/respuestas";
import { guardarDetalle } from "@/server/services/inspecciones.service";

type Contexto = { params: Promise<{ id: string; detalleId: string }> };

// Guarda la evaluación de un elemento. Exige la versión que el cliente tenía:
// si ya cambió, responde 409 VERSION_CONFLICT en lugar de pisar el cambio.
export function PATCH(request: Request, { params }: Contexto) {
  return responder(request, async () => {
    await requireRole("INSPECTOR");
    const { id, detalleId } = await params;
    const datos = detalleGuardarSchema.parse(await leerJson(request));
    return ok({ data: await guardarDetalle(validarId(id), validarId(detalleId), datos) });
  });
}
