"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { CampoContrasena } from "@/components/ui/CampoContrasena";
import { apiFetch, mensajeDeError } from "@/lib/api/client";
import { RUTA_INICIO_POR_ROL, type Rol } from "@/lib/constantes";
import { loginSchema, type LoginDatos } from "@/schemas/auth";

type RespuestaLogin = { data: { rol: Rol } };

export function FormularioLogin() {
  const router = useRouter();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  // zodResolver conecta el formulario con el MISMO esquema que usa la API.
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginDatos>({ resolver: zodResolver(loginSchema) });

  async function ingresar(datos: LoginDatos) {
    setErrorGeneral(null);
    try {
      const { data } = await apiFetch<RespuestaLogin>("/auth/login", {
        method: "POST",
        body: JSON.stringify(datos),
      });
      router.replace(RUTA_INICIO_POR_ROL[data.rol]);
      router.refresh();
    } catch (error) {
      setErrorGeneral(mensajeDeError(error));
    }
  }

  return (
    <form onSubmit={handleSubmit(ingresar)} noValidate className="flex flex-col gap-4">
      {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}
      <Campo
        id="email"
        etiqueta="Correo electrónico"
        type="email"
        autoComplete="email"
        placeholder="correo@gmail.com"
        error={errors.email?.message}
        {...register("email")}
      />
      <CampoContrasena
        id="password"
        etiqueta="Contraseña"
        autoComplete="current-password"
        placeholder="********"
        error={errors.password?.message}
        {...register("password")}
      />
      <Link
        href="/recuperar-contrasena"
        className="self-end text-cuerpo-sm font-medium text-primario hover:underline"
      >
        ¿Olvidaste tu contraseña?
      </Link>
      <Boton type="submit" bloque cargando={isSubmitting} textoCargando="Ingresando…">
        Ingresar
      </Boton>
    </form>
  );
}
