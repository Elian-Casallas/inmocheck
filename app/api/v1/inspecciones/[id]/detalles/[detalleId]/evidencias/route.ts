import { requireRole } from "@/server/auth/sesion";
import { FOTO_TAMANO_MAXIMO_BYTES } from "@/lib/constantes";
import { AppError, BadRequestError, ForbiddenError } from "@/server/http/errores";
import { creado, responder, validarId } from "@/server/http/respuestas";
import { subirEvidencia } from "@/server/services/evidencias.service";

// Lo que ocupan los separadores y nombres de campo del multipart, además del archivo.
const MARGEN_FORMULARIO_BYTES = 64 * 1024;

type Contexto ={ params: Promise<{ id: string; detalleId: string }> };

// POST multipart/form-data con el campo "archivo" (y "descripcion" opcional).
export function POST(request: Request, { params }: Contexto) {
  return responder(request, async () => {
    const actor = await requireRole("INSPECTOR");
    const { id, detalleId } = await params;

    const origen = request.headers.get("origin");
    if (origen && new URL(origen).host !== new URL(request.url).host) {
      throw new ForbiddenError("Origen no permitido.", "ORIGEN_NO_PERMITIDO");
    }

    // Si el tamaño declarado ya supera el límite, se rechaza sin leer el archivo.
    const tamanoDeclarado = Number(request.headers.get("content-length") ?? 0);
    if (tamanoDeclarado > FOTO_TAMANO_MAXIMO_BYTES + MARGEN_FORMULARIO_BYTES) {
      throw new AppError(413, "FILE_TOO_LARGE", "Archivo demasiado grande", "Cada foto puede pesar máximo 10 MB.");
    }

    const formulario = await request.formData().catch(() => null);
    const archivo = formulario?.get("archivo");
    if (!(archivo instanceof File)) throw new BadRequestError("Falta el campo archivo.");

    const descripcion = formulario?.get("descripcion");
    const evidencia = await subirEvidencia(
      actor,
      validarId(id),
      validarId(detalleId),
      archivo,
      typeof descripcion === "string" && descripcion.trim() ? descripcion.trim().slice(0, 300) : null,
    );
    // No se devuelve la ruta del archivo ni una URL permanente.
    return creado(evidencia, `/api/v1/evidencias/${evidencia.id}/acceso`);
  });
}
