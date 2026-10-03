"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/ui/Boton";
import { apiFetch, mensajeDeError } from "@/lib/api/client";

type Props = {
  inmuebleId: string;
  activo: boolean;
};

// Desactivar no borra nada: el inmueble deja de aparecer para programar
// inspecciones, pero su historial se conserva.
export function BotonEstadoInmueble({ inmuebleId, activo }: Props) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cambiarEstado() {
    const mensaje = activo
      ? "¿Desactivar este inmueble? Su historial de inspecciones se conserva."
      : "¿Reactivar este inmueble?";
    if (!window.confirm(mensaje)) return;

    setEnviando(true);
    setError(null);
    try {
      if (activo) {
        await apiFetch(`/inmuebles/${inmuebleId}`, { method: "DELETE" });
      } else {
        await apiFetch(`/inmuebles/${inmuebleId}`, {
          method: "PATCH",
          body: JSON.stringify({ activo: true }),
        });
      }
      router.refresh();
    } catch (causa) {
      setError(mensajeDeError(causa));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Boton variante={activo ? "peligro" : "secundario"} onClick={cambiarEstado} cargando={enviando}>
        {activo ? "Desactivar inmueble" : "Reactivar inmueble"}
      </Boton>
      {error && (
        <span role="alert" className="max-w-xs text-right text-pequeno text-error">
          {error}
        </span>
      )}
    </div>
  );
}
