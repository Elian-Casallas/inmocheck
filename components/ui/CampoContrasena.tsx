"use client";

import { useState, type InputHTMLAttributes } from "react";
import { CLASES_ENTRADA } from "./Campo";
import { Icono } from "./Icono";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  etiqueta: string;
  id: string;
  error?: string;
  ayuda?: string;
};

// Campo de contraseña con botón de "ojo" para verla mientras se escribe.
// Es componente cliente porque recuerda si la contraseña está visible.
export function CampoContrasena({ etiqueta, id, error, ayuda, className = "", ...resto }: Props) {
  const [visible, setVisible] = useState(false);
  const idMensaje = `${id}-mensaje`;
  const mensaje = error ?? ayuda;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-cuerpo-sm font-medium">
        {etiqueta}
      </label>
      <div className="relative">
        <input
          id={id}
          // Lo único que cambia al pulsar el ojo es el tipo del campo.
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={mensaje ? idMensaje : undefined}
          className={`${CLASES_ENTRADA} pr-12`}
          {...resto}
        />
        <button
          // type="button": si fuera submit, pulsar el ojo enviaría el formulario.
          type="button"
          onClick={() => setVisible((actual) => !actual)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="absolute top-1 right-1 grid size-10 cursor-pointer place-items-center rounded-lg text-texto-tenue hover:bg-sutil hover:text-texto-secundario"
        >
          <Icono nombre={visible ? "ojo-tachado" : "ojo"} className="size-5" />
        </button>
      </div>
      {mensaje && (
        <span id={idMensaje} className={`text-pequeno ${error ? "text-error" : "text-texto-tenue"}`}>
          {mensaje}
        </span>
      )}
    </div>
  );
}
