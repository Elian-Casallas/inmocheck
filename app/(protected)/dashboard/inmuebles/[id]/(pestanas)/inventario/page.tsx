import { Aviso } from "@/components/ui/Aviso";
import { cargarInmueble } from "@/features/inmuebles/cargar";
import { EditorInventario } from "@/features/inventario/components/EditorInventario";
import { exigirActor } from "@/server/auth/sesion";
import { listarEspacios } from "@/server/services/inventario.service";

export default async function PaginaInmuebleInventario({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [actor, inmueble] = await Promise.all([exigirActor(), cargarInmueble(id)]);
  const espacios = await listarEspacios(inmueble.id);

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
