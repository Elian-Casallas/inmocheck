import { Suspense } from "react";
import type { Metadata } from "next";
import { TarjetaAcceso } from "@/components/layout/TarjetaAcceso";
import { ProcesarEnlace } from "@/features/auth/components/ProcesarEnlace";

export const metadata: Metadata = { title: "Verificando enlace · InmoCheck" };

// Destino de los enlaces que llegan por correo (invitación y recuperación).
export default function PaginaEnlace() {
  return (
    <TarjetaAcceso>
      {/* useSearchParams() exige un Suspense alrededor del componente cliente. */}
      <Suspense>
        <ProcesarEnlace />
      </Suspense>
    </TarjetaAcceso>
  );
}
