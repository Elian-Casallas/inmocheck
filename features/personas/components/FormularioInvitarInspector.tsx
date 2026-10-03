"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Aviso } from "@/components/ui/Aviso";
import { Boton, clasesBoton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { PanelCuerpo, PanelPie } from "@/components/ui/PanelLateral";
import { apiFetch } from "@/lib/api/client";
import { aplicarErroresDeApi } from "@/lib/formularios";
import { inspectorInvitarSchema, type InspectorInvitar } from "@/schemas/inspectores";

export function FormularioInvitarInspector({ hrefCerrar }: { hrefCerrar: string }) {
  const router = useRouter();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InspectorInvitar>({ resolver: zodResolver(inspectorInvitarSchema) });

  async function invitar(datos: InspectorInvitar) {
    setErrorGeneral(null);
    try {
      await apiFetch("/inspectores/invitaciones", { method: "POST", body: JSON.stringify(datos) });
      router.push(hrefCerrar, { scroll: false });
      router.refresh();
    } catch (error) {
      setErrorGeneral(aplicarErroresDeApi(error, setError));
    }
  }

  return (
    <form onSubmit={handleSubmit(invitar)} noValidate className="flex min-h-0 flex-1 flex-col">
      <PanelCuerpo>
        {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}
        <Campo
          id="nombre"
          etiqueta="Nombre completo"
          placeholder="Ej.: Paula Gómez"
          error={errors.nombre?.message}
          {...register("nombre")}
        />
        <Campo
          id="email"
          etiqueta="Correo"
          type="email"
          placeholder="nombre@inmobiliaria.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Aviso>
          Recibirá un correo para crear su contraseña. Entrará con el rol de inspector en tu inmobiliaria.
        </Aviso>
      </PanelCuerpo>
      <PanelPie>
        <Link href={hrefCerrar} scroll={false} className={clasesBoton({ variante: "secundario" })}>
          Cancelar
        </Link>
        <Boton type="submit" cargando={isSubmitting} textoCargando="Enviando…">
          Enviar invitación
        </Boton>
      </PanelPie>
    </form>
  );
}
