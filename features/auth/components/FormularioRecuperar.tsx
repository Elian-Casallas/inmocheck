"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { apiFetch, mensajeDeError } from "@/lib/api/client";
import { recuperarContrasenaSchema, type RecuperarContrasenaDatos } from "@/schemas/auth";

export function FormularioRecuperar() {
  const [enviado, setEnviado] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecuperarContrasenaDatos>({ resolver: zodResolver(recuperarContrasenaSchema) });

  async function enviarEnlace(datos: RecuperarContrasenaDatos) {
    setErrorGeneral(null);
    try {
      await apiFetch("/auth/recuperar-contrasena", {
        method: "POST",
        body: JSON.stringify(datos),
      });
      setEnviado(true);
    } catch (error) {
      setErrorGeneral(mensajeDeError(error));
    }
  }

  if (enviado) {
    return (
      <div className="flex flex-col gap-1.5 pt-2">
        <h1 className="text-titulo-movil font-semibold">Revisa tu correo</h1>
        <p className="text-cuerpo-sm text-texto-secundario">
          Si la cuenta existe, recibirás un enlace para crear una nueva contraseña. El enlace vence
          en una hora.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(enviarEnlace)} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5 pt-2">
        <h1 className="text-titulo-movil font-semibold">Recuperar contraseña</h1>
        <p className="text-cuerpo-sm text-texto-secundario">
          Escribe tu correo y te enviaremos un enlace para crear una nueva contraseña.
        </p>
      </div>
      {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}
      <Campo
        id="email"
        etiqueta="Correo electrónico"
        type="email"
        autoComplete="email"
        placeholder="nombre@inmobiliaria.com"
        error={errors.email?.message}
        {...register("email")}
      />
      <Boton type="submit" bloque cargando={isSubmitting} textoCargando="Enviando…">
        Enviar enlace
      </Boton>
    </form>
  );
}
