import Link from "next/link";
import { Icono } from "@/components/ui/Icono";

type Props = {
  href?: string;
};

// Logo + nombre. Con href es un enlace al inicio; sin href, solo la marca.
export function Marca({ href }: Props) {
  const contenido = (
    <>
      <span className="grid size-7 place-items-center rounded-lg bg-primario text-white">
        <Icono nombre="logo" className="size-4" />
      </span>
      InmoCheck
    </>
  );
  const clases = "flex items-center gap-2.5 text-titulo-seccion font-semibold text-texto-principal";

  if (!href) return <div className={clases}>{contenido}</div>;
  return (
    <Link href={href} className={clases}>
      {contenido}
    </Link>
  );
}
