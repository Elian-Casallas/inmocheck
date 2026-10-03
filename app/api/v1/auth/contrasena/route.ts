import { crearClienteServidor } from "@/lib/supabase/server";
import { nuevaContrasenaSchema } from "@/schemas/auth";
import { AppError, UnauthenticatedError } from "@/server/http/errores";
import { leerJson } from "@/server/http/problem";
import { responder, sinContenido } from "@/server/http/respuestas";

// PUT /api/v1/auth/contrasena → cambia la contraseña del usuario de la sesión.
// Pasa por el servidor para que la regla de contraseña se valide aquí también:
// la validación del formulario se puede saltar, la del servidor no.
export function PUT(request: Request) {
  return responder(request, async () => {
    const { password } = nuevaContrasenaSchema.parse(await leerJson(request));

    const supabase = await crearClienteServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new UnauthenticatedError("El enlace venció. Solicita uno nuevo.");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      throw new AppError(
        422,
        "CONTRASENA_RECHAZADA",
        "Contraseña no aceptada",
        "No se pudo guardar esa contraseña. Prueba con una diferente.",
      );
    }
    return sinContenido();
  });
}
