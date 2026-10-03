import { propietarioCrearSchema, propietariosFiltroSchema } from "@/schemas/propietarios";
import { requireRole } from "@/server/auth/sesion";
import { leerJson } from "@/server/http/problem";
import { creado, ok, parametrosDeUrl, responder } from "@/server/http/respuestas";
import { crearPropietario, listarPropietarios } from "@/server/services/propietarios.service";

// El Route Handler solo recibe y responde: valida permisos y forma de los
// datos, llama al servicio y devuelve el resultado.

export function GET(request: Request) {
  return responder(request, async () => {
    await requireRole("ADMIN");
    const filtro = propietariosFiltroSchema.parse(parametrosDeUrl(request));
    return ok(await listarPropietarios(filtro));
  });
}

export function POST(request: Request) {
  return responder(request, async () => {
    const actor = await requireRole("ADMIN");
    const datos = propietarioCrearSchema.parse(await leerJson(request));
    const propietario = await crearPropietario(actor, datos);
    return creado(propietario, `/api/v1/propietarios/${propietario.id}`);
  });
}
