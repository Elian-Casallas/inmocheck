import { NextResponse } from "next/server";
import { requireActor } from "@/server/auth/sesion";
import { ok, responder, validarId, type ContextoConId } from "@/server/http/respuestas";
import { crearAccesoEvidencia } from "@/server/services/evidencias.service";

// GET /api/v1/evidencias/{id}/acceso → { url firmada, expiresIn }
// Con ?redirigir=1 responde 302 hacia esa URL: así <img src="…"> funciona
// directo y cada carga de la imagen vuelve a pasar por la autorización.
export function GET(request: Request, { params }: ContextoConId) {
  return responder(request, async () => {
    await requireActor();
    const acceso = await crearAccesoEvidencia(validarId((await params).id));

    if (new URL(request.url).searchParams.has("redirigir")) {
      return NextResponse.redirect(acceso.url, { headers: { "Cache-Control": "private, no-store" } });
    }
    return ok({ data: acceso });
  });
}
