import { redirect } from "next/navigation";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { RUTA_INICIO_POR_ROL } from "@/lib/constantes";
import { exigirActor } from "@/server/auth/sesion";

export default async function PaginaDashboard() {
  const actor = await exigirActor();

  // El resumen es solo del administrador; el inspector va a su agenda.
  if (actor.rol !== "ADMIN") redirect(RUTA_INICIO_POR_ROL[actor.rol]);

  return (
    <EncabezadoPagina
      titulo="Resumen"
      descripcion={`${actor.organizacion.nombre} · Hola, ${actor.nombre}`}
    />
  );
}
