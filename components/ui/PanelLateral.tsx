"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Icono } from "./Icono";

type Props = {
  titulo: string;
  // A dónde volver al cerrar. El panel se abre con un parámetro en la URL
  // (?ver=ID o ?nuevo=1), así que cerrar es navegar a la URL sin ese parámetro.
  hrefCerrar: string;
  children: ReactNode;
};

const SELECTOR_ENFOCABLE = "input, select, textarea, button, a[href]";

// Panel que entra por la derecha. Qué lo hace accesible:
//  * role="dialog" + aria-modal + aria-labelledby: el lector de pantalla
//    anuncia que es un diálogo y dice su título.
//  * Al abrir, el foco pasa al primer campo; al cerrar, vuelve a donde estaba.
//  * Esc lo cierra y Tab no se sale del panel.
export function PanelLateral({ titulo, hrefCerrar, children }: Props) {
  const router = useRouter();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const enfocadoAntes = document.activeElement as HTMLElement | null;
    const cerrar = () => router.push(hrefCerrar, { scroll: false });

    const primerCampo = panel.current?.querySelector<HTMLElement>("[data-cuerpo] input, [data-cuerpo] select, [data-cuerpo] button");
    (primerCampo ?? panel.current)?.focus();

    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") return cerrar();
      if (evento.key !== "Tab" || !panel.current) return;

      const enfocables = [...panel.current.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLE)].filter(
        (elemento) => !elemento.hasAttribute("disabled"),
      );
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo?.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero?.focus();
      }
    }

    document.addEventListener("keydown", alPresionarTecla);
    return () => {
      document.removeEventListener("keydown", alPresionarTecla);
      enfocadoAntes?.focus();
    };
  }, [router, hrefCerrar]);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-texto-principal/35"
        onClick={() => router.push(hrefCerrar, { scroll: false })}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-panel"
        tabIndex={-1}
        className="fixed inset-y-0 right-0 z-50 flex w-[min(440px,100%)] flex-col bg-tarjeta shadow-[-8px_0_32px_rgb(15_23_42/0.12)] outline-none"
      >
        <div className="flex items-center justify-between gap-3 border-b border-borde py-4 pr-4 pl-6">
          <h2 id="titulo-panel" className="text-titulo-seccion font-semibold">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={() => router.push(hrefCerrar, { scroll: false })}
            aria-label="Cerrar"
            className="grid size-10 cursor-pointer place-items-center rounded-lg text-texto-secundario hover:bg-sutil"
          >
            <Icono nombre="cerrar" className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

// Zonas del panel, para que todos se vean igual.
export function PanelCuerpo({ children }: { children: ReactNode }) {
  return (
    <div data-cuerpo className="flex flex-1 flex-col gap-5 overflow-auto p-6">
      {children}
    </div>
  );
}

export function PanelPie({ children }: { children: ReactNode }) {
  // flex-wrap: si los botones no caben en una fila, bajan en vez de salirse del panel.
  return (
    <div className="flex flex-wrap justify-end gap-3 border-t border-borde px-6 py-4 max-sm:[&>*]:flex-1">
      {children}
    </div>
  );
}
