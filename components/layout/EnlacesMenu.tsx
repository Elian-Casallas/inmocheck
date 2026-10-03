"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icono } from "@/components/ui/Icono";
import { estaActiva, type OpcionMenu } from "@/lib/navegacion";

type Props = {
  opciones: OpcionMenu[];
  alNavegar?: () => void;
};

// Lista de enlaces del menú. Es componente cliente porque usePathname()
// necesita el navegador para saber en qué ruta estamos.
export function EnlacesMenu({ opciones, alNavegar }: Props) {
  const rutaActual = usePathname();

  return (
    <>
      {opciones.map(({ href, etiqueta, icono }) => {
        const activa = estaActiva(rutaActual, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={alNavegar}
            // aria-current le dice al lector de pantalla cuál es la página actual.
            aria-current={activa ? "page" : undefined}
            className={`flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-cuerpo-sm ${
              activa
                ? "bg-primario-suave font-medium text-primario"
                : "text-texto-secundario hover:bg-sutil"
            }`}
          >
            <Icono nombre={icono} />
            {etiqueta}
          </Link>
        );
      })}
    </>
  );
}
