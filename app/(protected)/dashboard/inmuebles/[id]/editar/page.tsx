import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { cargarInmueble } from "@/features/inmuebles/cargar";
import { BotonEstadoInmueble } from "@/features/inmuebles/components/BotonEstadoInmueble";
import { FormularioInmueble } from "@/features/inmuebles/components/FormularioInmueble";
import { exigirRol } from "@/server/auth/sesion";
import { listarOpcionesPropietario } from "@/server/services/propietarios.service";

// Título de la pestaña del navegador.
export const metadata = { title: "Editar inmueble" };

export default async function PaginaInmuebleEditar({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirRol("ADMIN");
  const { id } = await params;
  const [inmueble, propietarios] = await Promise.all([cargarInmueble(id), listarOpcionesPropietario()]);

  return (
    <div className="flex max-w-[880px] flex-col gap-6">
      <EncabezadoPagina
        titulo={`Editar ${inmueble.codigo}`}
        volver={{ href: `/dashboard/inmuebles/${inmueble.id}`, etiqueta: inmueble.codigo }}
        acciones={<BotonEstadoInmueble inmuebleId={inmueble.id} activo={inmueble.activo} />}
      />
      <FormularioInmueble propietarios={propietarios} inmueble={inmueble} />
    </div>
  );
}
