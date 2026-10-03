import "server-only";
import type { InspeccionResumen } from "@/lib/inspecciones";
import { crearClienteServidor } from "@/lib/supabase/server";

// inspecciones tiene DOS llaves hacia perfiles (inspector y quien la creó),
// por eso hay que decir cuál usar: perfiles!fk_inspeccion_inspector.
export const COLUMNAS_RESUMEN =
  "id, tipo, estado, programadaPara:programada_para, finalizadaEn:finalizada_en, " +
  "inmueble:inmuebles (id, codigo, direccion), " +
  "inspector:perfiles!fk_inspeccion_inspector (id, nombre)";

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
