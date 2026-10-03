"use client";

import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";

// error.tsx atrapa los errores de las páginas de /dashboard. Debe ser
// componente cliente porque el botón "Reintentar" necesita el navegador.
export default function ErrorDashboard({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-start gap-4">
      <Aviso tipo="error">No pudimos cargar esta pantalla. Revisa tu conexión e intenta de nuevo.</Aviso>
      <Boton variante="secundario" onClick={reset}>
        Reintentar
      </Boton>
    </div>
  );
}
