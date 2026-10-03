import { inmuebleCrearSchema, inmueblesFiltroSchema } from "@/schemas/inmuebles";
import { requireActor, requireRole } from "@/server/auth/sesion";
import { leerJson } from "@/server/http/problem";
import { creado, ok, parametrosDeUrl, responder } from "@/server/http/respuestas";
import { crearInmueble, listarInmuebles } from "@/server/services/inmuebles.service";

// Admin e inspector pueden listar; RLS decide qué filas ve cada uno
// (el inspector solo los inmuebles de sus inspecciones).
export function GET(request: Request) {
  return responder(request, async () => {
    await requireActor();
    const filtro = inmueblesFiltroSchema.parse(parametrosDeUrl(request));
    return ok(await listarInmuebles(filtro));
  });
}

export function POST(request: Request) {
  return responder(request, async () => {
    const actor = await requireRole("ADMIN");
    const datos = inmuebleCrearSchema.parse(await leerJson(request));
    const inmueble = await crearInmueble(actor, datos);
    return creado(inmueble, `/api/v1/inmuebles/${inmueble.id}`);
  });
}
