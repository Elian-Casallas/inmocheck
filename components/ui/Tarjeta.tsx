import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  relleno?: boolean;
};

export function Tarjeta({ relleno = true, className = "", children, ...resto }: Props) {
  return (
    <div
      className={`rounded-xl border border-borde bg-tarjeta ${relleno ? "p-5" : ""} ${className}`}
      {...resto}
    >
      {children}
    </div>
  );
}
