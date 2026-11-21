import { Aviso } from "@/components/ui/Aviso";
import { cargarInmueble } from "@/features/inmuebles/cargar";
import { EditorInventario } from "@/features/inventario/components/EditorInventario";
import { leerDeSpring } from "@/lib/api/servidor";
import type { Espacio } from "@/schemas/inventario";
import { exigirActor } from "@/server/auth/sesion";

// Título de la pestaña del navegador.
export const metadata = { title: "Inventario" };

export default async function PaginaInmuebleInventario({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [actor, inmueble] = await Promise.all([exigirActor(), cargarInmueble(id)]);
  const { data: espacios } = await leerDeSpring<{ data: Espacio[] }>(`inmuebles/${inmueble.id}/espacios`);

  return (
    <>
      <Aviso>
        Los cambios aplican a las inspecciones que se programen desde ahora. Las inspecciones ya
        creadas conservan su propia copia del inventario.
      </Aviso>
      {/* editable solo cambia lo que se muestra; la API valida el rol igual. */}
      <EditorInventario inmuebleId={inmueble.id} espacios={espacios} editable={actor.rol === "ADMIN"} />
    </>
  );
}
