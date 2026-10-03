"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Aviso } from "@/components/ui/Aviso";
import { Boton, clasesBoton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { CampoAreaTexto, CampoSeleccion } from "@/components/ui/CampoSeleccion";
import { Icono } from "@/components/ui/Icono";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { ApiError, apiFetch } from "@/lib/api/client";
import { aplicarErroresDeApi, numeroONull, textoONull } from "@/lib/formularios";
import {
  ETIQUETA_TIPO_INMUEBLE,
  TIPOS_INMUEBLE,
  inmuebleCrearSchema,
  type Inmueble,
  type InmuebleCrear,
} from "@/schemas/inmuebles";

const OPCIONES_TIPO = TIPOS_INMUEBLE.map((tipo) => ({ valor: tipo, texto: ETIQUETA_TIPO_INMUEBLE[tipo] }));

type Props = {
  propietarios: { id: string; nombre: string }[];
  // Sin inmueble → modo crear. Con inmueble → modo editar.
  inmueble?: Inmueble;
};

// Un solo formulario para crear y editar: mismos campos, mismo esquema.
// Lo único que cambia es el método (POST o PATCH) y a dónde se va después.
export function FormularioInmueble({ propietarios, inmueble }: Props) {
  const router = useRouter();
  const esEdicion = Boolean(inmueble);
  const rutaCancelar = inmueble ? `/dashboard/inmuebles/${inmueble.id}` : "/dashboard/inmuebles";
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InmuebleCrear>({
    resolver: zodResolver(inmuebleCrearSchema),
    defaultValues: inmueble
      ? {
          codigo: inmueble.codigo,
          tipo: inmueble.tipo,
          direccion: inmueble.direccion,
          barrio: inmueble.barrio,
          ciudad: inmueble.ciudad,
          departamento: inmueble.departamento,
          habitaciones: inmueble.habitaciones,
          banos: inmueble.banos,
          areaM2: inmueble.areaM2,
          propietarioId: inmueble.propietario?.id,
          descripcion: inmueble.descripcion,
        }
      : { ciudad: "Villavicencio", departamento: "Meta" },
  });

  async function guardar(datos: InmuebleCrear) {
    setErrorGeneral(null);
    try {
      const { data } = await apiFetch<{ data: Inmueble }>(
        inmueble ? `/inmuebles/${inmueble.id}` : "/inmuebles",
        { method: inmueble ? "PATCH" : "POST", body: JSON.stringify(datos) },
      );
      // Solo se navega después de que el servidor confirma el guardado.
      router.push(esEdicion ? `/dashboard/inmuebles/${data.id}` : `/dashboard/inmuebles/${data.id}/inventario`);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.code === "CODIGO_INMUEBLE_DUPLICADO") {
        // El 409 de la API se muestra justo en el campo que lo causó.
        setError("codigo", { message: error.message }, { shouldFocus: true });
        return;
      }
      setErrorGeneral(aplicarErroresDeApi(error, setError));
    }
  }

  return (
    <Tarjeta>
      <form onSubmit={handleSubmit(guardar)} noValidate className="flex flex-col gap-6">
        {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}

        <Seccion titulo="Datos generales">
          <Campo
            id="codigo"
            etiqueta="Código interno"
            placeholder="Ej.: APT-302"
            ayuda="Debe ser único en tu inmobiliaria."
            error={errors.codigo?.message}
            {...register("codigo")}
          />
          <CampoSeleccion
            id="tipo"
            etiqueta="Tipo"
            opciones={OPCIONES_TIPO}
            error={errors.tipo?.message}
            {...register("tipo")}
          />
          <Campo
            id="habitaciones"
            etiqueta="Habitaciones"
            type="number"
            min={0}
            placeholder="0"
            error={errors.habitaciones?.message}
            {...register("habitaciones", { valueAsNumber: true })}
          />
          <Campo
            id="banos"
            etiqueta="Baños"
            type="number"
            min={0}
            placeholder="0"
            error={errors.banos?.message}
            {...register("banos", { valueAsNumber: true })}
          />
          <Campo
            id="areaM2"
            etiqueta="Área en m²"
            opcional
            inputMode="decimal"
            placeholder="Ej.: 85,5"
            error={errors.areaM2?.message}
            {...register("areaM2", { setValueAs: numeroONull })}
          />
        </Seccion>

        <hr className="border-borde" />

        <Seccion titulo="Ubicación">
          <Campo
            id="direccion"
            etiqueta="Dirección"
            placeholder="Ej.: Calle 10 #20-30, apto 302"
            className="sm:col-span-2"
            error={errors.direccion?.message}
            {...register("direccion")}
          />
          <Campo
            id="barrio"
            etiqueta="Barrio"
            opcional
            error={errors.barrio?.message}
            {...register("barrio", { setValueAs: textoONull })}
          />
          <Campo id="ciudad" etiqueta="Ciudad" error={errors.ciudad?.message} {...register("ciudad")} />
          <Campo
            id="departamento"
            etiqueta="Departamento"
            error={errors.departamento?.message}
            {...register("departamento")}
          />
        </Seccion>

        <hr className="border-borde" />

        <Seccion titulo="Propietario">
          <CampoSeleccion
            id="propietarioId"
            etiqueta="Propietario"
            textoVacio="Selecciona un propietario"
            opciones={propietarios.map(({ id, nombre }) => ({ valor: id, texto: nombre }))}
            error={errors.propietarioId?.message}
            {...register("propietarioId")}
          />
          <div className="flex items-end">
            <Link href="/dashboard/propietarios?nuevo=1" className={clasesBoton({ variante: "texto" })}>
              <Icono nombre="mas" />
              Registrar propietario nuevo
            </Link>
          </div>
          <CampoAreaTexto
            id="descripcion"
            etiqueta="Descripción"
            opcional
            className="sm:col-span-2"
            error={errors.descripcion?.message}
            {...register("descripcion", { setValueAs: textoONull })}
          />
        </Seccion>

        {!esEdicion && (
          <Aviso>Después de guardar configurarás los espacios y elementos que se van a inspeccionar.</Aviso>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-borde pt-5 sm:flex-row sm:justify-end">
          <Link href={rutaCancelar} className={clasesBoton({ variante: "secundario" })}>
            Cancelar
          </Link>
          <Boton type="submit" cargando={isSubmitting} textoCargando="Guardando…">
            {esEdicion ? "Guardar cambios" : "Guardar inmueble"}
          </Boton>
        </div>
      </form>
    </Tarjeta>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-titulo-seccion font-semibold">{titulo}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
