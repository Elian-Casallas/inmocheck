import { exigirRol } from "@/server/auth/sesion";

export default async function PaginaInspectores() {
  await exigirRol("ADMIN");

  return <h1 className="text-titulo-pantalla font-semibold">Inspectores</h1>;
}
