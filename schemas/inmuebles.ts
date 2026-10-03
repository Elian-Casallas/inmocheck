import { booleanoDeUrl, busquedaSchema, paginacionSchema, textoOpcional, uuidSchema } from "./comun";
import { z } from "./zod";

export const TIPOS_INMUEBLE = ["APARTAMENTO", "CASA", "OTRO"] as const;
export type TipoInmueble = (typeof TIPOS_INMUEBLE)[number];

export const ETIQUETA_TIPO_INMUEBLE: Record<TipoInmueble, string> = {
  APARTAMENTO: "Apartamento",
  CASA: "Casa",
  OTRO: "Otro",
};

const enteroNoNegativo = z
  .number("Escribe un número.")
  .int("Debe ser un número entero.")
  .min(0, "No puede ser negativo.")
  .max(99);

export const inmuebleCrearSchema = z
  .object({
    codigo: z.string().trim().min(2, "Mínimo 2 caracteres.").max(40),
    tipo: z.enum(TIPOS_INMUEBLE, "Selecciona el tipo."),
    direccion: z.string().trim().min(5, "Escribe la dirección completa.").max(240),
    barrio: textoOpcional(80),
    ciudad: z.string().trim().min(2, "Escribe la ciudad.").max(80),
    departamento: z.string().trim().min(2, "Escribe el departamento.").max(80),
    habitaciones: enteroNoNegativo,
    banos: enteroNoNegativo,
    areaM2: z.number("Escribe un número.").positive("Debe ser mayor que cero.").max(99999).nullable().optional(),
    propietarioId: z.uuid("Selecciona un propietario."),
    descripcion: textoOpcional(1000),
  })
  .strict();

// Al editar se puede además reactivar. No se aceptan id, organización ni fechas:
// con .strict() cualquier campo que no esté aquí se rechaza.
export const inmuebleEditarSchema = inmuebleCrearSchema.partial().extend({
  activo: z.boolean().optional(),
});

// sort es una lista cerrada: nunca se mete texto del cliente en la consulta.
export const ORDENES_INMUEBLE = ["codigo", "-codigo", "createdAt", "-createdAt"] as const;

export const inmueblesFiltroSchema = paginacionSchema.extend({
  search: busquedaSchema,
  tipo: z.enum(TIPOS_INMUEBLE).optional(),
  activo: booleanoDeUrl.optional(),
  sort: z.enum(ORDENES_INMUEBLE).default("codigo"),
});

export const idInmuebleSchema = uuidSchema;

export type InmuebleCrear = z.infer<typeof inmuebleCrearSchema>;
export type InmuebleEditar = z.infer<typeof inmuebleEditarSchema>;
export type InmueblesFiltro = z.infer<typeof inmueblesFiltroSchema>;

export type Inmueble = {
  id: string;
  codigo: string;
  tipo: TipoInmueble;
  direccion: string;
  barrio: string | null;
  ciudad: string;
  departamento: string;
  habitaciones: number;
  banos: number;
  areaM2: number | null;
  descripcion: string | null;
  activo: boolean;
  createdAt: string;
  // El inspector no ve propietarios (RLS), por eso puede venir null.
  propietario: { id: string; nombre: string; email: string | null; telefono: string | null } | null;
};
