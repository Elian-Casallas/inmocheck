import { requireActor } from "@/server/auth/sesion";
import { ok, responder, validarId, type ContextoConId } from "@/server/http/respuestas";
import { listarInspeccionesDeInmueble } from "@/server/repositories/inspecciones.repository";
import { obtenerInmueble } from "@/server/services/inmuebles.service";

export function GET(request: Request, { params }: ContextoConId) {
  return responder(request, async () => {
    await requireActor();
    const inmuebleId = validarId((await params).id);
    await obtenerInmueble(inmuebleId); // 404 si no existe o no es visible
    return ok({ data: await listarInspeccionesDeInmueble(inmuebleId) });
  });
}
