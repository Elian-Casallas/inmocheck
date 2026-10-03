"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Aviso } from "@/components/ui/Aviso";
import { Badge } from "@/components/ui/Badge";
import { Boton, clasesBoton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { PanelCuerpo, PanelPie } from "@/components/ui/PanelLateral";
import { apiFetch } from "@/lib/api/client";
import { aplicarErroresDeApi, textoONull } from "@/lib/formularios";
import { propietarioCrearSchema, type Propietario, type PropietarioCrear } from "@/schemas/propietarios";

type Props = {
  hrefCerrar: string;
  // Sin propietario → registrar. Con propietario → editar.
  propietario?: Propietario;
};

export function FormularioPropietario({ hrefCerrar, propietario }: Props) {
  const router = useRouter();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PropietarioCrear>({
    resolver: zodResolver(propietarioCrearSchema),
    defaultValues: propietario
      ? { nombre: propietario.nombre, email: propietario.email, telefono: propietario.telefono }
      : undefined,
  });

  async function guardar(datos: PropietarioCrear) {
    setErrorGeneral(null);
    try {
      await apiFetch(propietario ? `/propietarios/${propietario.id}` : "/propietarios", {
        method: propietario ? "PATCH" : "POST",
        body: JSON.stringify(datos),
      });
      router.push(hrefCerrar, { scroll: false });
      router.refresh();
    } catch (error) {
      setErrorGeneral(aplicarErroresDeApi(error, setError));
    }
  }

  return (
    <form onSubmit={handleSubmit(guardar)} noValidate className="flex min-h-0 flex-1 flex-col">
      <PanelCuerpo>
        {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}
        <Campo
          id="nombre"
          etiqueta="Nombre completo"
          placeholder="Ej.: María López"
          error={errors.nombre?.message}
          {...register("nombre")}
        />
        <Campo
          id="email"
          etiqueta="Correo"
          opcional
          type="email"
          placeholder="nombre@correo.com"
          error={errors.email?.message}
          {...register("email", { setValueAs: textoONull })}
        />
        <Campo
          id="telefono"
          etiqueta="Teléfono"
          opcional
          placeholder="+57 300 000 0000"
          error={errors.telefono?.message}
          {...register("telefono", { setValueAs: textoONull })}
        />

        {propietario ? (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-cuerpo-sm font-medium">Inmuebles</span>
              {propietario.inmuebles.length === 0 ? (
                <p className="text-cuerpo-sm text-texto-secundario">Aún no tiene inmuebles registrados.</p>
              ) : (
                <ul className="rounded-xl border border-borde">
                  {propietario.inmuebles.map((inmueble) => (
                    <li key={inmueble.id} className="border-t border-borde first:border-t-0">
                      <Link
                        href={`/dashboard/inmuebles/${inmueble.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 text-cuerpo-sm font-medium hover:bg-sutil"
                      >
                        {inmueble.codigo}
                        {!inmueble.activo && <Badge tono="inactivo">Inactivo</Badge>}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-pequeno font-medium text-texto-tenue">
              Cambiar estos datos no modifica las actas ya finalizadas.
            </p>
          </>
        ) : (
          <Aviso>Pide solo los datos necesarios para contactar al propietario.</Aviso>
        )}
      </PanelCuerpo>
      <PanelPie>
        <Link href={hrefCerrar} scroll={false} className={clasesBoton({ variante: "secundario" })}>
          Cancelar
        </Link>
        <Boton type="submit" cargando={isSubmitting} textoCargando="Guardando…">
          {propietario ? "Guardar cambios" : "Guardar propietario"}
        </Boton>
      </PanelPie>
    </form>
  );
}
