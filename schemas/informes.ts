import type { TipoInspeccion } from "@/lib/inspecciones";
import { z } from "./zod";

export const informeCrearSchema = z.object({ tipo: z.literal("ACTA").default("ACTA") }).strict();

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
