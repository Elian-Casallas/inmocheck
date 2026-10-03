"use client";

import { useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { apiFetch, mensajeDeError } from "@/lib/api/client";

// Cambiar la contraseña es el mismo flujo que recuperarla: se envía un
// enlace al correo de la cuenta. Así se confirma que quien la cambia tiene
// acceso a ese correo.
export function BotonCambiarContrasena({ email }: { email: string }) {
  const [estado, setEstado] = useState<"inicial" | "enviando" | "enviado">("inicial");
  const [error, setError] = useState<string | null>(null);

  async function enviarEnlace() {
    setEstado("enviando");
    setError(null);
    try {
      await apiFetch("/auth/recuperar-contrasena", { method: "POST", body: JSON.stringify({ email }) });
      setEstado("enviado");
    } catch (causa) {
      setError(mensajeDeError(causa));
      setEstado("inicial");
    }
  }

  if (estado === "enviado") {
    return <Aviso tipo="exito">Te enviamos un enlace a {email}. Revisa también el correo no deseado.</Aviso>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Boton variante="secundario" onClick={enviarEnlace} cargando={estado === "enviando"} textoCargando="Enviando…">
        Cambiar contraseña
      </Boton>
      {error && (
        <span role="alert" className="text-pequeno text-error">
          {error}
        </span>
      )}
    </div>
  );
}
