import { busquedaSchema, paginacionSchema, textoOpcional } from "./comun";
import { z } from "./zod";

export const propietarioCrearSchema = z
  .object({
    nombre: z.string().trim().min(2, "Escribe el nombre completo.").max(120),
    email: z.email("Escribe un correo válido.").max(160).nullable().optional(),
    telefono: textoOpcional(30),
  })
  .strict();

// partial(): los mismos campos, todos opcionales. Sigue siendo strict.
export const propietarioEditarSchema = propietarioCrearSchema.partial();

// ?inmuebles=con|sin: propietarios con o sin inmuebles asociados. Sin valor: todos.
// .catch() en el campo: un valor inválido se ignora sin borrar search ni page.
export const propietariosFiltroSchema = paginacionSchema.extend({
  search: busquedaSchema,
  inmuebles: z.enum(["con", "sin"]).optional().catch(undefined),
});

export type PropietarioCrear = z.infer<typeof propietarioCrearSchema>;
export type PropietarioEditar = z.infer<typeof propietarioEditarSchema>;
export type PropietariosFiltro = z.infer<typeof propietariosFiltroSchema>;

export type Propietario = {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  tipo: "PROPIETARIO" | "ARRENDATARIO";
  createdAt: string;
  inmuebles: { id: string; codigo: string; activo: boolean }[];
};
