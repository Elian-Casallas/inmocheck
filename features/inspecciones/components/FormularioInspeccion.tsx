"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Aviso } from "@/components/ui/Aviso";
import { Boton, clasesBoton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { CampoAreaTexto, CampoSeleccion } from "@/components/ui/CampoSeleccion";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { ApiError, apiFetch } from "@/lib/api/client";
import { DESFASE_BOGOTA } from "@/lib/formato";
import { aplicarErroresDeApi, textoONull } from "@/lib/formularios";
import {
  ETIQUETA_TIPO_INSPECCION,
  MENSAJE_FECHA_PASADA,
  TIPOS_INSPECCION,
  sePuedeProgramar,
  type TipoInspeccion,
} from "@/lib/inspecciones";
import type { Inspeccion } from "@/schemas/inspecciones";
import { z } from "@/schemas/zod";

const DESCRIPCION_TIPO: Record<TipoInspeccion, string> = {
  ENTRADA: "Al entregar el inmueble",
  SALIDA: "Al recibirlo de vuelta",
  SEGUIMIENTO: "Revisión periódica",
};

// Esquema del formulario: fecha y hora van en campos separados y al enviar
// se unen en un solo instante. La API vuelve a validar con su propio esquema.
const formularioSchema = z
  .object({
    inmuebleId: z.uuid("Selecciona un inmueble."),
    inspectorId: z.uuid("Selecciona un inspector."),
    tipo: z.enum(TIPOS_INSPECCION, "Selecciona el tipo de inspección."),
    fecha: z.iso.date("Selecciona la fecha."),
    hora: z.string().regex(/^\d{2}:\d{2}$/, "Selecciona la hora."),
    nota: z.string().max(1000).nullable().optional(),
  })
  // No se programa en el pasado: nacería como "No realizada".
  .refine(({ fecha, hora }) => sePuedeProgramar(`${fecha}T${hora}:00${DESFASE_BOGOTA}`), {
    path: ["fecha"],
    message: MENSAJE_FECHA_PASADA,
  });
type DatosFormulario = z.infer<typeof formularioSchema>;

type Props = {
  inmuebles: { id: string; codigo: string; direccion: string }[];
  inspectores: { id: string; nombre: string }[];
  inmuebleInicial?: string;
  // Fecha de hoy en Colombia (AAAA-MM-DD). El calendario no deja elegir días anteriores.
  fechaMinima: string;
};

export function FormularioInspeccion({ inmuebles, inspectores, inmuebleInicial, fechaMinima }: Props) {
  const router = useRouter();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DatosFormulario>({
    resolver: zodResolver(formularioSchema),
    defaultValues: { inmuebleId: inmuebleInicial ?? "", hora: "09:00" },
  });
  const tipoElegido = useWatch({ control, name: "tipo" });

  async function programar({ fecha, hora, ...resto }: DatosFormulario) {
    setErrorGeneral(null);
    try {
      const { data } = await apiFetch<{ data: Inspeccion }>("/inspecciones", {
        method: "POST",
        // La persona escribe hora de Colombia; se envía con su desfase (-05:00)
        // y la base la guarda en UTC.
        body: JSON.stringify({ ...resto, programadaPara: `${fecha}T${hora}:00${DESFASE_BOGOTA}` }),
      });
      router.push(`/dashboard/inspecciones/${data.id}`);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.code === "INVENTARIO_VACIO") {
        setError("inmuebleId", { message: error.message }, { shouldFocus: true });
        return;
      }
      if (error instanceof ApiError && error.code === "FECHA_PASADA") {
        setError("fecha", { message: error.message }, { shouldFocus: true });
        return;
      }
      setErrorGeneral(aplicarErroresDeApi(error, setError));
    }
  }

  return (
    <Tarjeta>
      <form onSubmit={handleSubmit(programar)} noValidate className="flex flex-col gap-6">
        {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}

        <section className="flex flex-col gap-4">
          <h2 className="text-titulo-seccion font-semibold">Inmueble</h2>
          <CampoSeleccion
            id="inmuebleId"
            etiqueta="Inmueble"
            textoVacio="Selecciona un inmueble"
            opciones={inmuebles.map(({ id, codigo, direccion }) => ({ valor: id, texto: `${codigo} · ${direccion}` }))}
            error={errors.inmuebleId?.message}
            {...register("inmuebleId")}
          />
          <Aviso>
            Solo aparecen inmuebles activos. La inspección guarda una copia del inventario tal como está
            hoy.
          </Aviso>
        </section>

        <hr className="border-borde" />

        <section className="flex flex-col gap-4">
          <h2 className="text-titulo-seccion font-semibold">Tipo de inspección</h2>
          <div role="radiogroup" aria-label="Tipo de inspección" className="grid gap-3 sm:grid-cols-3">
            {TIPOS_INSPECCION.map((tipo) => (
              <label key={tipo} className="relative">
                <input type="radio" value={tipo} className="peer absolute opacity-0" {...register("tipo")} />
                <span className="flex h-full cursor-pointer flex-col gap-0.5 rounded-lg border border-borde-fuerte bg-tarjeta px-4 py-3.5 peer-checked:border-primario peer-checked:bg-primario-suave peer-checked:ring-1 peer-checked:ring-primario peer-focus-visible:outline-3 peer-focus-visible:outline-primario/35">
                  <span className="text-cuerpo-sm font-medium">{ETIQUETA_TIPO_INSPECCION[tipo]}</span>
                  <span className="text-pequeno font-medium text-texto-tenue">{DESCRIPCION_TIPO[tipo]}</span>
                </span>
              </label>
            ))}
          </div>
          {errors.tipo && (
            <span role="alert" className="text-pequeno text-error">
              {errors.tipo.message}
            </span>
          )}
          {tipoElegido === "SALIDA" && (
            <Aviso>Al finalizar podrá compararse con una inspección de entrada anterior de este inmueble.</Aviso>
          )}
        </section>

        <hr className="border-borde" />

        <section className="flex flex-col gap-4">
          <h2 className="text-titulo-seccion font-semibold">Programación</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              id="fecha"
              etiqueta="Fecha"
              type="date"
              min={fechaMinima}
              error={errors.fecha?.message}
              {...register("fecha")}
            />
            <Campo id="hora" etiqueta="Hora" type="time" error={errors.hora?.message} {...register("hora")} />
            <CampoSeleccion
              id="inspectorId"
              etiqueta="Inspector responsable"
              textoVacio="Selecciona un inspector"
              className="sm:col-span-2"
              opciones={inspectores.map(({ id, nombre }) => ({ valor: id, texto: nombre }))}
              error={errors.inspectorId?.message}
              {...register("inspectorId")}
            />
            <CampoAreaTexto
              id="nota"
              etiqueta="Nota para el inspector"
              opcional
              className="sm:col-span-2"
              placeholder="Ej.: Revisar especialmente la cocina"
              error={errors.nota?.message}
              {...register("nota", { setValueAs: textoONull })}
            />
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-borde pt-5 sm:flex-row sm:justify-end">
          <Link href="/dashboard/inspecciones" className={clasesBoton({ variante: "secundario" })}>
            Cancelar
          </Link>
          <Boton type="submit" cargando={isSubmitting} textoCargando="Programando…">
            Programar inspección
          </Boton>
        </div>
      </form>
    </Tarjeta>
  );
}
