import Link from "next/link";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { Badge } from "@/components/ui/Badge";
import { clasesBoton } from "@/components/ui/Boton";
import { ChipsFiltro } from "@/components/ui/ChipsFiltro";
import { Paginacion } from "@/components/ui/Paginacion";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { BarraProgreso } from "@/features/inspecciones/components/BarraProgreso";
import { TablaInspecciones } from "@/features/inspecciones/components/TablaInspecciones";
import { ZONA_HORARIA } from "@/lib/constantes";
import { ETIQUETA_TIPO_INSPECCION, type EstadoInspeccion } from "@/lib/inspecciones";
import { aplanarParametros, type ParametrosBusqueda } from "@/lib/url";
import { inspeccionesFiltroSchema } from "@/schemas/inspecciones";
import { exigirRol } from "@/server/auth/sesion";
import { contarPorEstado, listarInspecciones, obtenerInspeccion } from "@/server/services/inspecciones.service";

// Título de la pestaña del navegador.
export const metadata = { title: "Mis inspecciones" };

const RUTA = "/dashboard/mis-inspecciones";
const ESTADOS_PROXIMAS: EstadoInspeccion[] = ["PENDIENTE"];
const ESTADOS_CERRADAS: EstadoInspeccion[] = ["FINALIZADA", "CANCELADA"];

export default async function PaginaMisInspecciones({
  searchParams,
}: {
  searchParams: Promise<ParametrosBusqueda>;
}) {
  await exigirRol("INSPECTOR");

  const parametros = aplanarParametros(await searchParams);
  const verFinalizadas = parametros.vista === "finalizadas";
  const filtro = inspeccionesFiltroSchema.parse({ page: parametros.page });

  // No hace falta filtrar por inspector: RLS solo devuelve las asignadas a
  // quien tiene la sesión. Aunque alguien cambie la consulta, no verá otras.
  const [{ data: inspecciones, meta }, enCurso, conteo] = await Promise.all([
    listarInspecciones(filtro, verFinalizadas ? ESTADOS_CERRADAS : ESTADOS_PROXIMAS),
    listarInspecciones(inspeccionesFiltroSchema.parse({ estado: "EN_PROCESO" })),
    contarPorEstado(),
  ]);
  const actuales = await Promise.all(enCurso.data.map((inspeccion) => obtenerInspeccion(inspeccion.id)));

  const hoy = new Intl.DateTimeFormat("es-CO", { dateStyle: "full", timeZone: ZONA_HORARIA }).format(new Date());

  return (
    <>
      <EncabezadoPagina titulo="Mis inspecciones" descripcion={hoy.charAt(0).toUpperCase() + hoy.slice(1)} />

      {actuales.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-titulo-seccion font-semibold">En curso</h2>
          {actuales.map((inspeccion) => (
            <Tarjeta
              key={inspeccion.id}
              className="grid items-center gap-x-8 gap-y-4 min-[760px]:grid-cols-[minmax(0,1fr)_minmax(200px,280px)_auto]"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-titulo-seccion font-semibold">
                    {inspeccion.inmueble.codigo} · {ETIQUETA_TIPO_INSPECCION[inspeccion.tipo]}
                  </span>
                  <Badge tono="en-proceso">En proceso</Badge>
                </div>
                <span className="text-cuerpo-sm text-texto-secundario">
                  {inspeccion.inmueble.direccion}, {inspeccion.inmueble.ciudad}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-pequeno font-medium text-texto-tenue">Avance</span>
                <div className="flex items-center gap-3">
                  <BarraProgreso evaluados={inspeccion.progreso.evaluados} total={inspeccion.progreso.total} />
                  <span className="text-pequeno font-medium text-texto-secundario">
                    {inspeccion.progreso.evaluados} de {inspeccion.progreso.total}
                  </span>
                </div>
              </div>
              <Link href={`/dashboard/inspecciones/${inspeccion.id}/realizar`} className={clasesBoton()}>
                Continuar inspección
              </Link>
            </Tarjeta>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-titulo-seccion font-semibold">Asignadas</h2>
          <ChipsFiltro
            etiqueta="Ver inspecciones"
            opciones={[
              { href: RUTA, texto: "Próximas", cantidad: conteo.PENDIENTE, activa: !verFinalizadas },
              {
                href: `${RUTA}?vista=finalizadas`,
                texto: "Finalizadas",
                cantidad: conteo.FINALIZADA + conteo.CANCELADA,
                activa: verFinalizadas,
              },
            ]}
          />
        </div>
        <TablaInspecciones
          inspecciones={inspecciones}
          vacio={verFinalizadas ? "Aún no has finalizado inspecciones." : "No tienes inspecciones pendientes."}
          pie={
            <Paginacion page={meta.page} pageSize={meta.pageSize} total={meta.total} parametros={parametros} ruta={RUTA} />
          }
        />
      </section>
    </>
  );
}
