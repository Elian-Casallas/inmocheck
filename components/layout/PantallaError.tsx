import type { ReactNode } from "react";
import { TarjetaAcceso } from "./TarjetaAcceso";

type Props = {
  codigo: string;
  titulo: string;
  texto: string;
  children: ReactNode;
};

// Pantalla de error 403 / 404. A propósito no muestra detalles del recurso:
// así no se filtra información de otras inmobiliarias.
export function PantallaError({ codigo, titulo, texto, children }: Props) {
  return (
    <TarjetaAcceso centrado>
      <p className="text-5xl leading-[56px] font-semibold text-texto-tenue">{codigo}</p>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-titulo-movil font-semibold">{titulo}</h1>
        <p className="text-cuerpo-sm text-texto-secundario">{texto}</p>
      </div>
      {children}
    </TarjetaAcceso>
  );
}
