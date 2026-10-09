import Link from "next/link";
import { ListaDatos } from "@/components/ui/ListaDatos";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { cargarInmueble } from "@/features/inmuebles/cargar";
import { ListaInspecciones } from "@/features/inspecciones/components/ListaInspecciones";
import { formatearArea, formatearFecha } from "@/lib/formato";
import { ETIQUETA_TIPO_INMUEBLE } from "@/schemas/inmuebles";
import { listarInspeccionesDeInmueble } from "@/server/repositories/inspecciones.repository";

// Título de la pestaña del navegador.
export const metadata = { title: "Inmueble" };

const INSPECCIONES_RECIENTES = 3;

export default async function PaginaInmuebleResumen({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inmueble = await cargarInmueble(id);
  const recientes = await listarInspeccionesDeInmueble(inmueble.id, INSPECCIONES_RECIENTES);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex flex-col gap-6">
        <Tarjeta className="flex flex-col gap-4">
          <h2 className="text-titulo-seccion font-semibold">Datos del inmueble</h2>
          <ListaDatos
            columnas={2}
            datos={[
              { etiqueta: "Código", valor: inmueble.codigo },
              { etiqueta: "Tipo", valor: ETIQUETA_TIPO_INMUEBLE[inmueble.tipo] },
              { etiqueta: "Habitaciones", valor: inmueble.habitaciones },
              { etiqueta: "Baños", valor: inmueble.banos },
              { etiqueta: "Área", valor: formatearArea(inmueble.areaM2) },
              { etiqueta: "Registrado", valor: formatearFecha(inmueble.createdAt) },
            ]}
          />
          {inmueble.descripcion && (
            <p className="text-cuerpo-sm text-texto-secundario">{inmueble.descripcion}</p>
          )}
        </Tarjeta>

        <Tarjeta relleno={false}>
          <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
            <h2 className="text-titulo-seccion font-semibold">Inspecciones recientes</h2>
            <Link
              href={`/dashboard/inmuebles/${inmueble.id}/historial`}
              className="text-cuerpo-sm font-medium text-primario hover:underline"
            >
              Ver historial
            </Link>
          </div>
          <ListaInspecciones inspecciones={recientes} vacio="Este inmueble aún no tiene inspecciones." />
        </Tarjeta>
      </div>

      {/* El inspector no ve datos del propietario: RLS devuelve propietario = null. */}
      {inmueble.propietario && (
        <Tarjeta className="flex flex-col gap-4">
          <h2 className="text-titulo-seccion font-semibold">Propietario</h2>
          <ListaDatos
            datos={[
              { etiqueta: "Nombre", valor: inmueble.propietario.nombre },
              { etiqueta: "Correo", valor: inmueble.propietario.email ?? "—" },
              { etiqueta: "Teléfono", valor: inmueble.propietario.telefono ?? "—" },
            ]}
          />
        </Tarjeta>
      )}
    </div>
  );
}
