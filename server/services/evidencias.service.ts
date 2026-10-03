import "server-only";
import {
  FOTOS_MAXIMAS_POR_ELEMENTO,
  FOTO_TAMANO_MAXIMO_BYTES,
  URL_FIRMADA_SEGUNDOS,
} from "@/lib/constantes";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Evidencia } from "@/schemas/inspecciones";
import type { Actor } from "@/server/auth/sesion";
import { AppError, BadRequestError, ConflictError, NotFoundError } from "@/server/http/errores";

const BUCKET = "evidencias";

type TipoImagen = { mime: string; extension: string };

// El tipo se decide leyendo los primeros bytes del archivo ("firma"), no la
// extensión ni el Content-Type que manda el navegador: ambos se pueden falsear.
function detectarTipoImagen(bytes: Uint8Array): TipoImagen | null {
  const empiezaCon = (firma: number[], desde = 0) => firma.every((byte, i) => bytes[desde + i] === byte);

  if (empiezaCon([0xff, 0xd8, 0xff])) return { mime: "image/jpeg", extension: "jpg" };
  if (empiezaCon([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: "image/png", extension: "png" };
  // WebP: "RIFF" + 4 bytes de tamaño + "WEBP"
  if (empiezaCon([0x52, 0x49, 0x46, 0x46]) && empiezaCon([0x57, 0x45, 0x42, 0x50], 8)) {
    return { mime: "image/webp", extension: "webp" };
  }
  return null;
}

const ERRORES_DE_FLUJO: Record<string, AppError> = {
  NO_ENCONTRADA: new NotFoundError(),
  INSPECCION_NO_INICIADA: new ConflictError("Primero debes iniciar la inspección.", "INSPECCION_NO_INICIADA"),
  INSPECCION_CERRADA: new ConflictError(
    "La inspección ya está cerrada: sus fotos no se pueden modificar.",
    "INSPECCION_CERRADA",
  ),
  LIMITE_FOTOS: new ConflictError(
    `Cada elemento admite máximo ${FOTOS_MAXIMAS_POR_ELEMENTO} fotos.`,
    "LIMITE_FOTOS",
  ),
};

function traducirError(error: unknown): unknown {
  const mensaje = typeof error === "object" && error !== null ? (error as { message?: string }).message : undefined;
  return (mensaje && ERRORES_DE_FLUJO[mensaje]) || error;
}

export async function subirEvidencia(
  actor: Actor,
  inspeccionId: string,
  detalleId: string,
  archivo: File,
  descripcion: string | null,
): Promise<Evidencia> {
  if (archivo.size === 0) throw new BadRequestError("El archivo está vacío.");
  if (archivo.size > FOTO_TAMANO_MAXIMO_BYTES) {
    throw new AppError(413, "FILE_TOO_LARGE", "Archivo demasiado grande", "Cada foto puede pesar máximo 10 MB.");
  }

  const bytes = new Uint8Array(await archivo.arrayBuffer());
  const tipo = detectarTipoImagen(bytes);
  if (!tipo) {
    throw new AppError(415, "UNSUPPORTED_MEDIA_TYPE", "Tipo de archivo no admitido", "Solo se admiten fotos JPG, PNG o WebP.");
  }

  // Antes de subir nada se comprueba, con la sesión del usuario (RLS), que
  // el detalle exista y pertenezca a esa inspección.
  const supabase = await crearClienteServidor();
  const { data: detalle } = await supabase
    .from("detalles_inspeccion")
    .select("id")
    .eq("id", detalleId)
    .eq("inspeccion_id", inspeccionId)
    .maybeSingle();
  if (!detalle) throw new NotFoundError();

  // El nombre lo genera el servidor: nunca se usa el nombre original, que
  // podría traer rutas ("../") o datos personales.
  const id = crypto.randomUUID();
  const ruta = `org/${actor.organizacion.id}/inspecciones/${inspeccionId}/detalles/${detalleId}/${id}.${tipo.extension}`;

  const almacenamiento = crearClienteAdmin().storage.from(BUCKET);
  const { error: errorSubida } = await almacenamiento.upload(ruta, bytes, { contentType: tipo.mime });
  if (errorSubida) throw errorSubida;

  // La función SQL valida inspector, estado y límite de fotos.
  const { error: errorRegistro } = await supabase.rpc("registrar_evidencia", {
    p_id: id,
    p_detalle_id: detalleId,
    p_storage_path: ruta,
    p_mime_type: tipo.mime,
    p_size_bytes: archivo.size,
    p_descripcion: descripcion,
  });

  if (errorRegistro) {
    // Compensación: Storage y la base no comparten transacción. Si el
    // registro falla, se borra el archivo para no dejarlo huérfano.
    await almacenamiento.remove([ruta]);
    throw traducirError(errorRegistro);
  }

  return { id, mimeType: tipo.mime, sizeBytes: archivo.size, descripcion, createdAt: new Date().toISOString() };
}

// Enlace firmado de corta duración. Solo se emite si RLS deja ver la evidencia.
export async function crearAccesoEvidencia(evidenciaId: string) {
  const supabase = await crearClienteServidor();
  const { data: evidencia, error } = await supabase
    .from("evidencias")
    .select("storage_path")
    .eq("id", evidenciaId)
    .maybeSingle();
  if (error) throw error;
  if (!evidencia) throw new NotFoundError();

  const { data, error: errorFirma } = await crearClienteAdmin()
    .storage.from(BUCKET)
    .createSignedUrl(evidencia.storage_path as string, URL_FIRMADA_SEGUNDOS);
  if (errorFirma || !data) throw errorFirma ?? new NotFoundError();

  return { url: data.signedUrl, expiresIn: URL_FIRMADA_SEGUNDOS };
}

export async function eliminarEvidencia(evidenciaId: string) {
  const supabase = await crearClienteServidor();
  const { data: ruta, error } = await supabase.rpc("eliminar_evidencia", { p_id: evidenciaId });
  if (error) throw traducirError(error);

  await crearClienteAdmin().storage.from(BUCKET).remove([ruta as string]);
}
