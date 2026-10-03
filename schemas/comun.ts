import { PAGINA_TAMANO_DEFECTO, PAGINA_TAMANO_MAXIMO } from "@/lib/constantes";
import { z } from "./zod";

export const uuidSchema = z.uuid("Identificador inválido.");

// Los parámetros de la URL siempre llegan como texto: coerce los convierte.
export const paginacionSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(PAGINA_TAMANO_MAXIMO).default(PAGINA_TAMANO_DEFECTO),
});

export const busquedaSchema = z.string().trim().max(80).optional();

// "true"/"false" de la URL a booleano. Cualquier otro valor se rechaza.
export const booleanoDeUrl = z.enum(["true", "false"]).transform((valor) => valor === "true");

// Texto que puede venir vacío: se acepta ausente o null.
export const textoOpcional = (maximo: number) => z.string().trim().max(maximo).nullable().optional();

export type Paginado<T> = {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

export function armarPaginado<T>(data: T[], total: number, page: number, pageSize: number): Paginado<T> {
  return { data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}
