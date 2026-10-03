import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// proxy.ts corre ANTES de cada página (en Next.js 15 se llamaba middleware.ts).
// Hace dos cosas:
//  1. Refresca la sesión de Supabase y reescribe las cookies si el token cambió.
//  2. Primera barrera de navegación: sin sesión no se entra a /dashboard.
// La seguridad real sigue estando en el layout protegido, en la API y en RLS.
export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesNuevas) {
          cookiesNuevas.forEach(({ name, value }) => request.cookies.set(name, value));
          respuesta = NextResponse.next({ request });
          cookiesNuevas.forEach(({ name, value, options }) =>
            respuesta.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() valida el token contra Supabase; no confía en la cookie a ciegas.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ruta = request.nextUrl.pathname;

  if (!user && ruta.startsWith("/dashboard")) {
    return redirigir(request, respuesta, "/login");
  }

  if (user && ruta === "/login") {
    return redirigir(request, respuesta, "/dashboard");
  }

  return respuesta;
}

// Al redirigir hay que conservar las cookies que Supabase acaba de refrescar.
function redirigir(request: NextRequest, respuesta: NextResponse, destino: string) {
  const url = request.nextUrl.clone();
  url.pathname = destino;
  url.search = "";

  const redireccion = NextResponse.redirect(url);
  respuesta.cookies.getAll().forEach((cookie) => redireccion.cookies.set(cookie));
  return redireccion;
}

export const config = {
  // Corre en todo menos archivos estáticos e imágenes.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
