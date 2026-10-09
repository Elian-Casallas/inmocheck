import Link from "next/link";
import { BotonCerrarSesion } from "@/components/layout/BotonCerrarSesion";
import { PantallaError } from "@/components/layout/PantallaError";
import { clasesBoton } from "@/components/ui/Boton";

// Título de la pestaña del navegador.
export const metadata = { title: "Sin permiso" };

export default function PaginaSinPermiso() {
  return (
    <PantallaError
      codigo="403"
      titulo="No tienes permiso para ver esto"
      texto="Tu cuenta no tiene acceso a esta sección. Si crees que es un error, habla con el administrador de tu inmobiliaria."
    >
      <Link href="/dashboard" className={clasesBoton({ bloque: true })}>
        Volver al inicio
      </Link>
      <BotonCerrarSesion />
    </PantallaError>
  );
}
