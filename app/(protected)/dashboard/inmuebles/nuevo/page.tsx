import { exigirRol } from "@/server/auth/sesion";

export default async function PaginaInmuebleNuevo() {
  await exigirRol("ADMIN");

  return <h1 className="text-titulo-pantalla font-semibold">Nuevo inmueble</h1>;
}
