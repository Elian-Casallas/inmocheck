import "server-only";

type ErrorPostgres = { code?: string; message?: string };

// Códigos de error de PostgreSQL que la app traduce a respuestas HTTP.
const CODIGO_UNICO = "23505";
const CODIGO_LLAVE_FORANEA = "23503";
const CODIGO_SIN_PERMISO = "42501";

export const esViolacionUnica = (error: ErrorPostgres) => error.code === CODIGO_UNICO;
export const esLlaveForaneaInvalida = (error: ErrorPostgres) => error.code === CODIGO_LLAVE_FORANEA;
export const esSinPermiso = (error: ErrorPostgres) => error.code === CODIGO_SIN_PERMISO;

// El texto de búsqueda va dentro de un filtro .or() de Supabase, donde la
// coma, los paréntesis y el % tienen significado. Se quitan para que el
// usuario no pueda alterar el filtro.
export function limpiarBusqueda(texto: string): string {
  return texto.replace(/[,()%*\\"]/g, " ").trim();
}

// Convierte página y tamaño al rango (desde, hasta) que pide .range().
export function rangoDePagina(page: number, pageSize: number): [number, number] {
  const desde = (page - 1) * pageSize;
  return [desde, desde + pageSize - 1];
}

// Quita las claves con valor undefined para no pisar columnas en un UPDATE parcial.
export function sinIndefinidos<T extends Record<string, unknown>>(objeto: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(objeto).filter(([, valor]) => valor !== undefined),
  ) as Partial<T>;
}
