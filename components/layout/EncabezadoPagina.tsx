import type { ReactNode } from "react";
import Link from "next/link";
import { Icono } from "@/components/ui/Icono";

type Props = {
  titulo: string;
  descripcion?: string;
  // Enlace "Volver a…" encima del título.
  volver?: { href: string; etiqueta: string };
  // Va al lado del título (por ejemplo, un Badge de estado).
  junto?: ReactNode;
  // Botones de acción a la derecha. Regla de diseño: un solo botón primario.
  acciones?: ReactNode;
};

export function EncabezadoPagina({ titulo, descripcion, volver, junto, acciones }: Props) {
  return (
    <header className="flex flex-col gap-3">
      {volver && (
        <Link
          href={volver.href}
          className="inline-flex items-center gap-1 self-start text-cuerpo-sm font-medium text-primario hover:underline"
        >
          <Icono nombre="volver" className="size-4" />
          {volver.etiqueta}
        </Link>
      )}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="flex min-w-60 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[22px] leading-[30px] font-semibold tracking-tight min-[900px]:text-titulo-pantalla">
              {titulo}
            </h1>
            {junto}
          </div>
          {descripcion && <p className="text-cuerpo-sm text-texto-secundario">{descripcion}</p>}
        </div>
        {acciones && <div className="flex flex-wrap items-center gap-3">{acciones}</div>}
      </div>
    </header>
  );
}
