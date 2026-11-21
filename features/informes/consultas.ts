import "server-only";
import { leerDeSpring, parametrosDeFiltro } from "@/lib/api/servidor";
import type { Paginado } from "@/schemas/comun";
import type { Informe, InformeConInspeccion, InformesFiltro } from "@/schemas/informes";

// Lecturas de informes desde Spring. RLS decide qué ve cada rol: el admin,
// los de su organización; el inspector, los de sus inspecciones.

// Biblioteca de informes (GET /informes), del más reciente al más antiguo.
export function listarInformes(filtro: InformesFiltro): Promise<Paginado<InformeConInspeccion>> {
  return leerDeSpring<Paginado<InformeConInspeccion>>("informes", parametrosDeFiltro(filtro));
}

// Los últimos informes, para el resumen del administrador.
export async function listarInformesRecientes(limite: number): Promise<InformeConInspeccion[]> {
  const { data } = await leerDeSpring<Paginado<InformeConInspeccion>>("informes", parametrosDeFiltro({ pageSize: limite }));
  return data;
}

// Versiones del acta de una inspección, de la más nueva a la más vieja.
export async function listarInformesDeInspeccion(inspeccionId: string): Promise<Informe[]> {
  const { data } = await leerDeSpring<{ data: Informe[] }>(`inspecciones/${encodeURIComponent(inspeccionId)}/informes`);
  return data;
}
