import Link from "next/link";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { clasesBoton } from "@/components/ui/Boton";
import { ChipsFiltro } from "@/components/ui/ChipsFiltro";
import { Icono } from "@/components/ui/Icono";
import { Paginacion } from "@/components/ui/Paginacion";
import { TablaInspecciones } from "@/features/inspecciones/components/TablaInspecciones";
import { ESTADOS_INSPECCION, ETIQUETA_ESTADO_INSPECCION } from "@/lib/inspecciones";
import { aplanarParametros, urlCon, type ParametrosBusqueda } from "@/lib/url";
import { inspeccionesFiltroSchema } from "@/schemas/inspecciones";
import { exigirRol } from "@/server/auth/sesion";
import { contarPorEstado, listarInspecciones } from "@/server/services/inspecciones.service";

// Título de la pestaña del navegador.
export const metadata = { title: "Inspecciones" };

const RUTA = "/dashboard/inspecciones";

export default async function PaginaInspecciones({
  searchParams,
}: {
  searchParams: Promise<ParametrosBusqueda>;
}) {
  await exigirRol("ADMIN");

  const parametros = aplanarParametros(await searchParams);
  const filtro = inspeccionesFiltroSchema.catch(inspeccionesFiltroSchema.parse({})).parse(parametros);
  const [{ data: inspecciones, meta }, conteo] = await Promise.all([
    listarInspecciones(filtro),
    contarPorEstado(),
  ]);

  const total = ESTADOS_INSPECCION.reduce((suma, estado) => suma + conteo[estado], 0);

  return (
    <>
      <EncabezadoPagina
        titulo="Inspecciones"
        descripcion="Visitas programadas, en curso y cerradas de tu inmobiliaria."
        acciones={
          <Link href={`${RUTA}/nueva`} className={clasesBoton()}>
            <Icono nombre="mas" />
            Programar inspección
          </Link>
        }
      />

      <ChipsFiltro
        etiqueta="Filtrar por estado"
        opciones={[
          { href: urlCon(RUTA, {}, {}), texto: "Todas", cantidad: total, activa: !filtro.estado },
          ...ESTADOS_INSPECCION.map((estado) => ({
            href: urlCon(RUTA, {}, { estado }),
            texto: ETIQUETA_ESTADO_INSPECCION[estado],
            cantidad: conteo[estado],
            activa: filtro.estado === estado,
          })),
        ]}
      />

      <TablaInspecciones
        inspecciones={inspecciones}
        mostrarInspector
        vacio={filtro.estado ? "No hay inspecciones en ese estado." : "Aún no hay inspecciones programadas."}
        pie={
          <Paginacion page={meta.page} pageSize={meta.pageSize} total={meta.total} parametros={parametros} ruta={RUTA} />
        }
      />
    </>
  );
}
