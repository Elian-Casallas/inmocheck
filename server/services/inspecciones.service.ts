import "server-only";
import type { EstadoInspeccion } from "@/lib/inspecciones";
import { calcularProgreso } from "@/lib/progreso";
import { armarPaginado } from "@/schemas/comun";
import type {
  DetalleGuardar,
  Inspeccion,
  InspeccionCancelar,
  InspeccionCrear,
  InspeccionEditar,
  InspeccionReasignar,
  InspeccionesFiltro,
} from "@/schemas/inspecciones";
import { AppError, ConflictError, ForbiddenError, NotFoundError } from "@/server/http/errores";
import * as repositorio from "@/server/repositories/inspecciones.repository";

// Las reglas del flujo (transiciones, versión, obligatorios) viven en las
// funciones SQL. Este servicio las invoca y traduce sus errores a HTTP.

const CONFLICTOS: Record<string, string> = {
  VERSION_CONFLICT: "Alguien más modificó estos datos. Recarga para ver la versión actual.",
  TRANSICION_INVALIDA: "La inspección ya no está en un estado que permita esta acción.",
  INSPECCION_CERRADA: "La inspección ya está cerrada y no se puede modificar.",
  INSPECCION_NO_INICIADA: "Primero debes iniciar la inspección.",
  INSPECCION_VENCIDA:
    "El plazo para iniciar esta inspección ya venció. Pide al administrador que la reprograme.",
  INVENTARIO_VACIO: "El inmueble no tiene inventario. Agrega espacios y elementos antes de programar.",
  INMUEBLE_NO_DISPONIBLE: "El inmueble no existe o está inactivo.",
  INSPECTOR_NO_DISPONIBLE: "El inspector no existe o está inactivo.",
  MISMO_INSPECTOR: "La inspección ya está asignada a ese inspector.",
  MOTIVO_REQUERIDO: "Escribe el motivo.",
  OBSERVACION_REQUERIDA: "Explica por qué este elemento obligatorio no aplica.",
};

type ErrorPostgres = { code?: string; message?: string; details?: string };

function traducirErrorDeFlujo(error: unknown): unknown {
  if (error instanceof AppError || typeof error !== "object" || error === null) return error;
  const { message = "", details } = error as ErrorPostgres;

  if (message === "NO_ENCONTRADA") return new NotFoundError();
  if (message === "SIN_PERMISO") return new ForbiddenError();
  if (message === "INSPECCION_INCOMPLETA") {
    return new ConflictError(
      `Hay ${details ?? "algunos"} elementos obligatorios sin evaluar.`,
      "INSPECCION_INCOMPLETA",
    );
  }
  if (message in CONFLICTOS) return new ConflictError(CONFLICTOS[message], message);
  return error;
}

async function ejecutar<T>(accion: () => Promise<T>): Promise<T> {
  try {
    return await accion();
  } catch (error) {
    throw traducirErrorDeFlujo(error);
  }
}

// ---------- Consultas ----------

export async function listarInspecciones(filtro: InspeccionesFiltro, estados?: EstadoInspeccion[]) {
  const { filas, total } = await repositorio.listarInspecciones(filtro, estados);
  return armarPaginado(filas, total, filtro.page, filtro.pageSize);
}

export async function obtenerInspeccion(id: string): Promise<Inspeccion> {
  const fila = await repositorio.buscarInspeccion(id);
  // RLS oculta las de otra organización y las no asignadas: 404 en todos los casos.
  if (!fila) throw new NotFoundError();

  const { avance, ...inspeccion } = fila;
  return { ...inspeccion, progreso: calcularProgreso(avance) };
}

export async function listarDetalles(inspeccionId: string) {
  await obtenerInspeccion(inspeccionId);
  const detalles = await repositorio.listarDetalles(inspeccionId);
  return { data: detalles, meta: calcularProgreso(detalles) };
}

export const contarPorEstado = repositorio.contarPorEstado;
export const listarActividad = repositorio.listarActividad;

// ---------- Acciones ----------

export async function crearInspeccion(datos: InspeccionCrear) {
  const id = await ejecutar(() => repositorio.rpcCrear(datos));
  return obtenerInspeccion(id);
}

export async function editarInspeccion(id: string, datos: InspeccionEditar) {
  await ejecutar(() => repositorio.rpcEditar(id, datos));
  return obtenerInspeccion(id);
}

export async function iniciarInspeccion(id: string, version: number) {
  await ejecutar(() => repositorio.rpcIniciar(id, version));
  return obtenerInspeccion(id);
}

export async function finalizarInspeccion(id: string, version: number) {
  await ejecutar(() => repositorio.rpcFinalizar(id, version));
  return obtenerInspeccion(id);
}

export async function cancelarInspeccion(id: string, datos: InspeccionCancelar) {
  await ejecutar(() => repositorio.rpcCancelar(id, datos));
  return obtenerInspeccion(id);
}

export async function reasignarInspeccion(id: string, datos: InspeccionReasignar) {
  await ejecutar(() => repositorio.rpcReasignar(id, datos));
  return obtenerInspeccion(id);
}

export async function guardarDetalle(inspeccionId: string, detalleId: string, datos: DetalleGuardar) {
  const version = await ejecutar(() => repositorio.rpcGuardarDetalle(inspeccionId, detalleId, datos));
  return {
    id: detalleId,
    estado: datos.estado,
    observacion: datos.observacion?.trim() || null,
    version,
  };
}
