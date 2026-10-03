import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Inspector, InspectorEditar, InspectoresFiltro } from "@/schemas/inspectores";
import { limpiarBusqueda, rangoDePagina, sinIndefinidos } from "./utilidades";

const COLUMNAS = "id, nombre, email, activo, createdAt:created_at";

type InspectorBase = Omit<Inspector, "inspeccionesAbiertas">;

export async function listarInspectores(filtro: InspectoresFiltro) {
  const supabase = await crearClienteServidor();
  const [desde, hasta] = rangoDePagina(filtro.page, filtro.pageSize);

  let consulta = supabase
    .from("perfiles")
    .select(COLUMNAS, { count: "exact" })
    .eq("rol", "INSPECTOR")
    .order("nombre")
    .range(desde, hasta);

  if (filtro.activo !== undefined) consulta = consulta.eq("activo", filtro.activo);

  const busqueda = filtro.search ? limpiarBusqueda(filtro.search) : "";
  if (busqueda) {
    consulta = consulta.or(`nombre.ilike.%${busqueda}%,email.ilike.%${busqueda}%`);
  }

  const { data, count, error } = await consulta;
  if (error) throw error;
  return { filas: (data ?? []) as InspectorBase[], total: count ?? 0 };
}

// Una sola consulta para todos los inspectores, en lugar de una por cada uno.
export async function contarAbiertasPorInspector(inspectorIds: string[]): Promise<Map<string, number>> {
  const conteo = new Map<string, number>();
  if (inspectorIds.length === 0) return conteo;

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("inspecciones")
    .select("inspector_id")
    .in("inspector_id", inspectorIds)
    .in("estado", ["PENDIENTE", "EN_PROCESO"]);
  if (error) throw error;

  for (const { inspector_id } of (data ?? []) as { inspector_id: string }[]) {
    conteo.set(inspector_id, (conteo.get(inspector_id) ?? 0) + 1);
  }
  return conteo;
}

export async function buscarInspector(id: string): Promise<InspectorBase | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("perfiles")
    .select(COLUMNAS)
    .eq("id", id)
    .eq("rol", "INSPECTOR")
    .maybeSingle();
  if (error) throw error;
  return data as InspectorBase | null;
}

export async function actualizarInspector(id: string, datos: InspectorEditar) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("perfiles")
    .update(sinIndefinidos(datos))
    .eq("id", id)
    .eq("rol", "INSPECTOR")
    .select(COLUMNAS)
    .maybeSingle();
  if (error) throw error;
  return data as InspectorBase | null;
}

export async function listarOpcionesInspector(): Promise<{ id: string; nombre: string }[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("perfiles")
    .select("id, nombre")
    .eq("rol", "INSPECTOR")
    .eq("activo", true)
    .order("nombre");
  if (error) throw error;
  return data ?? [];
}

export async function contarInspectoresActivos(): Promise<number> {
  const supabase = await crearClienteServidor();
  const { count, error } = await supabase
    .from("perfiles")
    .select("id", { count: "exact", head: true })
    .eq("rol", "INSPECTOR")
    .eq("activo", true);
  if (error) throw error;
  return count ?? 0;
}
