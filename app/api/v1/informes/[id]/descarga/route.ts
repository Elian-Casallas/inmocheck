import { NextResponse } from "next/server";
import { requireActor } from "@/server/auth/sesion";
import { responder, validarId, type ContextoConId } from "@/server/http/respuestas";
import { crearDescargaDeInforme } from "@/server/services/informes.service";

// 302 hacia un enlace firmado de 60 segundos. El PDF es privado: cada
// descarga vuelve a pasar por la autorización.
export function GET(request: Request, { params }: ContextoConId) {
  return responder(request, async () => {
    await requireActor();
    const url = await crearDescargaDeInforme(validarId((await params).id));
    return NextResponse.redirect(url, { headers: { "Cache-Control": "private, no-store" } });
  });
}
