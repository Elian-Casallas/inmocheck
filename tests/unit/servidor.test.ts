import { beforeEach, describe, expect, it, vi } from "vitest";

// "server-only" falla fuera de Next.js; en las pruebas no hace falta.
vi.mock("server-only", () => ({}));

// redirect() y notFound() de Next.js lanzan una excepción especial; aquí se
// simulan lanzando un error con el destino, para poder comprobarlo.
vi.mock("next/navigation", () => ({
  redirect: (destino: string) => {
    throw new Error(`redirect:${destino}`);
  },
  notFound: () => {
    throw new Error("notFound");
  },
}));

// Sesión simulada: el token que "viene de las cookies".
let tokenDeSesion: string | null = "token-de-la-sesion";
vi.mock("@/lib/supabase/server", () => ({
  crearClienteServidor: async () => ({
    auth: {
      getSession: async () => ({
        data: { session: tokenDeSesion ? { access_token: tokenDeSesion } : null },
      }),
    },
  }),
}));

const { ErrorDeSpring, leerDeSpring, reaccionAlEstado } = await import("@/lib/api/servidor");

function responderCon(status: number, cuerpo: unknown) {
  const llamada = vi.fn(async () =>
    new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } }),
  );
  vi.stubGlobal("fetch", llamada);
  return llamada;
}

beforeEach(() => {
  tokenDeSesion = "token-de-la-sesion";
  vi.stubEnv("BACKEND_URL", "http://localhost:8080");
});

describe("reaccionAlEstado", () => {
  it("traduce cada estado a lo que hace la página", () => {
    expect(reaccionAlEstado(401)).toBe("iniciar-sesion");
    expect(reaccionAlEstado(403)).toBe("sin-permiso");
    expect(reaccionAlEstado(404)).toBe("no-encontrado");
    expect(reaccionAlEstado(409)).toBe("error");
    expect(reaccionAlEstado(500)).toBe("error");
  });
});

describe("leerDeSpring", () => {
  it("pide a Spring con el token de la sesión y devuelve el JSON", async () => {
    const llamada = responderCon(200, { data: { nombre: "Andrea Pinzón" } });

    const resultado = await leerDeSpring<{ data: { nombre: string } }>(
      "inmuebles",
      new URLSearchParams({ page: "2" }),
    );

    expect(resultado.data.nombre).toBe("Andrea Pinzón");
    const [url, opciones] = llamada.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://localhost:8080/api/v1/inmuebles?page=2");
    expect(new Headers(opciones.headers).get("authorization")).toBe("Bearer token-de-la-sesion");
    expect(opciones.cache).toBe("no-store");
  });

  it("sin sesión manda a /login sin llamar a Spring", async () => {
    tokenDeSesion = null;
    const llamada = responderCon(200, {});

    await expect(leerDeSpring("auth/me")).rejects.toThrow("redirect:/login");
    expect(llamada).not.toHaveBeenCalled();
  });

  it("si Spring dice 401 manda a /login", async () => {
    responderCon(401, { code: "UNAUTHENTICATED" });
    await expect(leerDeSpring("auth/me")).rejects.toThrow("redirect:/login");
  });

  it("si la cuenta está desactivada (403) manda a /403", async () => {
    responderCon(403, { code: "CUENTA_INACTIVA" });
    await expect(leerDeSpring("auth/me")).rejects.toThrow("redirect:/403");
  });

  it("si no existe (404) muestra la página de no encontrado", async () => {
    responderCon(404, { code: "NOT_FOUND" });
    await expect(leerDeSpring("inmuebles/abc")).rejects.toThrow("notFound");
  });

  it("otro error llega a la página de error con su código", async () => {
    responderCon(500, { code: "INTERNAL_ERROR" });
    await expect(leerDeSpring("auth/me")).rejects.toMatchObject({ status: 500, code: "INTERNAL_ERROR" });
  });

  it("si Spring no responde, lanza SERVICIO_NO_DISPONIBLE", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("fetch failed");
    }));
    await expect(leerDeSpring("auth/me")).rejects.toBeInstanceOf(ErrorDeSpring);
    await expect(leerDeSpring("auth/me")).rejects.toMatchObject({ code: "SERVICIO_NO_DISPONIBLE" });
  });
});
