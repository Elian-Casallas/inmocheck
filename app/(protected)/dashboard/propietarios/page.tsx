import { exigirRol } from "@/server/auth/sesion";

export default async function PaginaPropietarios() {
  await exigirRol("ADMIN");

  return <h1 className="text-titulo-pantalla font-semibold">Propietarios</h1>;
}
