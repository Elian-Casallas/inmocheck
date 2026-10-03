import type { SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { CLASES_ENTRADA } from "./Campo";

type PropsComunes = {
  etiqueta: string;
  id: string;
  error?: string;
  opcional?: boolean;
  className?: string;
};

function Envoltura({
  etiqueta,
  id,
  error,
  opcional,
  className = "",
  children,
}: PropsComunes & { children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-cuerpo-sm font-medium">
        {etiqueta}
        {opcional && <span className="font-normal text-texto-tenue"> (opcional)</span>}
      </label>
      {children}
      {error && (
        <span id={`${id}-mensaje`} className="text-pequeno text-error">
          {error}
        </span>
      )}
    </div>
  );
}

type PropsSeleccion = Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> &
  PropsComunes & {
    opciones: { valor: string; texto: string }[];
    textoVacio?: string;
  };

export function CampoSeleccion({
  etiqueta,
  id,
  error,
  opcional,
  className,
  opciones,
  textoVacio = "Selecciona",
  ...resto
}: PropsSeleccion) {
  return (
    <Envoltura etiqueta={etiqueta} id={id} error={error} opcional={opcional} className={className}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-mensaje` : undefined}
        className={`${CLASES_ENTRADA} cursor-pointer`}
        {...resto}
      >
        <option value="">{textoVacio}</option>
        {opciones.map(({ valor, texto }) => (
          <option key={valor} value={valor}>
            {texto}
          </option>
        ))}
      </select>
    </Envoltura>
  );
}

type PropsAreaTexto = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> & PropsComunes;

export function CampoAreaTexto({ etiqueta, id, error, opcional, className, ...resto }: PropsAreaTexto) {
  return (
    <Envoltura etiqueta={etiqueta} id={id} error={error} opcional={opcional} className={className}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-mensaje` : undefined}
        className={`${CLASES_ENTRADA} min-h-[88px] resize-y`}
        {...resto}
      />
    </Envoltura>
  );
}
