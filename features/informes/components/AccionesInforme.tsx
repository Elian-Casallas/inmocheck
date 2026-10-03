"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import { apiFetch, mensajeDeError } from "@/lib/api/client";

type Props = {
  inspeccionId: string;
  yaTieneInforme: boolean;
};

// Genera el PDF. Si falla, se muestra el error y el botón queda listo para
// reintentar: la inspección no cambia.
export function BotonGenerarInforme({ inspeccionId, yaTieneInforme }: Props) {
  const router = useRouter();
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generar() {
    setGenerando(true);
    setError(null);
    try {
      await apiFetch(`/inspecciones/${inspeccionId}/informes`, { method: "POST", body: JSON.stringify({ tipo: "ACTA" }) });
      router.refresh();
    } catch (causa) {
      setError(mensajeDeError(causa));
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Boton
        variante={yaTieneInforme ? "secundario" : "primario"}
        onClick={generar}
        cargando={generando}
        textoCargando="Generando PDF…"
      >
        {yaTieneInforme ? "Generar nueva versión" : "Generar informe PDF"}
      </Boton>
      {error && (
        <span role="alert" className="max-w-xs text-right text-pequeno text-error">
          {error} {yaTieneInforme ? "" : "Puedes reintentar."}
        </span>
      )}
    </div>
  );
}

// Enlace normal a nuestra API: ella valida permisos y redirige al PDF firmado.
export function EnlaceDescarga({
  informeId,
  etiqueta,
  conTexto = false,
}: {
  informeId: string;
  etiqueta: string;
  conTexto?: boolean;
}) {
  return (
    <a
      href={`/api/v1/informes/${informeId}/descarga`}
      aria-label={etiqueta}
      className={
        conTexto
          ? "inline-flex h-12 items-center justify-center gap-2 rounded-boton bg-primario px-5 text-boton font-semibold whitespace-nowrap text-white hover:bg-primario-hover"
          : "grid size-10 place-items-center rounded-lg text-primario hover:bg-primario-suave"
      }
    >
      <Icono nombre="descargar" className={conTexto ? "size-[18px]" : "size-5"} />
      {conTexto && "Descargar PDF"}
    </a>
  );
}
