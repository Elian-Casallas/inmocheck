import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Elemento, ElementoEditar, Espacio, EspacioEditar } from "@/schemas/inventario";
import { sinIndefinidos } from "./utilidades";

const COLUMNAS_ELEMENTO = "id, espacioId:espacio_id, nombre, obligatorio, orden, activo";
const COLUMNAS_ESPACIO = `id, inmuebleId:inmueble_id, nombre, orden, activo, elementos (${COLUMNAS_ELEMENTO})`;

export async function listarEspacios(inmuebleId: string): Promise<Espacio[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("espacios")
    .select(COLUMNAS_ESPACIO)
    .eq("inmueble_id", inmuebleId)
    .order("orden")
    .order("created_at")
    .order("orden", { referencedTable: "elementos" })
    .order("created_at", { referencedTable: "elementos" });
  if (error) throw error;
  return (data ?? []) as unknown as Espacio[];
}

// Devuelve también organizacion_id e inmueble_id para heredarlos al crear hijos.
export async function buscarEspacioBase(id: string) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("espacios")
    .select("id, organizacion_id, inmueble_id")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as { id: string; organizacion_id: string; inmueble_id: string } | null;
}

export async function siguienteOrdenEspacio(inmuebleId: string): Promise<number> {
  const supabase = await crearClienteServidor();
  const { count, error } = await supabase
    .from("espacios")
    .select("id", { count: "exact", head: true })
    .eq("inmueble_id", inmuebleId);
  if (error) throw error;
  return (count ?? 0) + 1;
}

export async function siguienteOrdenElemento(espacioId: string): Promise<number> {
  const supabase = await crearClienteServidor();
  const { count, error } = await supabase
    .from("elementos")
    .select("id", { count: "exact", head: true })
    .eq("espacio_id", espacioId);
  if (error) throw error;
  return (count ?? 0) + 1;
}

export async function insertarEspacio(fila: {
  organizacion_id: string;
  inmueble_id: string;
  nombre: string;
  orden: number;
}): Promise<Espacio> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("espacios").insert(fila).select(COLUMNAS_ESPACIO).single();
  if (error) throw error;
  return data as unknown as Espacio;
}

export async function actualizarEspacio(id: string, datos: EspacioEditar): Promise<Espacio | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("espacios")
    .update(sinIndefinidos(datos))
    .eq("id", id)
    .select(COLUMNAS_ESPACIO)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Espacio | null;
}

export async function insertarElemento(fila: {
  organizacion_id: string;
  espacio_id: string;
  nombre: string;
  obligatorio: boolean;
  orden: number;
}): Promise<Elemento> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("elementos").insert(fila).select(COLUMNAS_ELEMENTO).single();
  if (error) throw error;
  return data as unknown as Elemento;
}

export async function actualizarElemento(id: string, datos: ElementoEditar): Promise<Elemento | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("elementos")
    .update(sinIndefinidos(datos))
    .eq("id", id)
    .select(COLUMNAS_ELEMENTO)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Elemento | null;
}
