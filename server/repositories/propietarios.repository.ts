import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Propietario, PropietarioCrear, PropietarioEditar, PropietariosFiltro } from "@/schemas/propietarios";
import { limpiarBusqueda, rangoDePagina, sinIndefinidos } from "./utilidades";

// El repositorio solo habla con la base de datos: no decide reglas.
// "createdAt:created_at" le pide a Supabase la columna ya con nombre camelCase.
const COLUMNAS =
  "id, nombre, email, telefono, tipo, createdAt:created_at, inmuebles (id, codigo, activo)";

export async function listarPropietarios(filtro: PropietariosFiltro) {
  const supabase = await crearClienteServidor();
  const [desde, hasta] = rangoDePagina(filtro.page, filtro.pageSize);

  let consulta = supabase
    .from("personas")
    .select(COLUMNAS, { count: "exact" })
    .eq("tipo", "PROPIETARIO")
    .eq("activo", true)
    .order("nombre")
    .range(desde, hasta);

  const busqueda = filtro.search ? limpiarBusqueda(filtro.search) : "";
  if (busqueda) {
    consulta = consulta.or(`nombre.ilike.%${busqueda}%,email.ilike.%${busqueda}%`);
  }

  const { data, count, error } = await consulta;
  if (error) throw error;
  return { filas: (data ?? []) as Propietario[], total: count ?? 0 };
}

export async function buscarPropietario(id: string): Promise<Propietario | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("personas").select(COLUMNAS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Propietario | null;
}

export async function insertarPropietario(organizacionId: string, datos: PropietarioCrear) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("personas")
    .insert({ ...datos, organizacion_id: organizacionId, tipo: "PROPIETARIO" })
    .select(COLUMNAS)
    .single();
  if (error) throw error;
  return data as Propietario;
}

export async function actualizarPropietario(id: string, datos: PropietarioEditar) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("personas")
    .update(sinIndefinidos(datos))
    .eq("id", id)
    .select(COLUMNAS)
    .maybeSingle();
  if (error) throw error;
  return data as Propietario | null;
}

// Opciones para el <select> del formulario de inmueble.
export async function listarOpcionesPropietario(): Promise<{ id: string; nombre: string }[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("personas")
    .select("id, nombre")
    .eq("tipo", "PROPIETARIO")
    .eq("activo", true)
    .order("nombre");
  if (error) throw error;
  return data ?? [];
}
