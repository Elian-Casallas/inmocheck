import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario" | "texto" | "peligro";
type Tamano = "normal" | "pequeno";

type OpcionesBoton = {
  variante?: Variante;
  tamano?: Tamano;
  bloque?: boolean;
};

// Un objeto por variante en lugar de un if gigante: agregar una variante
// nueva es agregar una línea.
const CLASES_VARIANTE: Record<Variante, string> = {
  primario: "border-transparent bg-primario text-white hover:bg-primario-hover",
  secundario: "bg-tarjeta border-borde-fuerte text-texto-principal hover:bg-sutil",
  texto: "border-transparent text-primario hover:bg-primario-suave px-2.5",
  peligro: "bg-tarjeta border-error-borde text-error hover:bg-error-fondo",
};

const CLASES_TAMANO: Record<Tamano, string> = {
  normal: "h-12 px-5 text-boton",
  pequeno: "h-10 px-3.5 text-cuerpo-sm",
};

// Se exporta para darle aspecto de botón a un <Link>.
export function clasesBoton({
  variante = "primario",
  tamano = "normal",
  bloque = false,
}: OpcionesBoton = {}): string {
  return [
    "inline-flex items-center justify-center gap-2 rounded-boton border",
    "font-semibold whitespace-nowrap transition-colors cursor-pointer",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    CLASES_TAMANO[tamano],
    CLASES_VARIANTE[variante],
    bloque ? "w-full" : "",
  ].join(" ");
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  OpcionesBoton & {
    cargando?: boolean;
    textoCargando?: string;
  };

export function Boton({
  variante,
  tamano,
  bloque,
  cargando = false,
  textoCargando = "Un momento…",
  type = "button",
  disabled,
  className = "",
  children,
  ...resto
}: Props) {
  return (
    <button
      type={type}
      // Deshabilitar mientras carga evita el doble envío.
      disabled={disabled || cargando}
      aria-busy={cargando}
      className={`${clasesBoton({ variante, tamano, bloque })} ${className}`}
      {...resto}
    >
      {cargando ? textoCargando : children}
    </button>
  );
}
