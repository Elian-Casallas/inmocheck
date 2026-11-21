import "server-only";
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

export function sinContenido(): Response {
  return new Response(null, { status: 204 });
}
