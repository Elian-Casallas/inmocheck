import Link from "next/link";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { Badge } from "@/components/ui/Badge";
import { clasesBoton } from "@/components/ui/Boton";
import { FiltroBusqueda, FiltroSeleccion } from "@/components/ui/FiltrosUrl";
import { Icono } from "@/components/ui/Icono";
import { Paginacion } from "@/components/ui/Paginacion";
import { PanelLateral } from "@/components/ui/PanelLateral";
import { CeldaFlecha, CeldaPrincipal, Tabla } from "@/components/ui/Tabla";
import { ListaInspecciones } from "@/features/inspecciones/components/ListaInspecciones";
import { DetalleInspector } from "@/features/personas/components/DetalleInspector";
import { FormularioInvitarInspector } from "@/features/personas/components/FormularioInvitarInspector";
import { plural } from "@/lib/formato";
import { aplanarParametros, urlCon, type ParametrosBusqueda } from "@/lib/url";
import { inspectoresFiltroSchema } from "@/schemas/inspectores";
import { exigirRol } from "@/server/auth/sesion";
import { listarAbiertasDeInspector } from "@/server/repositories/inspecciones.repository";
import { listarInspectores } from "@/server/services/inspectores.service";

// Título de la pestaña del navegador.
export const metadata = { title: "Inspectores" };

const RUTA = "/dashboard/inspectores";

const OPCIONES_ESTADO = [
  { valor: "", texto: "Todos los estados" },
  { valor: "true", texto: "Activos" },
  { valor: "false", texto: "Inactivos" },
];

export default async function PaginaInspectores({
  searchParams,
}: {
  searchParams: Promise<ParametrosBusqueda>;
}) {
  await exigirRol("ADMIN");

  const { nuevo, ver, ...parametros } = aplanarParametros(await searchParams);
  const filtro = inspectoresFiltroSchema.catch(inspectoresFiltroSchema.parse({})).parse(parametros);
  const { data: inspectores, meta } = await listarInspectores(filtro);

  const hrefCerrar = urlCon(RUTA, parametros, {});
  const seleccionado = ver ? inspectores.find((inspector) => inspector.id === ver) : undefined;
  const abiertas = seleccionado ? await listarAbiertasDeInspector(seleccionado.id) : [];

  return (
    <>
      <EncabezadoPagina
        titulo="Inspectores"
        descripcion="Personas que realizan las inspecciones en campo."
        acciones={
          <Link href={urlCon(RUTA, parametros, { nuevo: "1" })} scroll={false} className={clasesBoton()}>
            <Icono nombre="mas" />
            Invitar inspector
          </Link>
        }
      />

      <div className="flex flex-wrap gap-3">
        <FiltroBusqueda placeholder="Buscar por nombre o correo" etiqueta="Buscar inspectores" />
        <FiltroSeleccion parametro="activo" etiqueta="Estado" opciones={OPCIONES_ESTADO} />
      </div>

      <Tabla
        encabezados={["Nombre", "Correo", "Inspecciones", "Estado"]}
        vacio={inspectores.length === 0 && "No hay inspectores que coincidan."}
        pie={
          <Paginacion page={meta.page} pageSize={meta.pageSize} total={meta.total} parametros={parametros} ruta={RUTA} />
        }
      >
        {inspectores.map((inspector) => (
          <tr key={inspector.id}>
            <CeldaPrincipal
              href={urlCon(RUTA, parametros, { ver: inspector.id })}
              titulo={inspector.nombre}
              subtitulo={inspector.email}
            />
            <td className="solo-escritorio">{inspector.email}</td>
            <td>{plural(inspector.inspeccionesAbiertas, "abierta")}</td>
            <td className="a-la-derecha">
              <Badge tono={inspector.activo ? "activo" : "inactivo"}>
                {inspector.activo ? "Activo" : "Inactivo"}
              </Badge>
            </td>
            <CeldaFlecha />
          </tr>
        ))}
      </Tabla>

      {nuevo && (
        <PanelLateral titulo="Invitar inspector" hrefCerrar={hrefCerrar}>
          <FormularioInvitarInspector hrefCerrar={hrefCerrar} />
        </PanelLateral>
      )}
      {seleccionado && (
        <PanelLateral titulo={seleccionado.nombre} hrefCerrar={hrefCerrar}>
          <DetalleInspector inspector={seleccionado}>
            <ListaInspecciones inspecciones={abiertas} mostrarInmueble vacio="No tiene inspecciones abiertas." />
          </DetalleInspector>
        </PanelLateral>
      )}
    </>
  );
}
