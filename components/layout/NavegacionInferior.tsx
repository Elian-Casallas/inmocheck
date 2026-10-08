"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icono } from "@/components/ui/Icono";
import type { Rol } from "@/lib/constantes";
import { MENU_POR_ROL, OPCION_CONFIGURACION, estaActiva } from "@/lib/navegacion";
import { EnlacesMenu } from "./EnlacesMenu";
import { Marca } from "./Marca";
import { UsuarioActual } from "./MenuLateral";

type Props = {
  nombre: string;
  rol: Rol;
};

// Barra fija abajo, solo en celular: 3 accesos principales y "Más", que abre
// el menú completo.
export function NavegacionInferior({ nombre, rol }: Props) {
  const rutaActual = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    if (!menuAbierto) return;
    const cerrarConEscape = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setMenuAbierto(false);
    };
    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [menuAbierto]);

  // Al realizar una inspección la pantalla es de "foco": sin navegación.
  if (rutaActual.endsWith("/realizar")) return null;

  const cerrarMenu = () => setMenuAbierto(false);
  const opciones = MENU_POR_ROL[rol];
  const claseItem =
    "flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-0.5 py-1 text-center text-pequeno font-medium whitespace-nowrap";

  return (
    <>
      <nav
        aria-label="Navegación"
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-borde bg-tarjeta px-2 pt-2 pb-[calc(10px+env(safe-area-inset-bottom))] min-[900px]:hidden"
      >
        {opciones
          .filter((opcion) => opcion.enMovil)
          .map(({ href, etiqueta, etiquetaCorta, icono }) => {
            const activa = estaActiva(rutaActual, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={activa ? "page" : undefined}
                className={`${claseItem} ${activa ? "text-primario" : "text-texto-tenue"}`}
              >
                <Icono nombre={icono} className="size-[22px]" />
                {/* Por debajo de 510 px se usa el texto corto para que quepa en una línea. */}
                {etiquetaCorta ? (
                  <>
                    <span className="min-[510px]:hidden">{etiquetaCorta}</span>
                    <span className="max-[509px]:hidden">{etiqueta}</span>
                  </>
                ) : (
                  etiqueta
                )}
              </Link>
            );
          })}
        <button
          type="button"
          onClick={() => setMenuAbierto(true)}
          aria-expanded={menuAbierto}
          className={`${claseItem} text-texto-tenue`}
        >
          <Icono nombre="menu" className="size-[22px]" />
          Más
        </button>
      </nav>

      {menuAbierto && (
        <div className="min-[900px]:hidden">
          <div className="fixed inset-0 z-40 bg-texto-principal/35" onClick={cerrarMenu} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
            className="fixed inset-y-0 left-0 z-50 flex w-[min(440px,100%)] flex-col bg-tarjeta shadow-tarjeta"
          >
            <div className="flex items-center justify-between border-b border-borde py-4 pr-4 pl-6">
              <Marca />
              <button
                type="button"
                onClick={cerrarMenu}
                aria-label="Cerrar menú"
                autoFocus
                className="grid size-10 cursor-pointer place-items-center rounded-lg text-texto-secundario hover:bg-sutil"
              >
                <Icono nombre="cerrar" className="size-5" />
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-1 overflow-auto p-4">
              <EnlacesMenu opciones={[...opciones, OPCION_CONFIGURACION]} alNavegar={cerrarMenu} />
              <div className="flex-1" />
              <UsuarioActual nombre={nombre} rol={rol} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
