import { exigirRol } from "@/server/auth/sesion";

export default async function PaginaInspeccionNueva() {
  await exigirRol("ADMIN");

  return <h1 className="text-titulo-pantalla font-semibold">Programar inspección</h1>;
}
