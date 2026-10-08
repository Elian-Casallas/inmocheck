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

// ---------- Plazo para iniciar ----------
// Una inspección se puede iniciar antes o después de su hora, pero solo
// hasta el cierre de oficina del día programado. Pasado ese momento queda
// "No realizada": el inspector ya no puede iniciarla y el administrador
// debe reprogramarla, reasignarla o cancelarla.
// La misma regla está en la función SQL limite_para_iniciar(), que es la
// que de verdad bloquea; aquí sirve para pintar la pantalla.

export const HORA_CIERRE_OFICINA = 19; // 7:00 p. m., hora de Colombia
const DESFASE_COLOMBIA_MS = 5 * 60 * 60 * 1000; // UTC-5, sin horario de verano
const HORA_MS = 60 * 60 * 1000;

export function limiteParaIniciar(programadaPara: string): Date {
  const programada = new Date(programadaPara).getTime();
  // Medianoche (hora de Colombia) del día programado, expresada en UTC.
  const hoyLocal = new Date(programada - DESFASE_COLOMBIA_MS);
  hoyLocal.setUTCHours(0, 0, 0, 0);
  const medianoche = hoyLocal.getTime() + DESFASE_COLOMBIA_MS;

  const cierre = medianoche + HORA_CIERRE_OFICINA * HORA_MS;
  // Si se programó después del cierre, el plazo es hasta terminar ese día.
  return new Date(programada < cierre ? cierre : medianoche + 24 * HORA_MS);
}

// Una fecha sirve para programar si su plazo para iniciar aún no ha pasado.
// Con una sola regla se descartan los días anteriores y también "hoy"
// cuando ya cerró la oficina: en ambos casos nacería como "No realizada".
export function sePuedeProgramar(programadaPara: string, ahora: Date = new Date()): boolean {
  return limiteParaIniciar(programadaPara) > ahora;
}

export const MENSAJE_FECHA_PASADA = "Esa fecha ya pasó. Elige hoy antes de las 7:00 p. m. o un día posterior.";

export function estaVencida(
  inspeccion: { estado: EstadoInspeccion; programadaPara: string },
  ahora: Date = new Date(),
): boolean {
  return inspeccion.estado === "PENDIENTE" && ahora > limiteParaIniciar(inspeccion.programadaPara);
}

export type InspeccionResumen = {
  id: string;
  tipo: TipoInspeccion;
  estado: EstadoInspeccion;
  programadaPara: string;
  finalizadaEn: string | null;
  inmueble: { id: string; codigo: string; direccion: string } | null;
  inspector: { id: string; nombre: string } | null;
};
