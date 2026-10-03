import { inspeccionCrearSchema, inspeccionesFiltroSchema } from "@/schemas/inspecciones";
import { requireActor, requireRole } from "@/server/auth/sesion";
import { leerJson } from "@/server/http/problem";
import { creado, ok, parametrosDeUrl, responder } from "@/server/http/respuestas";
import { crearInspeccion, listarInspecciones } from "@/server/services/inspecciones.service";

// El admin ve todas las de su organización; el inspector, solo las suyas (RLS).
export function GET(request: Request) {
  return responder(request, async () => {
    await requireActor();
    const filtro = inspeccionesFiltroSchema.parse(parametrosDeUrl(request));
    return ok(await listarInspecciones(filtro));
  });
}

export function POST(request: Request) {
  return responder(request, async () => {
    await requireRole("ADMIN");
    const datos = inspeccionCrearSchema.parse(await leerJson(request));
    const inspeccion = await crearInspeccion(datos);
    return creado(inspeccion, `/api/v1/inspecciones/${inspeccion.id}`);
  });
}
