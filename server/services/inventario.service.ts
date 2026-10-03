import "server-only";
import type { ElementoCrear, ElementoEditar, EspacioCrear, EspacioEditar } from "@/schemas/inventario";
import type { Actor } from "@/server/auth/sesion";
import { NotFoundError } from "@/server/http/errores";
import { buscarInmueble } from "@/server/repositories/inmuebles.repository";
import * as repositorio from "@/server/repositories/inventario.repository";

// Regla clave del inventario: editarlo solo afecta inspecciones FUTURAS.
// Las ya creadas guardan su propia copia (snapshot) en detalles_inspeccion,
// por eso aquí nunca se toca esa tabla y nada se borra: se desactiva.

export async function listarEspacios(inmuebleId: string) {
  // Si el inmueble no es visible para el usuario (otra organización o
  // inspector no asignado), RLS devuelve null y se responde 404.
  if (!(await buscarInmueble(inmuebleId))) throw new NotFoundError();
  return repositorio.listarEspacios(inmuebleId);
}

export async function crearEspacio(actor: Actor, inmuebleId: string, datos: EspacioCrear) {
  if (!(await buscarInmueble(inmuebleId))) throw new NotFoundError();

  return repositorio.insertarEspacio({
    organizacion_id: actor.organizacion.id,
    inmueble_id: inmuebleId,
    nombre: datos.nombre,
    orden: datos.orden ?? (await repositorio.siguienteOrdenEspacio(inmuebleId)),
  });
}

export async function editarEspacio(id: string, datos: EspacioEditar) {
  const espacio = await repositorio.actualizarEspacio(id, datos);
  if (!espacio) throw new NotFoundError();
  return espacio;
}

export async function crearElemento(actor: Actor, espacioId: string, datos: ElementoCrear) {
  // Antes de agregar un elemento se comprueba que el espacio exista y sea
  // de MI organización. RLS ya filtra la lectura; además la llave foránea
  // compuesta impide insertar un elemento apuntando a un espacio ajeno.
  const espacio = await repositorio.buscarEspacioBase(espacioId);
  if (!espacio || espacio.organizacion_id !== actor.organizacion.id) throw new NotFoundError();

  return repositorio.insertarElemento({
    organizacion_id: actor.organizacion.id,
    espacio_id: espacioId,
    nombre: datos.nombre,
    obligatorio: datos.obligatorio,
    orden: datos.orden ?? (await repositorio.siguienteOrdenElemento(espacioId)),
  });
}

export async function editarElemento(id: string, datos: ElementoEditar) {
  const elemento = await repositorio.actualizarElemento(id, datos);
  if (!elemento) throw new NotFoundError();
  return elemento;
}
