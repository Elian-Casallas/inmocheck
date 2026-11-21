import "server-only";
import { notFound, redirect } from "next/navigation";
import { cabecerasParaSpring, urlEnSpring } from "@/lib/api/backend";
import { crearClienteServidor } from "@/lib/supabase/server";

// Cliente para que los SERVER COMPONENTS (páginas y layouts) lean datos de
// Spring. Es la contraparte de lib/api/client.ts, que usan los componentes
// del navegador para las mutaciones (esas pasan por el proxy /api/v1).
//
// Solo lee (GET). Va directo a Spring desde el servidor de Next.js, con el
// token de la sesión, sin pasar por el proxy.
//
// Si Spring responde un error, la página reacciona como hacía exigirActor():
//   401 → /login · 403 → /403 · 404 → página "no encontrado"
//   cualquier otro → error, que muestra dashboard/error.tsx

export class ErrorDeSpring extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(`Spring respondió ${status} (${code})`);
  }
}

type Reaccion = "iniciar-sesion" | "sin-permiso" | "no-encontrado" | "error";

// Qué hace la página según el estado HTTP. Pura, para poder probarla.
export function reaccionAlEstado(status: number): Reaccion {
  if (status === 401) return "iniciar-sesion";
  if (status === 403) return "sin-permiso";
  if (status === 404) return "no-encontrado";
  return "error";
}

// ruta: sin "/api/v1", p. ej. "auth/me" o "inmuebles".
export async function leerDeSpring<T>(ruta: string, busqueda?: URLSearchParams): Promise<T> {
  const backend = process.env.BACKEND_URL;
  if (!backend) throw new ErrorDeSpring(503, "BACKEND_URL_FALTANTE");

  const token = await tokenDeLaSesion();
  if (!token) redirect("/login");

  const consulta = busqueda && busqueda.size > 0 ? `?${busqueda}` : "";
  const respuesta = await fetch(urlEnSpring(backend, ruta.split("/"), consulta), {
    headers: cabecerasParaSpring(new Headers({ accept: "application/json" }), token),
    cache: "no-store",
  }).catch(() => {
    throw new ErrorDeSpring(503, "SERVICIO_NO_DISPONIBLE");
  });

  if (respuesta.ok) return (await respuesta.json()) as T;

  const reaccion = reaccionAlEstado(respuesta.status);
  if (reaccion === "iniciar-sesion") redirect("/login");
  if (reaccion === "sin-permiso") redirect("/403");
  if (reaccion === "no-encontrado") notFound();

  const problema = (await respuesta.json().catch(() => ({}))) as { code?: string };
  throw new ErrorDeSpring(respuesta.status, problema.code ?? "HTTP_ERROR");
}

async function tokenDeLaSesion(): Promise<string | null> {
  const supabase = await crearClienteServidor();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}
