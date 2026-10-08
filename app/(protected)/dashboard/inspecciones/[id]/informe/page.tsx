import Link from "next/link";
import { redirect } from "next/navigation";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { Marca } from "@/components/layout/Marca";
import { Aviso } from "@/components/ui/Aviso";
import { Badge } from "@/components/ui/Badge";
import { clasesBoton } from "@/components/ui/Boton";
import { ListaDatos } from "@/components/ui/ListaDatos";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { PanelLateral } from "@/components/ui/PanelLateral";
import { BotonGenerarInforme, EnlaceDescarga } from "@/features/informes/components/AccionesInforme";
import { SelectorFotosInforme, type GrupoDeFotos } from "@/features/informes/components/SelectorFotosInforme";
import { aplanarParametros, type ParametrosBusqueda } from "@/lib/url";
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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<ParametrosBusqueda>;
}) {
  const { id } = await params;
  const { generar } = aplanarParametros(await searchParams);
  const [actor, inspeccion] = await Promise.all([exigirActor(), cargarInspeccion(id)]);
  const ruta = `/dashboard/inspecciones/${inspeccion.id}`;
  const rutaInforme = `${ruta}/informe`;

  // El informe solo existe para inspecciones cerradas con éxito.
  if (inspeccion.estado !== "FINALIZADA") redirect(ruta);

  const [{ data: detalles }, informes] = await Promise.all([
    listarDetalles(inspeccion.id),
    listarInformesDeInspeccion(inspeccion.id),
  ]);
  const ultimo = informes[0];
  const tipo = ETIQUETA_TIPO_INSPECCION[inspeccion.tipo];

  // Fotos agrupadas espacio → elemento, igual que saldrán en el PDF.
  const gruposDeFotos: GrupoDeFotos[] = [];
  for (const detalle of detalles) {
    if (detalle.evidencias.length === 0) continue;
    let grupo = gruposDeFotos.find((candidato) => candidato.espacio === detalle.espacioNombre);
    if (!grupo) {
      grupo = { espacio: detalle.espacioNombre, elementos: [] };
      gruposDeFotos.push(grupo);
    }
    grupo.elementos.push({ nombre: detalle.elementoNombre, fotoIds: detalle.evidencias.map(({ id }) => id) });
  }
  const hayFotos = gruposDeFotos.length > 0;

  // Con fotos, "generar" abre primero el panel para elegir cuáles van en el
  // informe. Sin fotos no hay nada que elegir y se genera de una vez.
  const accionGenerar = (yaTieneInforme: boolean) =>
    hayFotos ? (
      <Link
        href={`${rutaInforme}?generar=1`}
        scroll={false}
        className={clasesBoton({ variante: yaTieneInforme ? "secundario" : "primario" })}
      >
        {yaTieneInforme ? "Generar nueva versión" : "Generar informe PDF"}
      </Link>
    ) : (
      <BotonGenerarInforme inspeccionId={inspeccion.id} yaTieneInforme={yaTieneInforme} />
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
              accionGenerar(false)
            )}
          </>
        }
      />

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_360px]">
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

          {hayFotos && (
            <div className="flex flex-col gap-3">
              <h3 className="text-cuerpo-sm font-medium">Evidencias fotográficas</h3>
              {gruposDeFotos.map((grupo) => (
                <section key={grupo.espacio} className="flex flex-col gap-2">
                  <h4 className="border-b border-borde pb-1 text-cuerpo-sm font-semibold">{grupo.espacio}</h4>
                  {grupo.elementos.map((elemento) => (
                    <div key={elemento.nombre} className="flex flex-col gap-1.5">
                      <span className="text-pequeno font-medium text-texto-secundario">{elemento.nombre}</span>
                      <div className="flex flex-wrap gap-2">
                        {elemento.fotoIds.map((fotoId, indice) => (
                          // eslint-disable-next-line @next/next/no-img-element -- enlace privado que vence; next/image no puede optimizarlo
                          <img
                            key={fotoId}
                            src={`/api/v1/evidencias/${fotoId}/acceso?redirigir=1`}
                            alt={`Foto ${indice + 1} de ${elemento.nombre} (${grupo.espacio})`}
                            loading="lazy"
                            className="size-[72px] rounded-lg bg-sutil object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              ))}
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
            {ultimo && accionGenerar(true)}
            <p className="text-pequeno font-medium text-texto-tenue">
              El PDF se guarda de forma privada. Solo pueden descargarlo usuarios autorizados de tu
              inmobiliaria.
            </p>
          </div>
        </Tarjeta>
      </div>

      {generar && hayFotos && (
        <PanelLateral titulo="Fotos del informe" hrefCerrar={rutaInforme}>
          <SelectorFotosInforme inspeccionId={inspeccion.id} grupos={gruposDeFotos} hrefCerrar={rutaInforme} />
        </PanelLateral>
      )}
    </>
  );
}
