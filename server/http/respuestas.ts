import "server-only";
import { NextResponse } from "next/server";
import { uuidSchema } from "@/schemas/comun";
import { NotFoundError } from "./errores";
import { toProblem } from "./problem";

// Envuelve un Route Handler: si algo lanza un error, lo convierte en
// problem+json. Así ningún endpoint repite el try/catch.
export async function responder(request: Request, accion: () => Promise<Response>): Promise<Response> {
  try {
    return await accion();
  } catch (error) {
    return toProblem(error, request);
  }
}

export function ok<T>(cuerpo: T): Response {
  return NextResponse.json(cuerpo);
}

// 201 Created + cabecera Location con la URL del recurso nuevo.
export function creado<T>(data: T, ubicacion: string): Response {
  return NextResponse.json({ data }, { status: 201, headers: { Location: ubicacion } });
}

export function sinContenido(): Response {
  return new Response(null, { status: 204 });
}

// Un id que no es UUID no puede existir: se responde 404 sin consultar la base.
export function validarId(id: string): string {
  const resultado = uuidSchema.safeParse(id);
  if (!resultado.success) throw new NotFoundError();
  return resultado.data;
}

export function parametrosDeUrl(request: Request): Record<string, string> {
  return Object.fromEntries(new URL(request.url).searchParams);
}

export type ContextoConId = { params: Promise<{ id: string }> };
