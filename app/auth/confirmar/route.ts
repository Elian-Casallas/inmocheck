import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";

// Destino de los enlaces que Supabase envía por correo (recuperar contraseña
// e invitaciones). Cambia el código de un solo uso por una sesión en cookies
// y continúa a la pantalla indicada en ?siguiente=.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const codigo = url.searchParams.get("code");
  const siguiente = url.searchParams.get("siguiente") ?? "/dashboard";

  // Solo rutas internas: evita que el enlace redirija a otro sitio.
  const destino = siguiente.startsWith("/") && !siguiente.startsWith("//") ? siguiente : "/dashboard";

  if (codigo) {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error) return NextResponse.redirect(new URL(destino, url.origin));
  }

  return NextResponse.redirect(new URL("/login?enlace=invalido", url.origin));
}
