import { crearClienteServidor } from "@/lib/supabase/server";
import { armarPaginado, paginacionSchema, uuidSchema } from "@/schemas/comun";
import { z } from "@/schemas/zod";
import { requireRole } from "@/server/auth/sesion";
import { ok, parametrosDeUrl, responder } from "@/server/http/respuestas";
import { rangoDePagina } from "@/server/repositories/utilidades";

const RECURSOS = ["INMUEBLE", "ESPACIO", "ELEMENTO", "PROPIETARIO", "INSPECTOR", "INSPECCION"] as const;

const filtroSchema = paginacionSchema.extend({
  recurso: z.enum(RECURSOS).optional(),
  recursoId: uuidSchema.optional(),
  desde: z.iso.date().optional(),
  hasta: z.iso.date().optional(),
});

// Solo lectura y solo para el administrador. La auditoría no tiene
// endpoints de escritura: la llenan los triggers y las funciones SQL.
export function GET(request: Request) {
  return responder(request, async () => {
    await requireRole("ADMIN");
    const filtro = filtroSchema.parse(parametrosDeUrl(request));
    const [desde, hasta] = rangoDePagina(filtro.page, filtro.pageSize);

    const supabase = await crearClienteServidor();
    let consulta = supabase
      .from("auditoria")
      .select("id, recurso, recursoId:recurso_id, accion, fecha, actor:perfiles (id, nombre)", { count: "exact" })
      .order("fecha", { ascending: false })
      .range(desde, hasta);

    if (filtro.recurso) consulta = consulta.eq("recurso", filtro.recurso);
    if (filtro.recursoId) consulta = consulta.eq("recurso_id", filtro.recursoId);
    if (filtro.desde) consulta = consulta.gte("fecha", filtro.desde);
    if (filtro.hasta) consulta = consulta.lte("fecha", `${filtro.hasta}T23:59:59Z`);

    const { data, count, error } = await consulta;
    if (error) throw error;
    return ok(armarPaginado(data ?? [], count ?? 0, filtro.page, filtro.pageSize));
  });
}
