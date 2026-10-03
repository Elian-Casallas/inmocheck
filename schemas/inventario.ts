import { z } from "./zod";

const nombre = z.string().trim().min(2, "Mínimo 2 caracteres.").max(80);
const orden = z.number().int().min(0).max(999);

export const espacioCrearSchema = z.object({ nombre, orden: orden.optional() }).strict();

export const espacioEditarSchema = z
  .object({ nombre: nombre.optional(), orden: orden.optional(), activo: z.boolean().optional() })
  .strict();

export const elementoCrearSchema = z
  .object({ nombre, obligatorio: z.boolean().default(true), orden: orden.optional() })
  .strict();

export const elementoEditarSchema = z
  .object({
    nombre: nombre.optional(),
    obligatorio: z.boolean().optional(),
    orden: orden.optional(),
    activo: z.boolean().optional(),
  })
  .strict();

export type EspacioCrear = z.infer<typeof espacioCrearSchema>;
export type EspacioEditar = z.infer<typeof espacioEditarSchema>;
export type ElementoCrear = z.infer<typeof elementoCrearSchema>;
export type ElementoEditar = z.infer<typeof elementoEditarSchema>;

export type Elemento = {
  id: string;
  espacioId: string;
  nombre: string;
  obligatorio: boolean;
  orden: number;
  activo: boolean;
};

export type Espacio = {
  id: string;
  inmuebleId: string;
  nombre: string;
  orden: number;
  activo: boolean;
  elementos: Elemento[];
};
