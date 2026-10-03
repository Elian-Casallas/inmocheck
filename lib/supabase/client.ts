import { createBrowserClient } from "@supabase/ssr";

// Cliente de Supabase para el NAVEGADOR. Solo usa la clave pública (anon):
// lo que pueda hacer está limitado por las políticas RLS.
export function crearClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
