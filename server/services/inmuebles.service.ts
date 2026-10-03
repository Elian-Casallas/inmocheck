import "server-only";
import { armarPaginado } from "@/schemas/comun";
import type { InmuebleCrear, InmuebleEditar, InmueblesFiltro } from "@/schemas/inmuebles";
import type { Actor } from "@/server/auth/sesion";
import { AppError, ConflictError, NotFoundError } from "@/server/http/errores";
import * as repositorio from "@/server/repositories/inmuebles.repository";
import { esLlaveForaneaInvalida, esViolacionUnica } from "@/server/repositories/utilidades";

export async function listarInmuebles(filtro: InmueblesFiltro) {
  const { filas, total } = await repositorio.listarInmuebles(filtro);
  return armarPaginado(filas, total, filtro.page, filtro.pageSize);
}

export async function obtenerInmueble(id: string) {
  const inmueble = await repositorio.buscarInmueble(id);
  if (!inmueble) throw new NotFoundError();
  return inmueble;
}

export async function crearInmueble(actor: Actor, datos: InmuebleCrear) {
  try {
    return await repositorio.insertarInmueble(actor.organizacion.id, datos);
  } catch (error) {
    throw traducirErrorDeGuardado(error);
  }
}

export async function editarInmueble(id: string, datos: InmuebleEditar) {
  if (datos.activo === false) await exigirSinInspeccionesAbiertas(id);

  try {
    const inmueble = await repositorio.actualizarInmueble(id, datos);
    if (!inmueble) throw new NotFoundError();
    return inmueble;
  } catch (error) {
    throw traducirErrorDeGuardado(error);
  }
}

// "Eliminar" es desactivar: el inmueble y todo su historial se conservan (CA-13).
export async function desactivarInmueble(id: string) {
  await editarInmueble(id, { activo: false });
}

async function exigirSinInspeccionesAbiertas(inmuebleId: string) {
  const abiertas = await repositorio.contarInspeccionesAbiertas(inmuebleId);
  if (abiertas > 0) {
    throw new ConflictError(
      "El inmueble tiene inspecciones pendientes o en proceso. Cancélalas o espera a que finalicen.",
      "INMUEBLE_CON_INSPECCIONES_ABIERTAS",
    );
  }
}

// La base de datos es quien garantiza las reglas (UNIQUE, llave foránea);
// aquí solo se traduce su error a uno que la interfaz pueda mostrar.
function traducirErrorDeGuardado(error: unknown): unknown {
  if (error instanceof AppError || typeof error !== "object" || error === null) return error;

  if (esViolacionUnica(error)) {
    return new ConflictError(
      "Ya existe un inmueble con ese código en tu inmobiliaria.",
      "CODIGO_INMUEBLE_DUPLICADO",
    );
  }
  if (esLlaveForaneaInvalida(error)) {
    return new ConflictError("El propietario seleccionado no existe.", "PROPIETARIO_INVALIDO");
  }
  return error;
}

export const contarInmueblesActivos = repositorio.contarInmueblesActivos;
