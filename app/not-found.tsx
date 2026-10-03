import Link from "next/link";
import { PantallaError } from "@/components/layout/PantallaError";
import { clasesBoton } from "@/components/ui/Boton";

export default function PaginaNoEncontrada() {
  return (
    <PantallaError
      codigo="404"
      titulo="No encontramos esta página"
      texto="Puede que el enlace esté mal escrito o que el registro no exista."
    >
      <Link href="/dashboard" className={clasesBoton({ bloque: true })}>
        Volver al inicio
      </Link>
    </PantallaError>
  );
}
