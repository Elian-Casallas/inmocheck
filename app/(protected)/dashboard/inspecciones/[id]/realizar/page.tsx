import { redirect } from "next/navigation";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { Badge } from "@/components/ui/Badge";
import { cargarInspeccion } from "@/features/inspecciones/cargar";
import { RealizarInspeccion } from "@/features/inspecciones/components/realizar/RealizarInspeccion";
import { formatearFechaHora } from "@/lib/formato";
import { ETIQUETA_TIPO_INSPECCION } from "@/lib/inspecciones";
import { exigirRol } from "@/server/auth/sesion";
import { listarDetalles } from "@/server/services/inspecciones.service";

// Título de la pestaña del navegador.
export const metadata = { title: "Realizar inspección" };

// La página solo carga los datos y decide si corresponde estar aquí.
// Toda la interacción vive en el componente cliente RealizarInspeccion.
export default async function PaginaInspeccionRealizar({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirRol("INSPECTOR");
  const { id } = await params;
  // RLS solo le devuelve la inspección al inspector asignado; a otro, 404.
  const inspeccion = await cargarInspeccion(id);
  const ruta = `/dashboard/inspecciones/${inspeccion.id}`;

  if (inspeccion.estado === "FINALIZADA") redirect(`${ruta}/informe`);
  if (inspeccion.estado !== "EN_PROCESO") redirect(ruta);

  const { data: detalles } = await listarDetalles(inspeccion.id);

  return (
    <>
      <EncabezadoPagina
        titulo={`${inspeccion.inmueble.codigo} · Inspección de ${ETIQUETA_TIPO_INSPECCION[inspeccion.tipo].toLowerCase()}`}
        descripcion={`${inspeccion.inmueble.direccion}, ${inspeccion.inmueble.ciudad} · Programada el ${formatearFechaHora(inspeccion.programadaPara)}`}
        volver={{ href: "/dashboard/mis-inspecciones", etiqueta: "Mis inspecciones" }}
        junto={<Badge tono="en-proceso">En proceso</Badge>}
      />
      <RealizarInspeccion inspeccion={inspeccion} detallesIniciales={detalles} />
    </>
  );
}
