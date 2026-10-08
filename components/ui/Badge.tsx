type Tono = "pendiente" | "en-proceso" | "finalizada" | "cancelada" | "vencida" | "activo" | "inactivo";

const CLASES_TONO: Record<Tono, string> = {
  pendiente: "bg-inspeccion-pendiente-fondo text-inspeccion-pendiente",
  "en-proceso": "bg-inspeccion-en-proceso-fondo text-inspeccion-en-proceso",
  finalizada: "bg-inspeccion-finalizada-fondo text-inspeccion-finalizada",
  cancelada: "bg-inspeccion-cancelada-fondo text-inspeccion-cancelada",
  vencida: "bg-error-fondo text-error",
  activo: "bg-inspeccion-finalizada-fondo text-inspeccion-finalizada",
  inactivo: "bg-sutil text-texto-tenue",
};

type Props = {
  tono: Tono;
  children: string;
};

// Regla de diseño: el color nunca va solo, siempre acompañado de texto.
export function Badge({ tono, children }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-pequeno font-medium whitespace-nowrap ${CLASES_TONO[tono]}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}
