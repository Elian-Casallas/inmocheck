"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { ListaDatos } from "@/components/ui/ListaDatos";
import { PanelCuerpo, PanelPie } from "@/components/ui/PanelLateral";
import { apiFetch, mensajeDeError } from "@/lib/api/client";
import { formatearFecha } from "@/lib/formato";
import type { Inspector } from "@/schemas/inspectores";

type Props = {
  inspector: Inspector;
  // La lista de inspecciones abiertas llega ya armada desde el servidor.
  children: ReactNode;
};

export function DetalleInspector({ inspector, children }: Props) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cambiarEstado() {
    setEnviando(true);
    setError(null);
    try {
      await apiFetch(`/inspectores/${inspector.id}`, {
        method: "PATCH",
        body: JSON.stringify({ activo: !inspector.activo }),
      });
      router.refresh();
    } catch (causa) {
      setError(mensajeDeError(causa));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <PanelCuerpo>
        {error && <Aviso tipo="error">{error}</Aviso>}
        <ListaDatos
          datos={[
            { etiqueta: "Correo", valor: inspector.email },
            {
              etiqueta: "Estado",
              valor: `${inspector.activo ? "Activo" : "Inactivo"} · registrado el ${formatearFecha(inspector.createdAt)}`,
            },
          ]}
        />
        <div className="flex flex-col gap-2">
          <span className="text-cuerpo-sm font-medium">Inspecciones abiertas</span>
          <div className="overflow-hidden rounded-xl border border-borde [&_li:first-child]:border-t-0">
            {children}
          </div>
        </div>
        <Aviso>
          Si desactivas la cuenta, sus inspecciones pasadas se conservan. Reasigna antes las que estén
          abiertas.
        </Aviso>
      </PanelCuerpo>
      <PanelPie>
        <Boton variante={inspector.activo ? "peligro" : "secundario"} onClick={cambiarEstado} cargando={enviando}>
          {inspector.activo ? "Desactivar cuenta" : "Reactivar cuenta"}
        </Boton>
      </PanelPie>
    </>
  );
}
