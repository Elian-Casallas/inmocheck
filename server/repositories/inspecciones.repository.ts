import "server-only";
import type { EstadoElemento, EstadoInspeccion, InspeccionResumen } from "@/lib/inspecciones";
import { crearClienteServidor } from "@/lib/supabase/server";
import type {
  Detalle,
  DetalleGuardar,
  Inspeccion,
  InspeccionCancelar,
  InspeccionCrear,
  InspeccionEditar,
  InspeccionReasignar,
  InspeccionesFiltro,
} from "@/schemas/inspecciones";
import { rangoDePagina } from "./utilidades";

// inspecciones tiene DOS llaves hacia perfiles (inspector y quien la creó),
// por eso hay que decir cuál usar: perfiles!fk_inspeccion_inspector.
const COLUMNAS_RESUMEN =
  "id, tipo, estado, programadaPara:programada_para, finalizadaEn:finalizada_en, " +
  "inmueble:inmuebles (id, codigo, direccion), " +
  "inspector:perfiles!fk_inspeccion_inspector (id, nombre)";

const COLUMNAS_INSPECCION =
  "id, tipo, estado, programadaPara:programada_para, nota, iniciadaEn:iniciada_en, " +
  "finalizadaEn:finalizada_en, canceladaEn:cancelada_en, motivoCancelacion:motivo_cancelacion, version, " +
  "inmueble:inmuebles (id, codigo, direccion, barrio, ciudad), " +
  "inspector:perfiles!fk_inspeccion_inspector (id, nombre), " +
  "avance:detalles_inspeccion (estado, obligatorio:obligatorio_snapshot, observacion)";

const COLUMNAS_DETALLE =
  "id, elementoId:elemento_id, espacioNombre:espacio_nombre_snapshot, " +
  "elementoNombre:elemento_nombre_snapshot, obligatorio:obligatorio_snapshot, estado, observacion, version, " +
  "evidencias (id, mimeType:mime_type, sizeBytes:size_bytes, descripcion, createdAt:created_at)";

export type FilaAvance = { estado: EstadoElemento | null; obligatorio: boolean; observacion: string | null };
export type InspeccionConAvance = Omit<Inspeccion, "progreso"> & { avance: FilaAvance[] };

// ---------- Lecturas ----------

export async function listarInspecciones(filtro: InspeccionesFiltro, estados?: EstadoInspeccion[]) {
  const supabase = await crearClienteServidor();
  const [desde, hasta] = rangoDePagina(filtro.page, filtro.pageSize);
  const soloCerradas = estados?.every((estado) => estado === "FINALIZADA" || estado === "CANCELADA");

  let consulta = supabase
    .from("inspecciones")
    .select(COLUMNAS_RESUMEN, { count: "exact" })
    // Lo pendiente se ordena de lo más próximo a lo más lejano; lo cerrado, al revés.
    .order("programada_para", { ascending: !soloCerradas })
    .range(desde, hasta);

  if (filtro.estado) consulta = consulta.eq("estado", filtro.estado);
  if (estados) consulta = consulta.in("estado", estados);
  if (filtro.tipo) consulta = consulta.eq("tipo", filtro.tipo);
  if (filtro.inmuebleId) consulta = consulta.eq("inmueble_id", filtro.inmuebleId);
  if (filtro.desde) consulta = consulta.gte("programada_para", filtro.desde);
  if (filtro.hasta) consulta = consulta.lte("programada_para", `${filtro.hasta}T23:59:59Z`);

  const { data, count, error } = await consulta;
  if (error) throw error;
  return { filas: (data ?? []) as unknown as InspeccionResumen[], total: count ?? 0 };
}

export async function listarInspeccionesDeInmueble(
  inmuebleId: string,
  limite?: number,
): Promise<InspeccionResumen[]> {
  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("inspecciones")
    .select(COLUMNAS_RESUMEN)
    .eq("inmueble_id", inmuebleId)
    .order("programada_para", { ascending: false });

  if (limite) consulta = consulta.limit(limite);

  const { data, error } = await consulta;
  if (error) throw error;
  return (data ?? []) as unknown as InspeccionResumen[];
}

export async function listarAbiertasDeInspector(inspectorId: string): Promise<InspeccionResumen[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("inspecciones")
    .select(COLUMNAS_RESUMEN)
    .eq("inspector_id", inspectorId)
    .in("estado", ["PENDIENTE", "EN_PROCESO"])
    .order("programada_para");
  if (error) throw error;
  return (data ?? []) as unknown as InspeccionResumen[];
}

// Pendientes cuya hora programada ya pasó. Quien llama decide cuáles de
// ellas ya superaron el plazo para iniciar (estaVencida).
export async function listarPendientesPasadas(): Promise<InspeccionResumen[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("inspecciones")
    .select(COLUMNAS_RESUMEN)
    .eq("estado", "PENDIENTE")
    .lt("programada_para", new Date().toISOString())
    .order("programada_para");
  if (error) throw error;
  return (data ?? []) as unknown as InspeccionResumen[];
}

// Una sola consulta trae todos los estados; el conteo por estado se hace en memoria.
export async function contarPorEstado(): Promise<Record<EstadoInspeccion, number>> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("inspecciones").select("estado");
  if (error) throw error;

  const conteo: Record<EstadoInspeccion, number> = { PENDIENTE: 0, EN_PROCESO: 0, FINALIZADA: 0, CANCELADA: 0 };
  for (const { estado } of (data ?? []) as { estado: EstadoInspeccion }[]) conteo[estado] += 1;
  return conteo;
}

export async function buscarInspeccion(id: string): Promise<InspeccionConAvance | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("inspecciones")
    .select(COLUMNAS_INSPECCION)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as InspeccionConAvance | null;
}

export async function listarDetalles(inspeccionId: string): Promise<Detalle[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("detalles_inspeccion")
    .select(COLUMNAS_DETALLE)
    .eq("inspeccion_id", inspeccionId)
    .order("espacio_orden_snapshot")
    .order("espacio_nombre_snapshot")
    .order("elemento_orden_snapshot")
    .order("created_at", { referencedTable: "evidencias" });
  if (error) throw error;
  return (data ?? []) as unknown as Detalle[];
}

export type Actividad = { id: string; accion: string; fecha: string; actor: { nombre: string } | null };

export async function listarActividad(recursoId: string): Promise<Actividad[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("auditoria")
    .select("id, accion, fecha, actor:perfiles (nombre)")
    .eq("recurso_id", recursoId)
    .order("fecha", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Actividad[];
}

// ---------- Escrituras: siempre por función SQL transaccional (RPC) ----------
// Cada función valida permisos, estado y versión dentro de una transacción.

export async function rpcCrear(datos: InspeccionCrear): Promise<string> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("crear_inspeccion", {
    p_inmueble_id: datos.inmuebleId,
    p_inspector_id: datos.inspectorId,
    p_tipo: datos.tipo,
    p_programada_para: datos.programadaPara,
    p_nota: datos.nota ?? null,
  });
  if (error) throw error;
  return data as string;
}

export async function rpcEditar(id: string, datos: InspeccionEditar) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("editar_inspeccion", {
    p_id: id,
    p_version: datos.version,
    p_programada_para: datos.programadaPara ?? null,
    // null = no cambiar la nota; "" = borrarla.
    p_nota: datos.nota === undefined ? null : (datos.nota ?? ""),
  });
  if (error) throw error;
}

export async function rpcIniciar(id: string, version: number) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("iniciar_inspeccion", { p_id: id, p_version: version });
  if (error) throw error;
}

export async function rpcFinalizar(id: string, version: number) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("finalizar_inspeccion", { p_id: id, p_version: version });
  if (error) throw error;
}

export async function rpcCancelar(id: string, datos: InspeccionCancelar) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("cancelar_inspeccion", {
    p_id: id,
    p_motivo: datos.motivo,
    p_version: datos.version,
  });
  if (error) throw error;
}

export async function rpcReasignar(id: string, datos: InspeccionReasignar) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("reasignar_inspeccion", {
    p_id: id,
    p_inspector_id: datos.inspectorId,
    p_motivo: datos.motivo ?? "",
    p_version: datos.version,
  });
  if (error) throw error;
}

export async function rpcGuardarDetalle(
  inspeccionId: string,
  detalleId: string,
  datos: DetalleGuardar,
): Promise<number> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("guardar_detalle", {
    p_inspeccion_id: inspeccionId,
    p_detalle_id: detalleId,
    p_estado: datos.estado,
    p_observacion: datos.observacion ?? null,
    p_version: datos.version,
  });
  if (error) throw error;
  return data as number;
}
