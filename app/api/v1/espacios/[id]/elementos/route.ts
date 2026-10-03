import { elementoCrearSchema } from "@/schemas/inventario";
import { requireRole } from "@/server/auth/sesion";
import { leerJson } from "@/server/http/problem";
import { creado, responder, validarId, type ContextoConId } from "@/server/http/respuestas";
import { crearElemento } from "@/server/services/inventario.service";

export function POST(request: Request, { params }: ContextoConId) {
  return responder(request, async () => {
    const actor = await requireRole("ADMIN");
    const espacioId = validarId((await params).id);
    const datos = elementoCrearSchema.parse(await leerJson(request));
    const elemento = await crearElemento(actor, espacioId, datos);
    return creado(elemento, `/api/v1/elementos/${elemento.id}`);
  });
}
