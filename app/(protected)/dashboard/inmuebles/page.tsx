import Link from "next/link";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { Badge } from "@/components/ui/Badge";
import { clasesBoton } from "@/components/ui/Boton";
import { FiltroBusqueda, FiltroSeleccion } from "@/components/ui/FiltrosUrl";
import { Icono } from "@/components/ui/Icono";
import { Paginacion } from "@/components/ui/Paginacion";
import { CeldaFlecha, CeldaPrincipal, Tabla } from "@/components/ui/Tabla";
import { plural } from "@/lib/formato";
import { aplanarParametros, type ParametrosBusqueda } from "@/lib/url";
import { ETIQUETA_TIPO_INMUEBLE, TIPOS_INMUEBLE, inmueblesFiltroSchema } from "@/schemas/inmuebles";
import { exigirActor } from "@/server/auth/sesion";
import { contarInmueblesActivos, listarInmuebles } from "@/server/services/inmuebles.service";

const OPCIONES_TIPO = [
  { valor: "", texto: "Todos los tipos" },
  ...TIPOS_INMUEBLE.map((tipo) => ({ valor: tipo, texto: ETIQUETA_TIPO_INMUEBLE[tipo] })),
];

const OPCIONES_ESTADO = [
  { valor: "true", texto: "Activos" },
  { valor: "false", texto: "Inactivos" },
  { valor: "todos", texto: "Todos" },
];

export default async function PaginaInmuebles({
  searchParams,
}: {
  searchParams: Promise<ParametrosBusqueda>;
}) {
  const actor = await exigirActor();
  const esAdmin = actor.rol === "ADMIN";
  const parametros = aplanarParametros(await searchParams);

  // Por defecto se muestran los activos; "todos" quita el filtro.
  const estado = parametros.activo ?? "true";
  const filtro = inmueblesFiltroSchema
    .catch(inmueblesFiltroSchema.parse({}))
    .parse({ ...parametros, activo: estado === "todos" ? undefined : estado });

  const [{ data: inmuebles, meta }, activos] = await Promise.all([
    listarInmuebles(filtro),
    esAdmin ? contarInmueblesActivos() : Promise.resolve(0),
  ]);

  const hayFiltros = Boolean(filtro.search || filtro.tipo || estado !== "true");

  return (
    <>
      <EncabezadoPagina
        titulo="Inmuebles"
        descripcion={
          esAdmin
            ? `${plural(activos, "inmueble activo", "inmuebles activos")} en tu inmobiliaria`
            : "Inmuebles de tus inspecciones asignadas"
        }
        acciones={
          esAdmin && (
            <Link href="/dashboard/inmuebles/nuevo" className={clasesBoton()}>
              <Icono nombre="mas" />
              Registrar inmueble
            </Link>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <FiltroBusqueda placeholder="Buscar por código, dirección o barrio" etiqueta="Buscar inmuebles" />
        <FiltroSeleccion parametro="tipo" etiqueta="Tipo" opciones={OPCIONES_TIPO} />
        {esAdmin && (
          <FiltroSeleccion parametro="activo" etiqueta="Estado" opciones={OPCIONES_ESTADO} porDefecto="true" />
        )}
      </div>

      <Tabla
        encabezados={esAdmin ? ["Inmueble", "Tipo", "Ciudad", "Propietario", "Estado"] : ["Inmueble", "Tipo", "Ciudad", "Estado"]}
        vacio={
          inmuebles.length === 0 &&
          (hayFiltros
            ? "Ningún inmueble coincide con la búsqueda."
            : esAdmin
              ? "Aún no hay inmuebles. Registra el primero con el botón de arriba."
              : "Todavía no tienes inspecciones asignadas.")
        }
        pie={
          <Paginacion
            page={meta.page}
            pageSize={meta.pageSize}
            total={meta.total}
            parametros={parametros}
            ruta="/dashboard/inmuebles"
          />
        }
      >
        {inmuebles.map((inmueble) => (
          <tr key={inmueble.id}>
            <CeldaPrincipal
              href={`/dashboard/inmuebles/${inmueble.id}`}
              titulo={inmueble.codigo}
              subtitulo={[inmueble.direccion, inmueble.barrio].filter(Boolean).join(", ")}
            />
            <td className="solo-escritorio">{ETIQUETA_TIPO_INMUEBLE[inmueble.tipo]}</td>
            <td className="solo-escritorio">{inmueble.ciudad}</td>
            {esAdmin && <td className="solo-escritorio">{inmueble.propietario?.nombre ?? "—"}</td>}
            <td className="a-la-derecha">
              <Badge tono={inmueble.activo ? "activo" : "inactivo"}>
                {inmueble.activo ? "Activo" : "Inactivo"}
              </Badge>
            </td>
            <CeldaFlecha />
          </tr>
        ))}
      </Tabla>
    </>
  );
}
