import { NextResponse } from "next/server";
import { RUTA_ENLACE_CORREO, crearClienteCorreo } from "@/lib/supabase/correo";
import { recuperarContrasenaSchema } from "@/schemas/auth";
import { leerJson, toProblem } from "@/server/http/problem";

export async function POST(request: Request) {
  try {
    const { email } = recuperarContrasenaSchema.parse(await leerJson(request));
    const origen = new URL(request.url).origin;

    const { error } = await crearClienteCorreo().auth.resetPasswordForEmail(email, {
      redirectTo: `${origen}${RUTA_ENLACE_CORREO}`,
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
