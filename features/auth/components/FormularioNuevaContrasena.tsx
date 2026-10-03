"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Aviso } from "@/components/ui/Aviso";
import { Boton, clasesBoton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { CONTRASENA_MINIMA } from "@/lib/constantes";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { nuevaContrasenaSchema, type NuevaContrasenaDatos } from "@/schemas/auth";

export function FormularioNuevaContrasena() {
  const [guardada, setGuardada] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NuevaContrasenaDatos>({ resolver: zodResolver(nuevaContrasenaSchema) });

  async function guardarContrasena({ password }: NuevaContrasenaDatos) {
    setErrorGeneral(null);
    // Supabase Auth cambia la contraseña del usuario de la sesión actual.
    const { error } = await crearClienteNavegador().auth.updateUser({ password });

    if (error) {
      setErrorGeneral("No pudimos guardar la contraseña. Abre de nuevo el enlace del correo.");
      return;
    }
    setGuardada(true);
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
          Usa al menos {CONTRASENA_MINIMA} caracteres.
        </p>
      </div>
      {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}
      <Campo
        id="password"
        etiqueta="Nueva contraseña"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Campo
        id="confirmacion"
        etiqueta="Confirmar contraseña"
        type="password"
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
