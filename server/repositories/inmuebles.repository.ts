import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Inmueble, InmuebleCrear, InmuebleEditar, InmueblesFiltro } from "@/schemas/inmuebles";
import { limpiarBusqueda, rangoDePagina, sinIndefinidos } from "./utilidades";

const COLUMNAS =
  "id, codigo, tipo, direccion, barrio, ciudad, departamento, habitaciones, banos, " +
  "areaM2:area_m2, descripcion, activo, createdAt:created_at, " +
  "propietario:personas (id, nombre, email, telefono)";

// Lista blanca: el valor de ?sort= se traduce aquí a una columna real.
const ORDEN: Record<InmueblesFiltro["sort"], { columna: string; ascendente: boolean }> = {
  codigo: { columna: "codigo", ascendente: true },
  "-codigo": { columna: "codigo", ascendente: false },
  createdAt: { columna: "created_at", ascendente: true },
  "-createdAt": { columna: "created_at", ascendente: false },
};

// Del JSON en camelCase a las columnas en snake_case.
function aColumnas(datos: InmuebleEditar) {
  const { areaM2, propietarioId, ...resto } = datos;
  return sinIndefinidos({ ...resto, area_m2: areaM2, propietario_id: propietarioId });
}

export async function listarInmuebles(filtro: InmueblesFiltro) {
  const supabase = await crearClienteServidor();
  const [desde, hasta] = rangoDePagina(filtro.page, filtro.pageSize);
  const { columna, ascendente } = ORDEN[filtro.sort];

  let consulta = supabase
    .from("inmuebles")
    .select(COLUMNAS, { count: "exact" })
    .order(columna, { ascending: ascendente })
    .range(desde, hasta);

  if (filtro.tipo) consulta = consulta.eq("tipo", filtro.tipo);
  if (filtro.activo !== undefined) consulta = consulta.eq("activo", filtro.activo);

  const busqueda = filtro.search ? limpiarBusqueda(filtro.search) : "";
  if (busqueda) {
    const patron = `%${busqueda}%`;
    consulta = consulta.or(
      `codigo.ilike.${patron},direccion.ilike.${patron},barrio.ilike.${patron},ciudad.ilike.${patron}`,
    );
  }

  const { data, count, error } = await consulta;
  if (error) throw error;
  return { filas: (data ?? []) as unknown as Inmueble[], total: count ?? 0 };
}

export async function buscarInmueble(id: string): Promise<Inmueble | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("inmuebles").select(COLUMNAS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data as unknown as Inmueble | null;
}

export async function insertarInmueble(organizacionId: string, datos: InmuebleCrear) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("inmuebles")
    .insert({ ...aColumnas(datos), organizacion_id: organizacionId })
    .select(COLUMNAS)
    .single();
  if (error) throw error;
  return data as unknown as Inmueble;
}

export async function actualizarInmueble(id: string, datos: InmuebleEditar) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("inmuebles")
    .update(aColumnas(datos))
    .eq("id", id)
    .select(COLUMNAS)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Inmueble | null;
}

export async function contarInspeccionesAbiertas(inmuebleId: string): Promise<number> {
  const supabase = await crearClienteServidor();
  const { count, error } = await supabase
    .from("inspecciones")
    .select("id", { count: "exact", head: true })
    .eq("inmueble_id", inmuebleId)
    .in("estado", ["PENDIENTE", "EN_PROCESO"]);
  if (error) throw error;
  return count ?? 0;
}

export async function contarInmueblesActivos(): Promise<number> {
  const supabase = await crearClienteServidor();
  const { count, error } = await supabase
    .from("inmuebles")
    .select("id", { count: "exact", head: true })
    .eq("activo", true);
  if (error) throw error;
  return count ?? 0;
}
