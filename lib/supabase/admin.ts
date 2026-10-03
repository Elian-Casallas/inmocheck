import "server-only";
import { createClient } from "@supabase/supabase-js";
import { AppError } from "@/server/http/errores";

// Cliente con la clave service_role: SALTA las políticas RLS.
// Reglas para usarlo:
//  * "server-only" hace fallar la compilación si alguien lo importa desde
//    un componente cliente, así la clave nunca llega al navegador.
//  * Solo para lo que no se puede hacer con la sesión del usuario
//    (invitar cuentas, subir archivos privados), y siempre DESPUÉS de
//    validar permisos con requireRole().
export function crearClienteAdmin() {
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!clave) {
    throw new AppError(
      503,
      "DEPENDENCY_UNAVAILABLE",
      "Servicio no disponible",
      "Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.",
    );
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, clave, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
