import type { InputHTMLAttributes } from "react";

export const CLASES_ENTRADA =
  "w-full min-h-12 rounded-lg border border-borde-fuerte bg-tarjeta p-3 text-cuerpo " +
  "placeholder:text-texto-tenue focus:border-primario focus:outline-none " +
  "focus:ring-3 focus:ring-primario/15 aria-invalid:border-error " +
  "read-only:bg-sutil read-only:text-texto-secundario";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string;
  // El id une la etiqueta con el campo: clic en la etiqueta enfoca el campo
  // y los lectores de pantalla la leen.
  id: string;
  error?: string;
  ayuda?: string;
  opcional?: boolean;
};

// Etiqueta + campo de texto + mensaje de ayuda o error debajo.
// Acepta las props de <input>, así que funciona con register() de
// React Hook Form: <Campo id="email" etiqueta="Correo" {...register("email")} />
export function Campo({ etiqueta, id, error, ayuda, opcional = false, className = "", ...resto }: Props) {
  const idMensaje = `${id}-mensaje`;
  const mensaje = error ?? ayuda;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-cuerpo-sm font-medium">
        {etiqueta}
        {opcional && <span className="font-normal text-texto-tenue"> (opcional)</span>}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={mensaje ? idMensaje : undefined}
        className={CLASES_ENTRADA}
        {...resto}
      />
      {mensaje && (
        <span id={idMensaje} className={`text-pequeno ${error ? "text-error" : "text-texto-tenue"}`}>
          {mensaje}
        </span>
      )}
    </div>
  );
}
