import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { FormularioInspeccion } from "@/features/inspecciones/components/FormularioInspeccion";
import { PAGINA_TAMANO_MAXIMO } from "@/lib/constantes";
import { aFechaYHoraDeCampo } from "@/lib/formato";
import { aplanarParametros, type ParametrosBusqueda } from "@/lib/url";
import { inmueblesFiltroSchema } from "@/schemas/inmuebles";
import { exigirRol } from "@/server/auth/sesion";
import { listarInmuebles } from "@/server/services/inmuebles.service";
import { listarOpcionesInspector } from "@/server/services/inspectores.service";

// Título de la pestaña del navegador.
export const metadata = { title: "Programar inspección" };

export default async function PaginaInspeccionNueva({
  searchParams,
}: {
  searchParams: Promise<ParametrosBusqueda>;
}) {
  await exigirRol("ADMIN");
  const { inmuebleId } = aplanarParametros(await searchParams);

  // Las opciones se cargan en el servidor con la sesión del admin: RLS
  // garantiza que solo sean inmuebles e inspectores de su organización.
  const [{ data: inmuebles }, inspectores] = await Promise.all([
    listarInmuebles(inmueblesFiltroSchema.parse({ activo: "true", pageSize: PAGINA_TAMANO_MAXIMO })),
    listarOpcionesInspector(),
  ]);

  return (
    <div className="flex max-w-[880px] flex-col gap-6">
      <EncabezadoPagina
        titulo="Programar inspección"
        volver={{ href: "/dashboard/inspecciones", etiqueta: "Inspecciones" }}
      />
      <FormularioInspeccion
        inmuebles={inmuebles.map(({ id, codigo, direccion }) => ({ id, codigo, direccion }))}
        inspectores={inspectores}
        inmuebleInicial={inmuebles.some((inmueble) => inmueble.id === inmuebleId) ? inmuebleId : undefined}
        fechaMinima={aFechaYHoraDeCampo(new Date().toISOString()).fecha}
      />
    </div>
  );
}
