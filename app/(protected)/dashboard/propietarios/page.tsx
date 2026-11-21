import Link from "next/link";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { clasesBoton } from "@/components/ui/Boton";
import { FiltroBusqueda, FiltroSeleccion } from "@/components/ui/FiltrosUrl";
import { Icono } from "@/components/ui/Icono";
import { Paginacion } from "@/components/ui/Paginacion";
import { PanelLateral } from "@/components/ui/PanelLateral";
import { CeldaFlecha, CeldaPrincipal, Tabla } from "@/components/ui/Tabla";
import { FormularioPropietario } from "@/features/personas/components/FormularioPropietario";
import { plural } from "@/lib/formato";
import { aplanarParametros, urlCon, type ParametrosBusqueda } from "@/lib/url";
import { leerDeSpring } from "@/lib/api/servidor";
import type { Paginado } from "@/schemas/comun";
import { propietariosFiltroSchema, type Propietario, type PropietariosFiltro } from "@/schemas/propietarios";
import { exigirRol } from "@/server/auth/sesion";

// Título de la pestaña del navegador.
export const metadata = { title: "Propietarios" };

const RUTA = "/dashboard/propietarios";

const OPCIONES_INMUEBLES = [
  { valor: "", texto: "Todos" },
  { valor: "con", texto: "Con inmuebles" },
  { valor: "sin", texto: "Sin inmuebles" },
];

export default async function PaginaPropietarios({
  searchParams,
}: {
  searchParams: Promise<ParametrosBusqueda>;
}) {
  await exigirRol("ADMIN");

  // El panel lateral se abre con la URL: ?nuevo=1 para registrar, ?ver=ID para editar.
  const { nuevo, ver, ...parametros } = aplanarParametros(await searchParams);
  const filtro = propietariosFiltroSchema.catch(propietariosFiltroSchema.parse({})).parse(parametros);
  const { data: propietarios, meta } = await leerDeSpring<Paginado<Propietario>>("propietarios", aParametros(filtro));

  const hrefCerrar = urlCon(RUTA, parametros, {});
  const seleccionado = ver ? propietarios.find((propietario) => propietario.id === ver) : undefined;

  return (
    <>
      <EncabezadoPagina
        titulo="Propietarios"
        descripcion="Personas registradas como dueñas de los inmuebles. No tienen acceso a la aplicación."
        acciones={
          <Link href={urlCon(RUTA, parametros, { nuevo: "1" })} scroll={false} className={clasesBoton()}>
            <Icono nombre="mas" />
            Registrar propietario
          </Link>
        }
      />

      <div className="flex flex-wrap gap-3">
        <FiltroBusqueda placeholder="Buscar por nombre o correo" etiqueta="Buscar propietarios" />
        <FiltroSeleccion parametro="inmuebles" etiqueta="Inmuebles" opciones={OPCIONES_INMUEBLES} />
      </div>

      <Tabla
        encabezados={["Nombre", "Correo", "Teléfono", "Inmuebles"]}
        vacio={
          propietarios.length === 0 &&
          (filtro.search || filtro.inmuebles
            ? "Ningún propietario coincide con los filtros."
            : "Aún no hay propietarios registrados.")
        }
        pie={
          <Paginacion page={meta.page} pageSize={meta.pageSize} total={meta.total} parametros={parametros} ruta={RUTA} />
        }
      >
        {propietarios.map((propietario) => (
          <tr key={propietario.id}>
            <CeldaPrincipal
              href={urlCon(RUTA, parametros, { ver: propietario.id })}
              titulo={propietario.nombre}
            />
            <td className="solo-escritorio">{propietario.email ?? "—"}</td>
            <td className="solo-escritorio">{propietario.telefono ?? "—"}</td>
            <td className="a-la-derecha">{plural(propietario.inmuebles.length, "inmueble")}</td>
            <CeldaFlecha />
          </tr>
        ))}
      </Tabla>

      {nuevo && (
        <PanelLateral titulo="Registrar propietario" hrefCerrar={hrefCerrar}>
          <FormularioPropietario hrefCerrar={hrefCerrar} />
        </PanelLateral>
      )}
      {seleccionado && (
        <PanelLateral titulo={seleccionado.nombre} hrefCerrar={hrefCerrar}>
          {/* key: al pasar de un propietario a otro el formulario se reinicia. */}
          <FormularioPropietario key={seleccionado.id} hrefCerrar={hrefCerrar} propietario={seleccionado} />
        </PanelLateral>
      )}
    </>
  );
}

// El filtro ya validado, como ?page=&pageSize=&search=&inmuebles= para Spring.
function aParametros(filtro: PropietariosFiltro): URLSearchParams {
  const parametros = new URLSearchParams({ page: String(filtro.page), pageSize: String(filtro.pageSize) });
  if (filtro.search) parametros.set("search", filtro.search);
  if (filtro.inmuebles) parametros.set("inmuebles", filtro.inmuebles);
  return parametros;
}
