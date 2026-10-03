import Link from "next/link";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { clasesBoton } from "@/components/ui/Boton";
import { FiltroBusqueda } from "@/components/ui/FiltrosUrl";
import { Icono } from "@/components/ui/Icono";
import { Paginacion } from "@/components/ui/Paginacion";
import { PanelLateral } from "@/components/ui/PanelLateral";
import { CeldaFlecha, CeldaPrincipal, Tabla } from "@/components/ui/Tabla";
import { FormularioPropietario } from "@/features/personas/components/FormularioPropietario";
import { plural } from "@/lib/formato";
import { aplanarParametros, urlCon, type ParametrosBusqueda } from "@/lib/url";
import { propietariosFiltroSchema } from "@/schemas/propietarios";
import { exigirRol } from "@/server/auth/sesion";
import { listarPropietarios } from "@/server/services/propietarios.service";

const RUTA = "/dashboard/propietarios";

export default async function PaginaPropietarios({
  searchParams,
}: {
  searchParams: Promise<ParametrosBusqueda>;
}) {
  await exigirRol("ADMIN");

  // El panel lateral se abre con la URL: ?nuevo=1 para registrar, ?ver=ID para editar.
  const { nuevo, ver, ...parametros } = aplanarParametros(await searchParams);
  const filtro = propietariosFiltroSchema.catch(propietariosFiltroSchema.parse({})).parse(parametros);
  const { data: propietarios, meta } = await listarPropietarios(filtro);

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
      </div>

      <Tabla
        encabezados={["Nombre", "Correo", "Teléfono", "Inmuebles"]}
        vacio={
          propietarios.length === 0 &&
          (filtro.search ? "Ningún propietario coincide con la búsqueda." : "Aún no hay propietarios registrados.")
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
