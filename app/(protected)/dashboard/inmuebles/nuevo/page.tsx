import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { FormularioInmueble } from "@/features/inmuebles/components/FormularioInmueble";
import { exigirRol } from "@/server/auth/sesion";
import { listarOpcionesPropietario } from "@/server/services/propietarios.service";

// Título de la pestaña del navegador.
export const metadata = { title: "Registrar inmueble" };

export default async function PaginaInmuebleNuevo() {
  await exigirRol("ADMIN");
  // Las opciones del <select> se cargan en el servidor: RLS garantiza que
  // solo sean propietarios de la organización del administrador.
  const propietarios = await listarOpcionesPropietario();

  return (
    <div className="flex max-w-[880px] flex-col gap-6">
      <EncabezadoPagina
        titulo="Registrar inmueble"
        volver={{ href: "/dashboard/inmuebles", etiqueta: "Inmuebles" }}
      />
      <FormularioInmueble propietarios={propietarios} />
    </div>
  );
}
