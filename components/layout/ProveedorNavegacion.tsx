"use client";

import { createContext, Suspense, useContext, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BarraCarga } from "@/components/layout/BarraCarga";

// Muestra la barra de carga en TODA espera por el servidor:
//   - clics en enlaces (menú, tablas, filtros, paneles), y
//   - navegaciones hechas desde código con useNavegacion() (guardar, filtrar,
//     cerrar un panel, refrescar después de una acción).
// La barra se va sola cuando la página nueva ya está pintada.

type Navegacion = {
  push: (href: string, opciones?: { scroll?: boolean }) => void;
  replace: (href: string, opciones?: { scroll?: boolean }) => void;
  refresh: () => void;
};

const ContextoNavegacion = createContext<Navegacion | null>(null);

// Si algo falla y la URL nunca cambia, la barra no se queda pegada.
const ESPERA_MAXIMA_MS = 20_000;

export function ProveedorNavegacion({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [enTransicion, iniciarTransicion] = useTransition();
  const [clicPendiente, setClicPendiente] = useState(false);

  // Las navegaciones dentro de una transición mantienen enTransicion en true
  // hasta que llega y se pinta la respuesta del servidor.
  const navegacion = useMemo<Navegacion>(
    () => ({
      push: (href, opciones) => iniciarTransicion(() => router.push(href, opciones)),
      replace: (href, opciones) => iniciarTransicion(() => router.replace(href, opciones)),
      refresh: () => iniciarTransicion(() => router.refresh()),
    }),
    [router],
  );

  return (
    <ContextoNavegacion.Provider value={navegacion}>
      <BarraCarga visible={enTransicion || clicPendiente} />
      <Suspense fallback={null}>
        <VigilanteDeEnlaces pendiente={clicPendiente} onCambio={setClicPendiente} />
      </Suspense>
      {children}
    </ContextoNavegacion.Provider>
  );
}

// Igual que useRouter() (push, replace, refresh), pero muestra la barra de carga.
export function useNavegacion(): Navegacion {
  const navegacion = useContext(ContextoNavegacion);
  if (!navegacion) throw new Error("useNavegacion debe usarse dentro de ProveedorNavegacion.");
  return navegacion;
}

// Los <Link> de Next no avisan cuándo empiezan a navegar: se escucha el clic
// y se da por terminado cuando cambia la URL.
function VigilanteDeEnlaces({ pendiente, onCambio }: { pendiente: boolean; onCambio: (valor: boolean) => void }) {
  const ruta = usePathname();
  const parametros = useSearchParams();
  const urlActual = `${ruta}?${parametros.toString()}`;

  useEffect(() => {
    onCambio(false);
  }, [urlActual, onCambio]);

  useEffect(() => {
    if (!pendiente) return;
    const temporizador = window.setTimeout(() => onCambio(false), ESPERA_MAXIMA_MS);
    return () => window.clearTimeout(temporizador);
  }, [pendiente, onCambio]);

  useEffect(() => {
    function alHacerClic(evento: MouseEvent) {
      // Solo clic izquierdo normal (Next ya hace preventDefault en sus <Link>).
      if (evento.button !== 0) return;
      if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
      const enlace = (evento.target as Element | null)?.closest?.("a[href]");
      if (!(enlace instanceof HTMLAnchorElement)) return;
      if (enlace.target && enlace.target !== "_self") return;
      if (enlace.hasAttribute("download")) return;
      const destino = new URL(enlace.href, window.location.href);
      if (destino.origin !== window.location.origin) return;
      // Solo cuenta si cambia la página o sus parámetros (no un #ancla).
      if (destino.pathname === window.location.pathname && destino.search === window.location.search) return;
      // Las descargas de la API (PDF) no son navegaciones de la app.
      if (destino.pathname.startsWith("/api/")) return;
      onCambio(true);
    }
    document.addEventListener("click", alHacerClic);
    return () => document.removeEventListener("click", alHacerClic);
  }, [onCambio]);

  return null;
}
