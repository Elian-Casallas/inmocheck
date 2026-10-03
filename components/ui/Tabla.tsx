import type { ReactNode } from "react";
import Link from "next/link";
import { Icono } from "./Icono";
import { Tarjeta } from "./Tarjeta";

type PropsTabla = {
  encabezados: string[];
  children: ReactNode;
  // Se muestra en lugar de la tabla cuando no hay filas.
  vacio?: ReactNode;
  pie?: ReactNode;
};

// Tabla dentro de una tarjeta. En celular cada fila se vuelve una tarjeta
// (ver la clase .tabla en globals.css). Clases para las celdas:
//   solo-escritorio → se oculta en celular
//   a-la-derecha    → en celular va arriba a la derecha (ideal para el estado)
export function Tabla({ encabezados, children, vacio, pie }: PropsTabla) {
  if (vacio) {
    return <Tarjeta className="px-5 py-10 text-center text-cuerpo-sm text-texto-secundario">{vacio}</Tarjeta>;
  }

  return (
    <Tarjeta relleno={false} className="overflow-hidden">
      <table className="tabla">
        <thead>
          <tr>
            {encabezados.map((encabezado) => (
              <th key={encabezado} scope="col">
                {encabezado}
              </th>
            ))}
            <th>
              <span className="sr-only">Abrir</span>
            </th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {pie}
    </Tarjeta>
  );
}

type PropsCeldaPrincipal = {
  href: string;
  titulo: string;
  subtitulo?: string | null;
};

// Primera celda de la fila. Su enlace se "estira" sobre toda la fila
// (after:absolute after:inset-0), así la fila entera es clicable y sigue
// siendo un enlace de verdad: funciona con teclado y con "abrir en pestaña nueva".
export function CeldaPrincipal({ href, titulo, subtitulo }: PropsCeldaPrincipal) {
  return (
    <td>
      <Link href={href} className="font-medium text-texto-principal after:absolute after:inset-0">
        {titulo}
      </Link>
      {subtitulo && <div className="text-pequeno text-texto-tenue">{subtitulo}</div>}
    </td>
  );
}

export function CeldaFlecha() {
  return (
    <td className="solo-escritorio w-10 text-right text-texto-tenue">
      <Icono nombre="flecha-derecha" className="inline size-[18px]" />
    </td>
  );
}
