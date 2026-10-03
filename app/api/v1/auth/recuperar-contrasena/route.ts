import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { recuperarContrasenaSchema } from "@/schemas/auth";
import { leerJson, toProblem } from "@/server/http/problem";

export async function POST(request: Request) {
  try {
    const { email } = recuperarContrasenaSchema.parse(await leerJson(request));
    const supabase = await crearClienteServidor();
    const origen = new URL(request.url).origin;

    // El enlace del correo vuelve a /auth/confirmar, que crea la sesión y
    // lleva a la pantalla de nueva contraseña.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origen}/auth/confirmar?siguiente=/auth/actualizar-contrasena`,
    });
    if (error) console.error("recuperar-contrasena:", error.message);

    // Siempre la misma respuesta, exista o no la cuenta: así no se puede
    // usar este endpoint para averiguar qué correos están registrados.
    return NextResponse.json(
      { message: "Si la cuenta existe, enviaremos instrucciones de recuperación." },
      { status: 202 },
    );
  } catch (error) {
    return toProblem(error, request);
  }
}
