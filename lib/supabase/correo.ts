import "server-only";
import { createClient } from "@supabase/supabase-js";

// Ruta de la app que recibe los enlaces enviados por correo.
export const RUTA_ENLACE_CORREO = "/auth/enlace?siguiente=/auth/actualizar-contrasena";

// Cliente SIN sesión, solo para pedirle a Supabase que envíe correos
// (recuperar contraseña, reenviar acceso).
//
// Usa el flujo "implicit" a propósito. El flujo PKCE guarda un código
// secreto en el navegador que PIDE el correo y exige que el enlace se abra
// en ese mismo navegador. Aquí quien pide el correo (el servidor, o el
// administrador que invita) no es quien lo abre (el inspector, quizá desde
// el celular), así que PKCE fallaría.
export function crearClienteCorreo() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false } },
  );
}
