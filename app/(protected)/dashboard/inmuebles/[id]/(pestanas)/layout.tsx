import Link from "next/link";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { Pestanas } from "@/components/layout/Pestanas";
import { Badge } from "@/components/ui/Badge";
import { clasesBoton } from "@/components/ui/Boton";
import { cargarInmueble } from "@/features/inmuebles/cargar";
import { ETIQUETA_TIPO_INMUEBLE } from "@/schemas/inmuebles";
import { exigirActor } from "@/server/auth/sesion";

// Encabezado y pestañas compartidos por Resumen, Inventario e Historial.
// Está en el grupo (pestanas) para que /editar, que vive al lado, NO los herede.
// Al cambiar de pestaña este layout no se vuelve a renderizar: solo cambia {children}.
export default async function LayoutInmueble({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [actor, inmueble] = await Promise.all([exigirActor(), cargarInmueble(id)]);
  const base = `/dashboard/inmuebles/${inmueble.id}`;

  const ubicacion = [inmueble.direccion, inmueble.barrio, inmueble.ciudad].filter(Boolean).join(", ");

  return (
    <>
      <EncabezadoPagina
        titulo={inmueble.codigo}
        descripcion={`${ETIQUETA_TIPO_INMUEBLE[inmueble.tipo]} · ${ubicacion}`}
        volver={{ href: "/dashboard/inmuebles", etiqueta: "Inmuebles" }}
        junto={
          <Badge tono={inmueble.activo ? "activo" : "inactivo"}>
            {inmueble.activo ? "Activo" : "Inactivo"}
          </Badge>
        }
        acciones={
          actor.rol === "ADMIN" && (
            <>
              <Link href={`${base}/editar`} className={clasesBoton({ variante: "secundario" })}>
                Editar
              </Link>
              {inmueble.activo && (
                <Link
                  href={`/dashboard/inspecciones/nueva?inmuebleId=${inmueble.id}`}
                  className={clasesBoton()}
                >
                  Programar inspección
                </Link>
              )}
            </>
          )
        }
      />
      <Pestanas
        etiqueta="Secciones del inmueble"
        pestanas={[
          { href: base, texto: "Resumen" },
          { href: `${base}/inventario`, texto: "Inventario" },
          { href: `${base}/historial`, texto: "Historial" },
        ]}
      />
      {children}
    </>
  );
}
