import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { FiltroBusqueda, FiltroSeleccion } from "@/components/ui/FiltrosUrl";
import { Paginacion } from "@/components/ui/Paginacion";
import { CeldaPrincipal, Tabla } from "@/components/ui/Tabla";
import { EnlaceDescarga } from "@/features/informes/components/AccionesInforme";
import { formatearFechaHora } from "@/lib/formato";
import { ETIQUETA_TIPO_INSPECCION, TIPOS_INSPECCION } from "@/lib/inspecciones";
import { aplanarParametros, type ParametrosBusqueda } from "@/lib/url";
import { informesFiltroSchema } from "@/schemas/informes";
import { exigirActor } from "@/server/auth/sesion";
import { listarInformes } from "@/server/services/informes.service";

// Título de la pestaña del navegador.
export const metadata = { title: "Informes" };

const RUTA = "/dashboard/informes";

const OPCIONES_TIPO = [
  { valor: "", texto: "Todos los tipos" },
  ...TIPOS_INSPECCION.map((tipo) => ({ valor: tipo, texto: ETIQUETA_TIPO_INSPECCION[tipo] })),
];

export default async function PaginaInformes({
  searchParams,
}: {
  searchParams: Promise<ParametrosBusqueda>;
}) {
  const actor = await exigirActor();
  const parametros = aplanarParametros(await searchParams);
  const filtro = informesFiltroSchema.catch(informesFiltroSchema.parse({})).parse(parametros);

  // La misma consulta sirve para los dos roles: RLS decide qué ve cada uno
  // (el admin, los de su organización; el inspector, los de sus inspecciones).
  const { data: informes, meta } = await listarInformes(filtro);
  const hayFiltros = Boolean(filtro.search || filtro.tipo);

  return (
    <>
      <EncabezadoPagina
        titulo="Informes"
        descripcion={
          actor.rol === "ADMIN"
            ? "Actas en PDF generadas a partir de inspecciones finalizadas."
            : "Actas de las inspecciones que realizaste."
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <FiltroBusqueda placeholder="Buscar por código o dirección del inmueble" etiqueta="Buscar informes" />
        <FiltroSeleccion parametro="tipo" etiqueta="Tipo de inspección" opciones={OPCIONES_TIPO} />
      </div>

      <Tabla
        encabezados={["Inmueble", "Tipo", "Versión", "Generado", "Generado por"]}
        vacio={
          informes.length === 0 &&
          (hayFiltros
            ? "Ningún informe coincide con la búsqueda."
            : "Aún no hay informes. Se generan desde una inspección finalizada.")
        }
        pie={
          <Paginacion page={meta.page} pageSize={meta.pageSize} total={meta.total} parametros={parametros} ruta={RUTA} />
        }
      >
        {informes.map((informe) => (
          <tr key={informe.id}>
            <CeldaPrincipal
              href={`/dashboard/inspecciones/${informe.inspeccionId}/informe`}
              titulo={informe.inspeccion?.inmueble?.codigo ?? "Inmueble"}
              subtitulo={informe.inspeccion?.inmueble?.direccion}
            />
            <td>{informe.inspeccion ? ETIQUETA_TIPO_INSPECCION[informe.inspeccion.tipo] : "—"}</td>
            <td className="solo-escritorio">Versión {informe.version}</td>
            <td>{formatearFechaHora(informe.generadoEn)}</td>
            <td className="solo-escritorio">{informe.generadoPor?.nombre ?? "—"}</td>
            {/* relative z-10: queda por encima del enlace que cubre toda la fila. */}
            <td className="a-la-derecha relative z-10 w-10">
              <EnlaceDescarga
                informeId={informe.id}
                etiqueta={`Descargar PDF de ${informe.inspeccion?.inmueble?.codigo ?? "la inspección"}`}
              />
            </td>
          </tr>
        ))}
      </Tabla>
    </>
  );
}
