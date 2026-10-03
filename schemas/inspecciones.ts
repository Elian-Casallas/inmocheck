import {
  ESTADOS_ELEMENTO,
  ESTADOS_INSPECCION,
  TIPOS_INSPECCION,
  type EstadoElemento,
  type EstadoInspeccion,
  type TipoInspeccion,
} from "@/lib/inspecciones";
import { paginacionSchema, textoOpcional } from "./comun";
import { z } from "./zod";

// La versión que el cliente tenía cuando cargó los datos (concurrencia optimista).
const version = z.number("Falta la versión.").int().min(1);
const fechaIso = z.iso.datetime({ offset: true, error: "Fecha inválida." });

export const inspeccionCrearSchema = z
  .object({
    inmuebleId: z.uuid("Selecciona un inmueble."),
    inspectorId: z.uuid("Selecciona un inspector."),
    tipo: z.enum(TIPOS_INSPECCION, "Selecciona el tipo de inspección."),
    programadaPara: fechaIso,
    nota: textoOpcional(1000),
  })
  .strict();

export const inspeccionEditarSchema = z
  .object({ programadaPara: fechaIso.optional(), nota: textoOpcional(1000), version })
  .strict();

export const inspeccionVersionSchema = z.object({ version }).strict();

export const inspeccionReasignarSchema = z
  .object({
    inspectorId: z.uuid("Selecciona un inspector."),
    motivo: textoOpcional(500),
    version,
  })
  .strict();

export const inspeccionCancelarSchema = z
  .object({
    motivo: z.string().trim().min(3, "Escribe el motivo de la cancelación.").max(500),
    version,
  })
  .strict();

export const detalleGuardarSchema = z
  .object({
    estado: z.enum(ESTADOS_ELEMENTO, "Selecciona un estado."),
    observacion: textoOpcional(2000),
    version,
  })
  .strict();

export const inspeccionesFiltroSchema = paginacionSchema.extend({
  estado: z.enum(ESTADOS_INSPECCION).optional(),
  tipo: z.enum(TIPOS_INSPECCION).optional(),
  inmuebleId: z.uuid().optional(),
  desde: z.iso.date().optional(),
  hasta: z.iso.date().optional(),
});

export type InspeccionCrear = z.infer<typeof inspeccionCrearSchema>;
export type InspeccionEditar = z.infer<typeof inspeccionEditarSchema>;
export type InspeccionReasignar = z.infer<typeof inspeccionReasignarSchema>;
export type InspeccionCancelar = z.infer<typeof inspeccionCancelarSchema>;
export type DetalleGuardar = z.infer<typeof detalleGuardarSchema>;
export type InspeccionesFiltro = z.infer<typeof inspeccionesFiltroSchema>;

export type Progreso = { evaluados: number; total: number; obligatoriosPendientes: number };

export type Inspeccion = {
  id: string;
  tipo: TipoInspeccion;
  estado: EstadoInspeccion;
  programadaPara: string;
  nota: string | null;
  iniciadaEn: string | null;
  finalizadaEn: string | null;
  canceladaEn: string | null;
  motivoCancelacion: string | null;
  version: number;
  inmueble: { id: string; codigo: string; direccion: string; barrio: string | null; ciudad: string };
  inspector: { id: string; nombre: string } | null;
  progreso: Progreso;
};

export type Evidencia = {
  id: string;
  mimeType: string;
  sizeBytes: number;
  descripcion: string | null;
  createdAt: string;
};

export type Detalle = {
  id: string;
  elementoId: string;
  espacioNombre: string;
  elementoNombre: string;
  obligatorio: boolean;
  estado: EstadoElemento | null;
  observacion: string | null;
  version: number;
  evidencias: Evidencia[];
};
