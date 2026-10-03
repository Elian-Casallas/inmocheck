import { Tarjeta } from "@/components/ui/Tarjeta";
import { cargarInmueble } from "@/features/inmuebles/cargar";
import { ListaInspecciones } from "@/features/inspecciones/components/ListaInspecciones";
import { listarInspeccionesDeInmueble } from "@/server/repositories/inspecciones.repository";

export default async function PaginaInmuebleHistorial({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inmueble = await cargarInmueble(id);
  const inspecciones = await listarInspeccionesDeInmueble(inmueble.id);

  return (
    <Tarjeta relleno={false}>
      <h2 className="px-5 pt-5 pb-3 text-titulo-seccion font-semibold">Historial de inspecciones</h2>
      <ListaInspecciones inspecciones={inspecciones} vacio="Este inmueble aún no tiene inspecciones." />
    </Tarjeta>
  );
}
