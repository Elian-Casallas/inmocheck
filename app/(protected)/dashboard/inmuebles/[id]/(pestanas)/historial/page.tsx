import { Tarjeta } from "@/components/ui/Tarjeta";
import { cargarInmueble } from "@/features/inmuebles/cargar";
import { ListaInspecciones } from "@/features/inspecciones/components/ListaInspecciones";
import { leerDeSpring } from "@/lib/api/servidor";
import type { InspeccionResumen } from "@/lib/inspecciones";

// Título de la pestaña del navegador.
export const metadata = { title: "Historial" };

export default async function PaginaInmuebleHistorial({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inmueble = await cargarInmueble(id);
  const { data: inspecciones } = await leerDeSpring<{ data: InspeccionResumen[] }>(`inmuebles/${inmueble.id}/historial`);

  return (
    <Tarjeta relleno={false}>
      <h2 className="px-5 pt-5 pb-3 text-titulo-seccion font-semibold">Historial de inspecciones</h2>
      <ListaInspecciones inspecciones={inspecciones} vacio="Este inmueble aún no tiene inspecciones." />
    </Tarjeta>
  );
}
