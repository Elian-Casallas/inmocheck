import type { ReactNode } from "react";
import { Icono, type NombreIcono } from "./Icono";

type Tipo = "info" | "error" | "exito";

const ESTILO: Record<Tipo, { clases: string; icono: NombreIcono }> = {
  info: { clases: "bg-sutil text-texto-secundario", icono: "info" },
  error: { clases: "bg-error-fondo text-error", icono: "alerta" },
  exito: { clases: "bg-exito-fondo text-exito", icono: "check" },
};

type Props = {
  tipo?: Tipo;
  children: ReactNode;
};

export function Aviso({ tipo = "info", children }: Props) {
  const { clases, icono } = ESTILO[tipo];

  return (
    <div
      // role="alert" hace que el lector de pantalla anuncie el error apenas aparece.
      role={tipo === "error" ? "alert" : "status"}
      className={`flex gap-2.5 rounded-lg px-3.5 py-3 text-cuerpo-sm ${clases}`}
    >
      <Icono nombre={icono} className="mt-px size-[18px]" />
      <span>{children}</span>
    </div>
  );
}
