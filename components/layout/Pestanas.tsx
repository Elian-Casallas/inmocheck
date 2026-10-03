"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  etiqueta: string;
  pestanas: { href: string; texto: string }[];
};

// Pestañas que son enlaces: cada una es una ruta. La activa se marca sola
// comparando con la ruta actual.
export function Pestanas({ etiqueta, pestanas }: Props) {
  const rutaActual = usePathname();

  return (
    <nav aria-label={etiqueta} className="flex gap-1 overflow-x-auto border-b border-borde">
      {pestanas.map(({ href, texto }) => {
        const activa = rutaActual === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={activa ? "page" : undefined}
            className={`-mb-px border-b-2 px-3.5 py-2.5 text-cuerpo-sm font-medium whitespace-nowrap ${
              activa
                ? "border-primario text-primario"
                : "border-transparent text-texto-secundario hover:text-texto-principal"
            }`}
          >
            {texto}
          </Link>
        );
      })}
    </nav>
  );
}
