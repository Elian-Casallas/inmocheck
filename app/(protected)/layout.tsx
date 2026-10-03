import { exigirActor } from "@/server/auth/sesion";

// Envuelve TODAS las rutas protegidas. Antes de mostrar cualquier página
// comprueba en el servidor que haya sesión y que la cuenta siga activa.
// Si no, exigirActor() redirige a /login o a /403.
export default async function LayoutProtegido({ children }: { children: React.ReactNode }) {
  await exigirActor();
  return children;
}
