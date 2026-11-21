import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { leerDeSpring } from "@/lib/api/servidor";
import type { Rol } from "@/lib/constantes";

// El "actor" es quien hace la petición. Su rol y su organización salen SIEMPRE
// de la sesión y de la tabla perfiles, nunca de lo que mande el navegador.
export type Actor = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  organizacion: { id: string; nombre: string };
};

type FilaPerfil = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  organizaciones: { id: string; nombre: string };
};

// Perfil del usuario recién autenticado. Solo lo usa el login (que se queda en
// Next.js porque crea las cookies de la sesión) para rechazar cuentas sin perfil
// o desactivadas antes de dejar la sesión abierta.
export async function buscarPerfil(
  supabase: SupabaseClient,
  usuarioId: string,
): Promise<Actor | null> {
  const { data, error } = await supabase
    .from("perfiles")
    .select("id, nombre, email, rol, activo, organizaciones (id, nombre)")
    .eq("id", usuarioId)
    .maybeSingle()
    .overrideTypes<FilaPerfil, { merge: false }>();

  if (error) throw error;
  if (!data) return null;

  const { organizaciones, ...perfil } = data;
  return { ...perfil, organizacion: organizaciones };
}

// ---------- Para páginas y layouts: redirigen ----------

// Las páginas preguntan a SPRING quién es el usuario (GET /auth/me).
// leerDeSpring() ya redirige: sin sesión → /login, cuenta desactivada → /403.
// cache(): el layout y la página lo piden en la misma petición y se llama una vez.
const obtenerActorDeSpring = cache(async (): Promise<Actor> => {
  const { data } = await leerDeSpring<{ data: Actor }>("auth/me");
  return data;
});

export async function exigirActor(): Promise<Actor> {
  return obtenerActorDeSpring();
}

export async function exigirRol(...rolesPermitidos: Rol[]): Promise<Actor> {
  const actor = await exigirActor();
  if (!rolesPermitidos.includes(actor.rol)) redirect("/403");
  return actor;
}
