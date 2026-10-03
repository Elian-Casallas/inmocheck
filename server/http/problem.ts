import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, BadRequestError, ForbiddenError } from "./errores";

type ErrorDeCampo = { field: string; message: string };

type Problema = {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: string;
  traceId: string;
  errors?: ErrorDeCampo[];
};

// Convierte CUALQUIER error en una respuesta application/problem+json
// (RFC 9457). Todos los endpoints terminan su catch con esta función, por
// eso todos los errores de la API tienen la misma forma.
export function toProblem(error: unknown, request: Request): NextResponse {
  const traceId = crypto.randomUUID();
  const instance = new URL(request.url).pathname;

  if (error instanceof ZodError) {
    return responder({
      status: 422,
      code: "VALIDATION_ERROR",
      title: "Datos inválidos",
      detail: "Revisa los campos marcados.",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
      instance,
      traceId,
    });
  }

  if (error instanceof AppError) {
    return responder({
      status: error.status,
      code: error.code,
      title: error.title,
      detail: error.message,
      instance,
      traceId,
    });
  }

  // Error inesperado: el detalle real va al log del servidor, nunca al cliente.
  console.error(`[${traceId}] ${request.method} ${instance}`, error);
  return responder({
    status: 500,
    code: "INTERNAL_ERROR",
    title: "Error interno",
    detail: "Ocurrió un error inesperado. Intenta de nuevo.",
    instance,
    traceId,
  });
}

function responder(problema: Omit<Problema, "type">): NextResponse {
  const cuerpo: Problema = {
    type: `https://inmocheck.example/errors/${problema.code.toLowerCase().replaceAll("_", "-")}`,
    ...problema,
  };

  return NextResponse.json(cuerpo, {
    status: problema.status,
    headers: { "Content-Type": "application/problem+json" },
  });
}

// Lee el JSON del cuerpo. Rechaza peticiones que vengan de otro sitio web
// (protección CSRF) y JSON mal formado.
export async function leerJson(request: Request): Promise<unknown> {
  const origen = request.headers.get("origin");
  if (origen && new URL(origen).host !== new URL(request.url).host) {
    throw new ForbiddenError("Origen no permitido.", "ORIGEN_NO_PERMITIDO");
  }

  try {
    return await request.json();
  } catch {
    throw new BadRequestError("El cuerpo debe ser JSON válido.");
  }
}
