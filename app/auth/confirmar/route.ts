import { NextResponse } from "next/server";

// Ruta antigua de los enlaces por correo. Se conserva para que los correos
// ya enviados sigan funcionando: reenvía a /auth/enlace, que es quien crea
// la sesión. El navegador conserva el fragmento (#access_token=…) al redirigir.
export function GET(request: Request) {
  const url = new URL(request.url);
  const destino = new URL("/auth/enlace", url.origin);
  destino.search = url.search;
  return NextResponse.redirect(destino);
}
