import { exigirRol } from "@/server/auth/sesion";

export default async function PaginaMisInspecciones() {
  await exigirRol("INSPECTOR");

  return <h1 className="text-titulo-pantalla font-semibold">Mis inspecciones</h1>;
}
