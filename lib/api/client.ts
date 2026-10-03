// Función única para llamar a /api/v1 desde componentes cliente.
// Si la API responde con error, lanza ApiError con el problem+json ya leído.

export type ErrorDeCampo = { field: string; message: string };

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly errors: ErrorDeCampo[] = [],
  ) {
    super(message);
  }
}

type Problema = { code?: string; detail?: string; errors?: ErrorDeCampo[] };

export async function apiFetch<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  let respuesta: Response;

  try {
    respuesta = await fetch(`/api/v1${ruta}`, {
      ...opciones,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...opciones.headers },
    });
  } catch {
    // Sin internet o servidor caído: nunca se debe mostrar como "guardado".
    throw new ApiError(0, "SIN_CONEXION", "No hay conexión. Los cambios no se guardaron.");
  }

  if (!respuesta.ok) {
    const problema: Problema = await respuesta.json().catch(() => ({}));
    throw new ApiError(
      respuesta.status,
      problema.code ?? "HTTP_ERROR",
      problema.detail ?? "No se pudo completar la solicitud.",
      problema.errors,
    );
  }

  if (respuesta.status === 204) return undefined as T;
  return respuesta.json() as Promise<T>;
}

export function mensajeDeError(error: unknown): string {
  return error instanceof ApiError ? error.message : "Ocurrió un error inesperado.";
}
