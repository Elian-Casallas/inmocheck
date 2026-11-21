"use client";

import Link from "next/link";
import { PantallaError } from "@/components/layout/PantallaError";
import { Boton, clasesBoton } from "@/components/ui/Boton";

// Atrapa los errores que dashboard/error.tsx no alcanza: los del layout
// protegido. Ahí se pregunta a Spring quién es el usuario (exigirActor), así
// que si Spring no responde, esta es la pantalla que se ve, en vez de la
// genérica de Next.js en inglés.
// Debe ser componente cliente porque "Reintentar" necesita el navegador.
// retry() vuelve a pedir la pantalla al servidor (Next.js 16).
export default function ErrorGeneral({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <PantallaError
      codigo="500"
      titulo="No pudimos cargar InmoCheck"
      texto="El servicio no responde en este momento. Tus datos están a salvo; intenta de nuevo en unos segundos."
    >
      <Boton bloque onClick={() => retry()}>
        Reintentar
      </Boton>
      <Link href="/login" className={clasesBoton({ variante: "secundario", bloque: true })}>
        Ir a iniciar sesión
      </Link>
    </PantallaError>
  );
}
