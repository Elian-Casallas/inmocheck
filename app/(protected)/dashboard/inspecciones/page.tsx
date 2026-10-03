import { exigirRol } from "@/server/auth/sesion";

export default async function PaginaInspecciones() {
  await exigirRol("ADMIN");

  return <h1 className="text-titulo-pantalla font-semibold">Inspecciones</h1>;
}
