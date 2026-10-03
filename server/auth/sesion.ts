import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Rol } from "@/lib/constantes";
import { ForbiddenError, UnauthenticatedError } from "@/server/http/errores";

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

// cache() de React: si el layout y la página piden el actor en la misma
// petición, la consulta se hace una sola vez.
export const obtenerActor = cache(async (): Promise<Actor | null> => {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return buscarPerfil(supabase, user.id);
});

// ---------- Para Route Handlers (/api/v1): lanzan errores HTTP ----------

export async function requireActor(): Promise<Actor> {
  const actor = await obtenerActor();
  if (!actor) throw new UnauthenticatedError();
  if (!actor.activo) {
    throw new ForbiddenError("Tu cuenta está desactivada.", "CUENTA_INACTIVA");
  }
  return actor;
}

export async function requireRole(...rolesPermitidos: Rol[]): Promise<Actor> {
  const actor = await requireActor();
  if (!rolesPermitidos.includes(actor.rol)) throw new ForbiddenError();
  return actor;
}

// ---------- Para páginas y layouts: redirigen ----------

export async function exigirActor(): Promise<Actor> {
  const actor = await obtenerActor();
  if (!actor) redirect("/login");
  if (!actor.activo) redirect("/403");
  return actor;
}

export async function exigirRol(...rolesPermitidos: Rol[]): Promise<Actor> {
  const actor = await exigirActor();
  if (!rolesPermitidos.includes(actor.rol)) redirect("/403");
  return actor;
}
