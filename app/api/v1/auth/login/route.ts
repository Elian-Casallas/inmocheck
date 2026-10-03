import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { loginSchema } from "@/schemas/auth";
import { buscarPerfil } from "@/server/auth/sesion";
import { ForbiddenError, UnauthenticatedError } from "@/server/http/errores";
import { leerJson, toProblem } from "@/server/http/problem";

export async function POST(request: Request) {
  try {
    const credenciales = loginSchema.parse(await leerJson(request));
    const supabase = await crearClienteServidor();

    const { data, error } = await supabase.auth.signInWithPassword(credenciales);
    if (error) {
      // Mensaje genérico: no revela si el correo existe.
      throw new UnauthenticatedError(
        "El correo o la contraseña no son correctos.",
        "CREDENCIALES_INVALIDAS",
      );
    }

    const perfil = await buscarPerfil(supabase, data.user.id);
    if (!perfil || !perfil.activo) {
      await supabase.auth.signOut();
      throw new ForbiddenError(
        "Tu cuenta está desactivada. Habla con el administrador de tu inmobiliaria.",
        "CUENTA_INACTIVA",
      );
    }

    // La sesión viaja en cookies httpOnly; el JSON solo lleva el perfil.
    return NextResponse.json({ data: perfil });
  } catch (error) {
    return toProblem(error, request);
  }
}
