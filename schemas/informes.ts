import type { TipoInspeccion } from "@/lib/inspecciones";
import { z } from "./zod";

export const FOTOS_MAXIMAS_EN_INFORME = 60;

export const informeCrearSchema = z
  .object({
    tipo: z.literal("ACTA").default("ACTA"),
    // Fotos que lleva el acta. Si no se envía, van todas las de la inspección.
    evidenciaIds: z.array(z.uuid()).max(FOTOS_MAXIMAS_EN_INFORME).optional(),
  })
  .strict();

export type Informe = {
  id: string;
  inspeccionId: string;
  version: number;
  generadoEn: string;
  generadoPor: { nombre: string } | null;
};

// Informe con los datos de su inspección, para la biblioteca de informes.
export type InformeConInspeccion = Informe & {
  inspeccion: { id: string; tipo: TipoInspeccion; inmueble: { codigo: string; direccion: string } | null } | null;
};

// Código legible que aparece en el PDF: INF-2026-1A2B3C4D
export function codigoDeInforme(informeId: string, generadoEn: string): string {
  return `INF-${new Date(generadoEn).getFullYear()}-${informeId.slice(0, 8).toUpperCase()}`;
}
