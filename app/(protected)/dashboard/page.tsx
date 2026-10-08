import Link from "next/link";
import { redirect } from "next/navigation";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { clasesBoton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { EnlaceDescarga } from "@/features/informes/components/AccionesInforme";
import { TablaInspecciones } from "@/features/inspecciones/components/TablaInspecciones";
import { RUTA_INICIO_POR_ROL, ZONA_HORARIA } from "@/lib/constantes";
import { formatearFecha } from "@/lib/formato";
import { ETIQUETA_TIPO_INSPECCION } from "@/lib/inspecciones";
import { exigirActor } from "@/server/auth/sesion";
import { obtenerResumen } from "@/server/services/dashboard.service";
import { listarInformesRecientes } from "@/server/services/informes.service";

const INFORMES_RECIENTES = 4;

export default async function PaginaDashboard() {
  const actor = await exigirActor();

  // El resumen es solo del administrador; el inspector va a su agenda.
  if (actor.rol !== "ADMIN") redirect(RUTA_INICIO_POR_ROL[actor.rol]);

  const [resumen, informes] = await Promise.all([obtenerResumen({}), listarInformesRecientes(INFORMES_RECIENTES)]);
  const mes = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: ZONA_HORARIA }).format(new Date());

  const indicadores = [
    { etiqueta: "Pendientes", valor: resumen.inspecciones.pendientes, punto: "bg-inspeccion-pendiente" },
    { etiqueta: "En proceso", valor: resumen.inspecciones.enProceso, punto: "bg-inspeccion-en-proceso" },
    { etiqueta: "Finalizadas", valor: resumen.inspecciones.finalizadas, punto: "bg-inspeccion-finalizada" },
    { etiqueta: "Inmuebles activos", valor: resumen.inmueblesActivos },
    { etiqueta: "Inspectores activos", valor: resumen.inspectoresActivos },
  ];

  return (
    <>
      <EncabezadoPagina
        titulo="Resumen"
        descripcion={`${actor.organizacion.nombre} · ${mes.charAt(0).toUpperCase()}${mes.slice(1)}`}
        acciones={
          <Link href="/dashboard/inspecciones/nueva" className={clasesBoton()}>
            <Icono nombre="mas" />
            Programar inspección
          </Link>
        }
      />

      <section aria-label="Indicadores" className="grid grid-cols-2 gap-4 sm:grid-cols-3 min-[1100px]:grid-cols-5">
        {indicadores.map(({ etiqueta, valor, punto }) => (
          <Tarjeta key={etiqueta} className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-cuerpo-sm text-texto-secundario">
              {punto && <span className={`size-2 rounded-full ${punto}`} aria-hidden="true" />}
              {etiqueta}
            </span>
            <span className="text-titulo-pantalla font-semibold">{valor}</span>
          </Tarjeta>
        ))}
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_360px]">
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-titulo-seccion font-semibold">Próximas inspecciones</h2>
            <Link href="/dashboard/inspecciones" className="text-cuerpo-sm font-medium text-primario hover:underline">
              Ver todas
            </Link>
          </div>
          <TablaInspecciones
            inspecciones={resumen.proximas}
            mostrarInspector
            vacio="No hay inspecciones pendientes ni en proceso."
          />
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-titulo-seccion font-semibold">Informes recientes</h2>
            <Link href="/dashboard/informes" className="text-cuerpo-sm font-medium text-primario hover:underline">
              Ver todos
            </Link>
          </div>
          <Tarjeta relleno={false}>
            {informes.length === 0 ? (
              <p className="px-5 py-6 text-cuerpo-sm text-texto-secundario">Aún no hay informes generados.</p>
            ) : (
              <ul>
                {informes.map((informe) => (
                  <li key={informe.id} className="flex items-center gap-3 border-t border-borde px-5 py-3 first:border-t-0">
                    <Link href={`/dashboard/inspecciones/${informe.inspeccionId}/informe`} className="flex flex-1 flex-col gap-0.5">
                      <span className="text-cuerpo-sm font-medium">
                        {informe.inspeccion?.inmueble?.codigo} ·{" "}
                        {informe.inspeccion ? ETIQUETA_TIPO_INSPECCION[informe.inspeccion.tipo] : ""}
                      </span>
                      <span className="text-pequeno font-medium text-texto-tenue">
                        Acta · {formatearFecha(informe.generadoEn)}
                      </span>
                    </Link>
                    <EnlaceDescarga
                      informeId={informe.id}
                      etiqueta={`Descargar PDF de ${informe.inspeccion?.inmueble?.codigo ?? "la inspección"}`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
        </section>
      </div>
    </>
  );
}
