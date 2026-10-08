import "server-only";
import { createHash } from "node:crypto";
import { URL_FIRMADA_SEGUNDOS } from "@/lib/constantes";
import { plural } from "@/lib/formato";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";
import {
  FOTOS_MAXIMAS_EN_INFORME,
  codigoDeInforme,
  type Informe,
  type InformeConInspeccion,
} from "@/schemas/informes";
import type { Detalle, Inspeccion } from "@/schemas/inspecciones";
import type { Actor } from "@/server/auth/sesion";
import { AppError, ConflictError, NotFoundError } from "@/server/http/errores";
import { renderizarActa, type DatosActa } from "@/server/pdf/acta";
import { buscarInmueble } from "@/server/repositories/inmuebles.repository";
import { listarDetalles } from "@/server/repositories/inspecciones.repository";
import { esViolacionUnica } from "@/server/repositories/utilidades";
import { compararInspecciones, listarEntradasComparables } from "./comparacion.service";
import { obtenerInspeccion } from "./inspecciones.service";

const BUCKET_INFORMES = "informes";
const BUCKET_EVIDENCIAS = "evidencias";
// react-pdf solo sabe incrustar JPG y PNG.
const FORMATO_PDF: Record<string, "jpg" | "png"> = { "image/jpeg": "jpg", "image/png": "png" };

const COLUMNAS = "id, inspeccionId:inspeccion_id, version, generadoEn:generado_en, generadoPor:perfiles (nombre)";

export async function listarInformesDeInspeccion(inspeccionId: string): Promise<Informe[]> {
  await obtenerInspeccion(inspeccionId);
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("informes")
    .select(COLUMNAS)
    .eq("inspeccion_id", inspeccionId)
    .order("version", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Informe[];
}

// Biblioteca de informes: RLS deja ver al admin todos los de su
// organización y al inspector solo los de sus inspecciones.
export async function listarInformes(limite?: number): Promise<InformeConInspeccion[]> {
  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("informes")
    .select(`${COLUMNAS}, inspeccion:inspecciones (id, tipo, inmueble:inmuebles (codigo, direccion))`)
    .order("generado_en", { ascending: false });
  if (limite) consulta = consulta.limit(limite);

  const { data, error } = await consulta;
  if (error) throw error;
  return (data ?? []) as unknown as InformeConInspeccion[];
}

export async function generarInforme(
  actor: Actor,
  inspeccionId: string,
  evidenciaIds?: string[],
): Promise<Informe> {
  const inspeccion = await obtenerInspeccion(inspeccionId);
  if (inspeccion.estado !== "FINALIZADA") {
    throw new ConflictError("El informe solo se genera para inspecciones finalizadas.", "INSPECCION_NO_FINALIZADA");
  }

  const anteriores = await listarInformesDeInspeccion(inspeccionId);
  const version = (anteriores[0]?.version ?? 0) + 1;
  const id = crypto.randomUUID();
  const generadoEn = new Date().toISOString();

  // Si el PDF falla, la inspección NO se toca: sigue finalizada y se puede
  // reintentar. Por eso generar el informe es un paso aparte de finalizar.
  let pdf: Buffer;
  try {
    pdf = await renderizarActa(
      await reunirDatosDelActa(actor, inspeccion, { id, version, generadoEn }, evidenciaIds),
    );
  } catch (error) {
    console.error("No se pudo generar el PDF:", error);
    throw new AppError(
      503,
      "PDF_NO_GENERADO",
      "No se pudo generar el informe",
      "No se pudo generar el PDF. La inspección sigue finalizada; intenta de nuevo.",
    );
  }

  const ruta = `org/${actor.organizacion.id}/inspecciones/${inspeccionId}/${id}.pdf`;
  const almacenamiento = crearClienteAdmin().storage.from(BUCKET_INFORMES);
  const { error: errorSubida } = await almacenamiento.upload(ruta, pdf, { contentType: "application/pdf" });
  if (errorSubida) throw errorSubida;

  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("registrar_informe", {
    p_id: id,
    p_inspeccion_id: inspeccionId,
    p_version: version,
    p_storage_path: ruta,
    // Huella del archivo: permite comprobar después que el PDF no cambió.
    p_sha256: createHash("sha256").update(pdf).digest("hex"),
  });

  if (error) {
    await almacenamiento.remove([ruta]);
    if (esViolacionUnica(error)) {
      throw new ConflictError("Otra persona generó el informe al mismo tiempo. Recarga la página.", "INFORME_DUPLICADO");
    }
    throw error;
  }

  return { id, inspeccionId, version, generadoEn, generadoPor: { nombre: actor.nombre } };
}

async function reunirDatosDelActa(
  actor: Actor,
  inspeccion: Inspeccion,
  informe: { id: string; version: number; generadoEn: string },
  evidenciaIds?: string[],
): Promise<DatosActa> {
  const [detalles, inmueble, resumenComparacion] = await Promise.all([
    listarDetalles(inspeccion.id),
    buscarInmueble(inspeccion.inmueble.id),
    resumirComparacion(inspeccion),
  ]);

  return {
    codigoInforme: codigoDeInforme(informe.id, informe.generadoEn),
    version: informe.version,
    organizacion: actor.organizacion.nombre,
    tipo: inspeccion.tipo,
    inmueble: [inspeccion.inmueble.codigo, inspeccion.inmueble.direccion, inspeccion.inmueble.ciudad].join(" · "),
    propietario: inmueble?.propietario?.nombre ?? null,
    inspector: inspeccion.inspector?.nombre ?? "—",
    programadaPara: inspeccion.programadaPara,
    finalizadaEn: inspeccion.finalizadaEn ?? informe.generadoEn,
    generadoEn: informe.generadoEn,
    detalles,
    resumenComparacion,
    fotos: await descargarFotos(detalles, evidenciaIds),
  };
}

// Para una salida, resume las diferencias con la entrada más reciente.
async function resumirComparacion(inspeccion: Inspeccion): Promise<string | null> {
  if (inspeccion.tipo !== "SALIDA") return null;
  const [entrada] = await listarEntradasComparables(inspeccion);
  if (!entrada) return null;

  const { resumen } = await compararInspecciones(inspeccion.id, entrada.id);
  return (
    `${plural(resumen.elementosComparados, "elemento comparado", "elementos comparados")}, ` +
    `${resumen.cambios} con cambio de estado y ${plural(resumen.noComparables, "no comparable", "no comparables")}.`
  );
}

// Descarga las fotos del acta. Si se indicaron ids, solo esas; si no, todas.
// Los ids se buscan dentro de los detalles de ESTA inspección: uno de otra
// inspección no coincide con ninguno y simplemente se ignora.
async function descargarFotos(detalles: Detalle[], evidenciaIds?: string[]): Promise<DatosActa["fotos"]> {
  const elegidas = evidenciaIds ? new Set(evidenciaIds) : null;

  const candidatas = detalles
    .flatMap((detalle) =>
      detalle.evidencias.map((evidencia) => ({
        id: evidencia.id,
        formato: FORMATO_PDF[evidencia.mimeType] ?? null,
        espacio: detalle.espacioNombre,
        elemento: detalle.elementoNombre,
      })),
    )
    .filter((foto) => foto.formato !== null && (!elegidas || elegidas.has(foto.id)))
    .slice(0, FOTOS_MAXIMAS_EN_INFORME);
  if (candidatas.length === 0) return [];

  const supabase = await crearClienteServidor();
  const { data: rutas } = await supabase
    .from("evidencias")
    .select("id, storage_path")
    .in("id", candidatas.map(({ id }) => id));
  const rutaPorId = new Map((rutas ?? []).map((fila) => [fila.id as string, fila.storage_path as string]));

  // Todas las descargas en paralelo; se conserva el orden espacio → elemento.
  const almacenamiento = crearClienteAdmin().storage.from(BUCKET_EVIDENCIAS);
  const descargadas = await Promise.all(
    candidatas.map(async ({ id, formato, espacio, elemento }) => {
      const ruta = rutaPorId.get(id);
      if (!ruta || !formato) return null;
      const { data } = await almacenamiento.download(ruta);
      return data ? { espacio, elemento, formato, datos: Buffer.from(await data.arrayBuffer()) } : null;
    }),
  );
  return descargadas.filter((foto) => foto !== null);
}

// Enlace firmado para descargar el PDF. Solo si RLS deja ver el informe.
export async function crearDescargaDeInforme(informeId: string): Promise<string> {
  const supabase = await crearClienteServidor();
  const { data: informe, error } = await supabase
    .from("informes")
    .select("storage_path, version, generado_en")
    .eq("id", informeId)
    .maybeSingle();
  if (error) throw error;
  if (!informe) throw new NotFoundError();

  const nombre = `${codigoDeInforme(informeId, informe.generado_en as string)}-v${informe.version}.pdf`;
  const { data, error: errorFirma } = await crearClienteAdmin()
    .storage.from(BUCKET_INFORMES)
    .createSignedUrl(informe.storage_path as string, URL_FIRMADA_SEGUNDOS, { download: nombre });
  if (errorFirma || !data) throw errorFirma ?? new NotFoundError();

  return data.signedUrl;
}
