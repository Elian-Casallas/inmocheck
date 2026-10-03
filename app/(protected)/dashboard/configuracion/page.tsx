import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { ListaDatos } from "@/components/ui/ListaDatos";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { BotonCambiarContrasena } from "@/features/auth/components/BotonCambiarContrasena";
import {
  CONTRASENA_MINIMA,
  ETIQUETA_ROL,
  FOTOS_MAXIMAS_POR_ELEMENTO,
  FOTO_TAMANO_MAXIMO_BYTES,
  ZONA_HORARIA,
} from "@/lib/constantes";
import { exigirActor } from "@/server/auth/sesion";

const MEGABYTE = 1024 * 1024;

export default async function PaginaConfiguracion() {
  const actor = await exigirActor();

  return (
    <div className="flex max-w-[880px] flex-col gap-6">
      <EncabezadoPagina titulo="Configuración" />

      <Tarjeta className="flex flex-col gap-4">
        <h2 className="text-titulo-seccion font-semibold">Tu perfil</h2>
        <ListaDatos
          columnas={2}
          datos={[
            { etiqueta: "Nombre", valor: actor.nombre },
            { etiqueta: "Rol", valor: ETIQUETA_ROL[actor.rol] },
            { etiqueta: "Correo", valor: actor.email },
            { etiqueta: "Inmobiliaria", valor: actor.organizacion.nombre },
          ]}
        />
        <p className="text-pequeno font-medium text-texto-tenue">
          Para cambiar tu nombre o tu correo, contacta al administrador de tu inmobiliaria.
        </p>
      </Tarjeta>

      <Tarjeta className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-titulo-seccion font-semibold">Contraseña</h2>
          <p className="text-cuerpo-sm text-texto-secundario">
            Te enviaremos un enlace a tu correo para cambiarla. Mínimo {CONTRASENA_MINIMA} caracteres, con
            una letra y un número.
          </p>
        </div>
        <BotonCambiarContrasena email={actor.email} />
      </Tarjeta>

      {actor.rol === "ADMIN" && (
        <Tarjeta className="flex flex-col gap-4">
          <h2 className="text-titulo-seccion font-semibold">Reglas de las inspecciones</h2>
          <ListaDatos
            columnas={2}
            datos={[
              {
                etiqueta: "Fotos por elemento",
                valor: `Hasta ${FOTOS_MAXIMAS_POR_ELEMENTO}, de máximo ${FOTO_TAMANO_MAXIMO_BYTES / MEGABYTE} MB`,
              },
              { etiqueta: "Formatos de foto", valor: "JPEG, PNG o WebP" },
              { etiqueta: "Zona horaria", valor: ZONA_HORARIA.replace("_", " ") },
              { etiqueta: "Enlaces a fotos y PDF", valor: "Privados, vencen en 60 segundos" },
            ]}
          />
        </Tarjeta>
      )}
    </div>
  );
}
