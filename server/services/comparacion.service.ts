import "server-only";
import { compararDetalles } from "@/lib/comparacion";
import type { InspeccionResumen } from "@/lib/inspecciones";
import type { Inspeccion } from "@/schemas/inspecciones";
import { ConflictError } from "@/server/http/errores";
import * as repositorio from "@/server/repositories/inspecciones.repository";
import { obtenerInspeccion } from "./inspecciones.service";

function exigirComparables(salida: Inspeccion, entrada: Inspeccion) {
  const invalida = (detalle: string) => new ConflictError(detalle, "COMPARACION_INVALIDA");

  if (salida.inmueble.id !== entrada.inmueble.id) {
    throw invalida("Solo se pueden comparar inspecciones del mismo inmueble.");
  }
  if (salida.tipo !== "SALIDA" || entrada.tipo !== "ENTRADA") {
    throw invalida("La comparación es entre una inspección de salida y una de entrada.");
  }
  if (salida.estado !== "FINALIZADA" || entrada.estado !== "FINALIZADA") {
    throw invalida("Las dos inspecciones deben estar finalizadas.");
  }
  if ((entrada.finalizadaEn ?? "") >= (salida.finalizadaEn ?? "")) {
    throw invalida("La entrada debe ser anterior a la salida.");
  }
}

// La comparación se calcula a demanda con los snapshots de cada inspección:
// no se guarda en ninguna tabla. Si alguna de las dos no es visible para el
// usuario, obtenerInspeccion responde 404 antes de comparar.
export async function compararInspecciones(salidaId: string, entradaId: string) {
  const [salida, entrada] = await Promise.all([obtenerInspeccion(salidaId), obtenerInspeccion(entradaId)]);
  exigirComparables(salida, entrada);

  const [detallesEntrada, detallesSalida] = await Promise.all([
    repositorio.listarDetalles(entradaId),
    repositorio.listarDetalles(salidaId),
  ]);

  return { entradaId, salidaId, ...compararDetalles(detallesEntrada, detallesSalida) };
}

// Entradas finalizadas del mismo inmueble y anteriores a la salida.
export async function listarEntradasComparables(salida: Inspeccion): Promise<InspeccionResumen[]> {
  const inspecciones = await repositorio.listarInspeccionesDeInmueble(salida.inmueble.id);
  return inspecciones.filter(
    (inspeccion) =>
      inspeccion.tipo === "ENTRADA" &&
      inspeccion.estado === "FINALIZADA" &&
      (inspeccion.finalizadaEn ?? "") < (salida.finalizadaEn ?? ""),
  );
}
