import Link from "next/link";
import { redirect } from "next/navigation";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { Marca } from "@/components/layout/Marca";
import { Aviso } from "@/components/ui/Aviso";
import { Badge } from "@/components/ui/Badge";
import { clasesBoton } from "@/components/ui/Boton";
import { ListaDatos } from "@/components/ui/ListaDatos";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { BotonGenerarInforme, EnlaceDescarga } from "@/features/informes/components/AccionesInforme";
import { cargarInspeccion } from "@/features/inspecciones/cargar";
import { EstadoElementoTexto } from "@/features/inspecciones/components/realizar/SelectorEstado";
import { formatearFechaHora } from "@/lib/formato";
import { ETIQUETA_TIPO_INSPECCION } from "@/lib/inspecciones";
import { codigoDeInforme } from "@/schemas/informes";
import { exigirActor } from "@/server/auth/sesion";
import { listarInformesDeInspeccion } from "@/server/services/informes.service";
import { listarDetalles } from "@/server/services/inspecciones.service";

export default async function PaginaInspeccionInforme({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [actor, inspeccion] = await Promise.all([exigirActor(), cargarInspeccion(id)]);
  const ruta = `/dashboard/inspecciones/${inspeccion.id}`;

  // El informe solo existe para inspecciones cerradas con éxito.
  if (inspeccion.estado !== "FINALIZADA") redirect(ruta);

  const [{ data: detalles }, informes] = await Promise.all([
    listarDetalles(inspeccion.id),
    listarInformesDeInspeccion(inspeccion.id),
  ]);
  const ultimo = informes[0];
  const tipo = ETIQUETA_TIPO_INSPECCION[inspeccion.tipo];
  const fotos = detalles.flatMap((detalle) =>
    detalle.evidencias.map((evidencia) => ({ ...evidencia, titulo: `${detalle.espacioNombre} · ${detalle.elementoNombre}` })),
  );

  return (
    <>
      <EncabezadoPagina
        titulo={`Informe de ${inspeccion.inmueble.codigo} · ${tipo}`}
        descripcion={`Inspección finalizada el ${formatearFechaHora(inspeccion.finalizadaEn ?? inspeccion.programadaPara)} por ${inspeccion.inspector?.nombre ?? "—"}`}
        volver={{ href: "/dashboard/informes", etiqueta: "Informes" }}
        junto={<Badge tono="finalizada">Finalizada</Badge>}
        acciones={
          <>
            {inspeccion.tipo === "SALIDA" && (
              <Link href={`${ruta}/comparar`} className={clasesBoton({ variante: "secundario" })}>
                Comparar con la entrada
              </Link>
            )}
            {ultimo ? (
              <EnlaceDescarga informeId={ultimo.id} etiqueta={`Descargar PDF versión ${ultimo.version}`} conTexto />
            ) : (
              <BotonGenerarInforme inspeccionId={inspeccion.id} yaTieneInforme={false} />
            )}
          </>
        }
      />

      <div className="grid items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_360px]">
        <article
          aria-label="Vista previa del informe"
          className="flex flex-col gap-5 rounded-xl border border-borde bg-tarjeta p-5 shadow-tarjeta sm:p-10"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Marca />
            {ultimo && (
              <span className="text-pequeno font-medium text-texto-tenue">
                {codigoDeInforme(ultimo.id, ultimo.generadoEn)} · Versión {ultimo.version}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-titulo-movil font-semibold">Acta de inspección de {tipo.toLowerCase()}</h2>
            <p className="text-cuerpo-sm text-texto-secundario">{actor.organizacion.nombre}</p>
          </div>
          <ListaDatos
            columnas={2}
            datos={[
              { etiqueta: "Inmueble", valor: `${inspeccion.inmueble.codigo} · ${inspeccion.inmueble.direccion}` },
              { etiqueta: "Inspector", valor: inspeccion.inspector?.nombre ?? "—" },
              { etiqueta: "Fecha programada", valor: formatearFechaHora(inspeccion.programadaPara) },
              { etiqueta: "Finalizada", valor: formatearFechaHora(inspeccion.finalizadaEn ?? inspeccion.programadaPara) },
            ]}
          />

          <div className="flex flex-col gap-2">
            <h3 className="text-cuerpo-sm font-medium">Resultado por elemento</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-borde-fuerte text-left text-texto-secundario">
                    <th className="px-2 py-1.5 font-medium">Espacio</th>
                    <th className="px-2 py-1.5 font-medium">Elemento</th>
                    <th className="px-2 py-1.5 font-medium">Estado</th>
                    <th className="px-2 py-1.5 font-medium">Observación</th>
                  </tr>
                </thead>
                <tbody>
                  {detalles.map((detalle) => (
                    <tr key={detalle.id} className="border-b border-borde align-top">
                      <td className="px-2 py-1.5">{detalle.espacioNombre}</td>
                      <td className="px-2 py-1.5">{detalle.elementoNombre}</td>
                      <td className="px-2 py-1.5">
                        <EstadoElementoTexto estado={detalle.estado} />
                      </td>
                      <td className="px-2 py-1.5">{detalle.observacion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {fotos.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-cuerpo-sm font-medium">Evidencias</h3>
              <div className="flex flex-wrap gap-2">
                {fotos.map((foto) => (
                  // eslint-disable-next-line @next/next/no-img-element -- enlace privado que vence; next/image no puede optimizarlo
                  <img
                    key={foto.id}
                    src={`/api/v1/evidencias/${foto.id}/acceso?redirigir=1`}
                    alt={`Foto de ${foto.titulo}`}
                    title={foto.titulo}
                    loading="lazy"
                    className="size-[72px] rounded-lg bg-sutil object-cover"
                  />
                ))}
              </div>
            </div>
          )}

          <p className="border-t border-borde pt-3 text-pequeno font-medium text-texto-tenue">
            Vista previa armada con los datos guardados al momento de la inspección. Las diferencias
            registradas no determinan responsabilidades.
          </p>
        </article>

        <Tarjeta relleno={false}>
          <h2 className="px-5 pt-5 pb-3 text-titulo-seccion font-semibold">Versiones</h2>
          {informes.length === 0 ? (
            <div className="px-5 pb-5">
              <Aviso>Aún no se ha generado el PDF de esta inspección.</Aviso>
            </div>
          ) : (
            <ul className="border-t border-borde">
              {informes.map((informe) => (
                <li key={informe.id} className="flex items-center gap-3 border-b border-borde px-5 py-3">
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-cuerpo-sm font-medium">Versión {informe.version}</span>
                    <span className="text-pequeno font-medium text-texto-tenue">
                      {formatearFechaHora(informe.generadoEn)} · {informe.generadoPor?.nombre ?? "—"}
                    </span>
                  </div>
                  <EnlaceDescarga informeId={informe.id} etiqueta={`Descargar versión ${informe.version}`} />
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-col gap-3 px-5 py-4">
            {ultimo && <BotonGenerarInforme inspeccionId={inspeccion.id} yaTieneInforme />}
            <p className="text-pequeno font-medium text-texto-tenue">
              El PDF se guarda de forma privada. Solo pueden descargarlo usuarios autorizados de tu
              inmobiliaria.
            </p>
          </div>
        </Tarjeta>
      </div>
    </>
  );
}
