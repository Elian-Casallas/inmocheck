import Link from "next/link";

export default function PaginaNoEncontrada() {
  return (
    <>
      <h1 className="text-titulo-pantalla font-semibold">
        No encontramos esta página
      </h1>
      <Link href="/dashboard" className="text-primario">
        Volver al inicio
      </Link>
    </>
  );
}
