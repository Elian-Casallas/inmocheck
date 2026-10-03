import "server-only";
import { armarPaginado } from "@/schemas/comun";
import type { PropietarioCrear, PropietarioEditar, PropietariosFiltro } from "@/schemas/propietarios";
import type { Actor } from "@/server/auth/sesion";
import { NotFoundError } from "@/server/http/errores";
import * as repositorio from "@/server/repositories/propietarios.repository";

// El servicio aplica las reglas de negocio. Recibe al actor ya validado y
// de él saca la organización: nunca del cuerpo de la petición.

export async function listarPropietarios(filtro: PropietariosFiltro) {
  const { filas, total } = await repositorio.listarPropietarios(filtro);
  return armarPaginado(filas, total, filtro.page, filtro.pageSize);
}

export async function obtenerPropietario(id: string) {
  const propietario = await repositorio.buscarPropietario(id);
  // Si es de otra organización, RLS lo oculta y aquí llega null: 404 en ambos casos.
  if (!propietario) throw new NotFoundError();
  return propietario;
}

export function crearPropietario(actor: Actor, datos: PropietarioCrear) {
  return repositorio.insertarPropietario(actor.organizacion.id, datos);
}

export async function editarPropietario(id: string, datos: PropietarioEditar) {
  const propietario = await repositorio.actualizarPropietario(id, datos);
  if (!propietario) throw new NotFoundError();
  return propietario;
}

export const listarOpcionesPropietario = repositorio.listarOpcionesPropietario;
