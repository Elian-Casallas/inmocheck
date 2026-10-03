import { booleanoDeUrl, busquedaSchema, paginacionSchema } from "./comun";
import { z } from "./zod";

export const inspectorInvitarSchema = z
  .object({
    nombre: z.string().trim().min(2, "Escribe el nombre completo.").max(120),
    email: z.string().trim().toLowerCase().pipe(z.email("Escribe un correo válido.")),
  })
  .strict();

// No hay campo rol ni organización: los pone el servidor.
export const inspectorEditarSchema = z
  .object({
    nombre: z.string().trim().min(2).max(120).optional(),
    activo: z.boolean().optional(),
  })
  .strict();

export const inspectoresFiltroSchema = paginacionSchema.extend({
  search: busquedaSchema,
  activo: booleanoDeUrl.optional(),
});

export type InspectorInvitar = z.infer<typeof inspectorInvitarSchema>;
export type InspectorEditar = z.infer<typeof inspectorEditarSchema>;
export type InspectoresFiltro = z.infer<typeof inspectoresFiltroSchema>;

export type Inspector = {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
  createdAt: string;
  inspeccionesAbiertas: number;
};
