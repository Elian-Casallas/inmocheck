import Link from "next/link";

type Props = {
  etiqueta: string;
  opciones: { href: string; texto: string; cantidad?: number; activa: boolean }[];
};

// Filtros tipo "chip". Son enlaces: el filtro elegido queda en la URL y
// la página se vuelve a pedir al servidor con ese filtro.
export function ChipsFiltro({ etiqueta, opciones }: Props) {
  return (
    <nav aria-label={etiqueta} className="flex flex-wrap gap-2">
      {opciones.map(({ href, texto, cantidad, activa }) => (
        <Link
          key={href}
          href={href}
          scroll={false}
          aria-current={activa ? "true" : undefined}
          className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-cuerpo-sm ${
            activa
              ? "border-texto-principal bg-texto-principal text-white"
              : "border-borde-fuerte bg-tarjeta hover:bg-sutil"
          }`}
        >
          {texto}
          {cantidad !== undefined && (
            <span className={`text-pequeno ${activa ? "text-borde-fuerte" : "text-texto-tenue"}`}>{cantidad}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
