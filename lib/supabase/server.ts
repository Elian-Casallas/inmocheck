import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente de Supabase para el SERVIDOR (Server Components y Route Handlers).
// Lee la sesión desde las cookies de la petición, así que cada consulta se
// hace "a nombre" del usuario conectado y las políticas RLS se aplican.
export async function crearClienteServidor() {
  const almacenCookies = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return almacenCookies.getAll();
        },
        setAll(cookiesNuevas) {
          try {
            cookiesNuevas.forEach(({ name, value, options }) =>
              almacenCookies.set(name, value, options),
            );
          } catch {
            // Un Server Component no puede escribir cookies. No es un error:
            // proxy.ts ya se encarga de refrescar la sesión en cada petición.
          }
        },
      },
    },
  );
}
