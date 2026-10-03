import { espacioCrearSchema } from "@/schemas/inventario";
import { requireActor, requireRole } from "@/server/auth/sesion";
import { leerJson } from "@/server/http/problem";
import { creado, ok, responder, validarId, type ContextoConId } from "@/server/http/respuestas";
import { crearEspacio, listarEspacios } from "@/server/services/inventario.service";

export function GET(request: Request, { params }: ContextoConId) {
  return responder(request, async () => {
    await requireActor();
    const inmuebleId = validarId((await params).id);
    return ok({ data: await listarEspacios(inmuebleId) });
  });
}

export function POST(request: Request, { params }: ContextoConId) {
  return responder(request, async () => {
    const actor = await requireRole("ADMIN");
    const inmuebleId = validarId((await params).id);
    const datos = espacioCrearSchema.parse(await leerJson(request));
    const espacio = await crearEspacio(actor, inmuebleId, datos);
    return creado(espacio, `/api/v1/espacios/${espacio.id}`);
  });
}
