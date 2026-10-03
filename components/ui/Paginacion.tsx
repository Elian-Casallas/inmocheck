import Link from "next/link";
import { clasesBoton } from "./Boton";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  // Parámetros actuales de la URL, para conservar los filtros al cambiar de página.
  parametros: Record<string, string | undefined>;
  ruta: string;
};

export function Paginacion({ page, pageSize, total, parametros, ruta }: Props) {
  if (total <= pageSize) return null;

  const desde = (page - 1) * pageSize + 1;
  const hasta = Math.min(page * pageSize, total);
  const hayAnterior = page > 1;
  const haySiguiente = hasta < total;

  const enlace = (pagina: number) => {
    const query = new URLSearchParams();
    for (const [clave, valor] of Object.entries(parametros)) {
      if (valor) query.set(clave, valor);
    }
    query.set("page", String(pagina));
    return `${ruta}?${query}`;
  };

  const clases = clasesBoton({ variante: "secundario", tamano: "pequeno" });

  return (
    <nav
      aria-label="Paginación"
      className="flex items-center justify-between gap-3 border-t border-borde px-5 py-3 text-cuerpo-sm text-texto-secundario"
    >
      <span>
        {desde}–{hasta} de {total}
      </span>
      <div className="flex gap-2">
        {hayAnterior ? (
          <Link href={enlace(page - 1)} className={clases}>
            Anterior
          </Link>
        ) : (
          <span className={`${clases} opacity-50`} aria-disabled="true">
            Anterior
          </span>
        )}
        {haySiguiente ? (
          <Link href={enlace(page + 1)} className={clases}>
            Siguiente
          </Link>
        ) : (
          <span className={`${clases} opacity-50`} aria-disabled="true">
            Siguiente
          </span>
        )}
      </div>
    </nav>
  );
}
