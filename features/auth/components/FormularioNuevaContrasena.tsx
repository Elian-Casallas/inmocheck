"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Aviso } from "@/components/ui/Aviso";
import { Boton, clasesBoton } from "@/components/ui/Boton";
import { CampoContrasena } from "@/components/ui/CampoContrasena";
import { CONTRASENA_MINIMA } from "@/lib/constantes";
import { apiFetch } from "@/lib/api/client";
import { aplicarErroresDeApi } from "@/lib/formularios";
import { nuevaContrasenaSchema, type NuevaContrasenaDatos } from "@/schemas/auth";

export function FormularioNuevaContrasena() {
  const [guardada, setGuardada] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NuevaContrasenaDatos>({ resolver: zodResolver(nuevaContrasenaSchema) });

  async function guardarContrasena(datos: NuevaContrasenaDatos) {
    setErrorGeneral(null);
    try {
      await apiFetch("/auth/contrasena", { method: "PUT", body: JSON.stringify(datos) });
      setGuardada(true);
    } catch (error) {
      setErrorGeneral(aplicarErroresDeApi(error, setError));
    }
  }

  if (guardada) {
    return (
      <>
        <Aviso tipo="exito">Contraseña guardada.</Aviso>
        <Link href="/dashboard" className={clasesBoton({ bloque: true })}>
          Continuar
        </Link>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit(guardarContrasena)} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5 pt-2">
        <h1 className="text-titulo-movil font-semibold">Crea una nueva contraseña</h1>
        <p className="text-cuerpo-sm text-texto-secundario">
          Usa al menos {CONTRASENA_MINIMA} caracteres, con una letra y un número.
        </p>
      </div>
      {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}
      <CampoContrasena
        id="password"
        etiqueta="Nueva contraseña"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <CampoContrasena
        id="confirmacion"
        etiqueta="Confirmar contraseña"
        autoComplete="new-password"
        error={errors.confirmacion?.message}
        {...register("confirmacion")}
      />
      <Boton type="submit" bloque cargando={isSubmitting} textoCargando="Guardando…">
        Guardar contraseña
      </Boton>
    </form>
  );
}
