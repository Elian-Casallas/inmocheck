// Valores y textos de las inspecciones. Coinciden con los ENUM de la base.

export const TIPOS_INSPECCION = ["ENTRADA", "SALIDA", "SEGUIMIENTO"] as const;
export type TipoInspeccion = (typeof TIPOS_INSPECCION)[number];

export const ESTADOS_INSPECCION = ["PENDIENTE", "EN_PROCESO", "FINALIZADA", "CANCELADA"] as const;
export type EstadoInspeccion = (typeof ESTADOS_INSPECCION)[number];

export const ESTADOS_ELEMENTO = ["EXCELENTE", "BUENO", "REGULAR", "DANADO", "NO_APLICA"] as const;
export type EstadoElemento = (typeof ESTADOS_ELEMENTO)[number];

export const ETIQUETA_TIPO_INSPECCION: Record<TipoInspeccion, string> = {
  ENTRADA: "Entrada",
  SALIDA: "Salida",
  SEGUIMIENTO: "Seguimiento",
};

export const ETIQUETA_ESTADO_INSPECCION: Record<EstadoInspeccion, string> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

export const TONO_ESTADO_INSPECCION = {
  PENDIENTE: "pendiente",
  EN_PROCESO: "en-proceso",
  FINALIZADA: "finalizada",
  CANCELADA: "cancelada",
} as const satisfies Record<EstadoInspeccion, string>;

export const ETIQUETA_ESTADO_ELEMENTO: Record<EstadoElemento, string> = {
  EXCELENTE: "Excelente",
  BUENO: "Bueno",
  REGULAR: "Regular",
  DANADO: "Dañado",
  NO_APLICA: "No aplica",
};

export const ESTADOS_ABIERTOS: EstadoInspeccion[] = ["PENDIENTE", "EN_PROCESO"];

export type InspeccionResumen = {
  id: string;
  tipo: TipoInspeccion;
  estado: EstadoInspeccion;
  programadaPara: string;
  finalizadaEn: string | null;
  inmueble: { id: string; codigo: string; direccion: string } | null;
  inspector: { id: string; nombre: string } | null;
};
