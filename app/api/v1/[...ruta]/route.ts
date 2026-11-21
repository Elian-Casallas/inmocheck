import { crearClienteServidor } from "@/lib/supabase/server";
import {
  cabecerasDeRespuesta,
  cabecerasParaSpring,
  estaEnSpring,
  llevaCuerpo,
  origenPermitido,
  urlEnSpring,
} from "@/lib/api/backend";
import { AppError, ForbiddenError, NotFoundError, UnauthenticatedError } from "@/server/http/errores";
import { toProblem } from "@/server/http/problem";

// Proxy hacia el backend de Spring Boot (docs/arquitectura.md, "Proxy").
// Atiende las rutas de /api/v1 que no tienen un route.ts propio:
//   1. solo reenvía los módulos de MODULOS_EN_SPRING (el resto: 404),
//   2. rechaza peticiones de otro sitio (CSRF),
//   3. toma el token de la sesión (cookies) y lo manda como Bearer,
//   4. devuelve tal cual el estado, las cabeceras útiles y el cuerpo de Spring.
// No aplica reglas de negocio ni toca la base: eso lo hace Spring.

type Contexto = { params: Promise<{ ruta: string[] }> };

async function reenviar(request: Request, contexto: Contexto): Promise<Response> {
  try {
    const { ruta } = await contexto.params;
    if (!estaEnSpring(ruta)) throw new NotFoundError();

    if (llevaCuerpo(request.method) && !origenPermitido(request.headers.get("origin"), request.url)) {
      throw new ForbiddenError("Origen no permitido.", "ORIGEN_NO_PERMITIDO");
    }

    const backend = process.env.BACKEND_URL;
    if (!backend) throw servicioNoDisponible();

    const token = await tokenDeLaSesion();
    if (!token) throw new UnauthenticatedError();

    const respuesta = await llamarASpring(request, urlEnSpring(backend, ruta, new URL(request.url).search), token);
    return new Response(respuesta.body, {
      status: respuesta.status,
      headers: cabecerasDeRespuesta(respuesta.headers),
    });
  } catch (error) {
    return toProblem(error, request);
  }
}

// La sesión la refresca proxy.ts en cada petición. Aquí solo se lee el token;
// Spring verifica su firma, su vencimiento y de qué proyecto es.
async function tokenDeLaSesion(): Promise<string | null> {
  const supabase = await crearClienteServidor();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function llamarASpring(request: Request, url: string, token: string): Promise<Response> {
  try {
    return await fetch(url, {
      method: request.method,
      headers: cabecerasParaSpring(request.headers, token),
      body: llevaCuerpo(request.method) ? await request.arrayBuffer() : undefined,
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    // Spring caído o inalcanzable: nunca se muestra como guardado.
    throw servicioNoDisponible();
  }
}

function servicioNoDisponible(): AppError {
  return new AppError(
    503,
    "SERVICIO_NO_DISPONIBLE",
    "Servicio no disponible",
    "El servidor no responde. Los cambios no se guardaron; intenta de nuevo.",
  );
}

export const GET = reenviar;
export const POST = reenviar;
export const PUT = reenviar;
export const PATCH = reenviar;
export const DELETE = reenviar;
