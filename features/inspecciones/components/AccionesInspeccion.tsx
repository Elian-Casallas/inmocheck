"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Aviso } from "@/components/ui/Aviso";
import { Boton, clasesBoton } from "@/components/ui/Boton";
import { CampoAreaTexto, CampoSeleccion } from "@/components/ui/CampoSeleccion";
import { PanelCuerpo, PanelPie } from "@/components/ui/PanelLateral";
import { apiFetch, mensajeDeError } from "@/lib/api/client";
import { aplicarErroresDeApi, textoONull } from "@/lib/formularios";
import {
  inspeccionCancelarSchema,
  inspeccionReasignarSchema,
  type InspeccionCancelar,
  type InspeccionReasignar,
} from "@/schemas/inspecciones";

// ---------- Inspector: iniciar ----------

type PropsIniciar = { inspeccionId: string; version: number };

// Iniciar es una acción explícita (POST /inicio): abrir la ficha no cambia el estado.
export function BotonIniciarInspeccion({ inspeccionId, version }: PropsIniciar) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function iniciar() {
    setEnviando(true);
    setError(null);
    try {
      await apiFetch(`/inspecciones/${inspeccionId}/inicio`, {
        method: "POST",
        body: JSON.stringify({ version }),
      });
      router.push(`/dashboard/inspecciones/${inspeccionId}/realizar`);
      router.refresh();
    } catch (causa) {
      setError(mensajeDeError(causa));
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-1.5">
      <Boton onClick={iniciar} cargando={enviando} textoCargando="Iniciando…">
        Iniciar inspección
      </Boton>
      <span className={`text-center text-pequeno font-medium ${error ? "text-error" : "text-texto-tenue"}`} role={error ? "alert" : undefined}>
        {error ?? "Pasará a «En proceso»."}
      </span>
    </div>
  );
}

// ---------- Administrador: reasignar ----------

type PropsReasignar = {
  inspeccionId: string;
  version: number;
  inspectorActualId: string | undefined;
  inspectores: { id: string; nombre: string }[];
  hrefCerrar: string;
};

export function FormularioReasignar({ inspeccionId, version, inspectorActualId, inspectores, hrefCerrar }: PropsReasignar) {
  const router = useRouter();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InspeccionReasignar>({
    resolver: zodResolver(inspeccionReasignarSchema),
    defaultValues: { version },
  });

  async function reasignar(datos: InspeccionReasignar) {
    setErrorGeneral(null);
    try {
      await apiFetch(`/inspecciones/${inspeccionId}/reasignaciones`, { method: "POST", body: JSON.stringify(datos) });
      router.push(hrefCerrar, { scroll: false });
      router.refresh();
    } catch (error) {
      setErrorGeneral(aplicarErroresDeApi(error, setError));
    }
  }

  return (
    <form onSubmit={handleSubmit(reasignar)} noValidate className="flex min-h-0 flex-1 flex-col">
      <PanelCuerpo>
        {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}
        <CampoSeleccion
          id="inspectorId"
          etiqueta="Nuevo inspector"
          textoVacio="Selecciona un inspector"
          opciones={inspectores
            .filter(({ id }) => id !== inspectorActualId)
            .map(({ id, nombre }) => ({ valor: id, texto: nombre }))}
          error={errors.inspectorId?.message}
          {...register("inspectorId")}
        />
        <CampoAreaTexto
          id="motivo"
          etiqueta="Motivo (obligatorio si ya está en proceso)"
          placeholder="Ej.: la inspectora original está incapacitada"
          error={errors.motivo?.message}
          {...register("motivo", { setValueAs: textoONull })}
        />
        <Aviso>El cambio queda registrado en la actividad de la inspección.</Aviso>
      </PanelCuerpo>
      <PanelPie>
        <Link href={hrefCerrar} scroll={false} className={clasesBoton({ variante: "secundario" })}>
          Volver
        </Link>
        <Boton type="submit" cargando={isSubmitting} textoCargando="Reasignando…">
          Reasignar
        </Boton>
      </PanelPie>
    </form>
  );
}

// ---------- Administrador: cancelar ----------

type PropsCancelar = { inspeccionId: string; version: number; hrefCerrar: string };

export function FormularioCancelar({ inspeccionId, version, hrefCerrar }: PropsCancelar) {
  const router = useRouter();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InspeccionCancelar>({
    resolver: zodResolver(inspeccionCancelarSchema),
    defaultValues: { version },
  });

  async function cancelar(datos: InspeccionCancelar) {
    setErrorGeneral(null);
    try {
      await apiFetch(`/inspecciones/${inspeccionId}/cancelacion`, { method: "POST", body: JSON.stringify(datos) });
      router.push(hrefCerrar, { scroll: false });
      router.refresh();
    } catch (error) {
      setErrorGeneral(aplicarErroresDeApi(error, setError));
    }
  }

  return (
    <form onSubmit={handleSubmit(cancelar)} noValidate className="flex min-h-0 flex-1 flex-col">
      <PanelCuerpo>
        {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}
        <CampoAreaTexto
          id="motivo"
          etiqueta="Motivo de la cancelación"
          placeholder="Ej.: el ocupante canceló la visita"
          error={errors.motivo?.message}
          {...register("motivo")}
        />
        <Aviso>La inspección no se borra: queda como «Cancelada» y no se podrá reabrir.</Aviso>
      </PanelCuerpo>
      <PanelPie>
        <Link href={hrefCerrar} scroll={false} className={clasesBoton({ variante: "secundario" })}>
          Volver
        </Link>
        <Boton type="submit" variante="peligro" cargando={isSubmitting} textoCargando="Cancelando…">
          Cancelar inspección
        </Boton>
      </PanelPie>
    </form>
  );
}
