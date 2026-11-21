import { describe, expect, it, vi } from "vitest";

// "server-only" falla fuera de Next.js; en las pruebas no hace falta.
vi.mock("server-only", () => ({}));

const {
  cabecerasDeRespuesta,
  cabecerasParaSpring,
  estaEnSpring,
  llevaCuerpo,
  origenPermitido,
  urlEnSpring,
} = await import("@/lib/api/backend");

describe("estaEnSpring", () => {
  it("reenvía los módulos migrados", () => {
    expect(estaEnSpring(["auth", "me"])).toBe(true);
    expect(estaEnSpring(["propietarios"])).toBe(true);
    expect(estaEnSpring(["espacios", "a4000000-0000-4000-8000-000000000001", "elementos"])).toBe(true);
    expect(estaEnSpring(["elementos", "x"])).toBe(true);
    expect(estaEnSpring(["inmuebles", "a3000000-0000-4000-8000-000000000001", "historial"])).toBe(true);
    expect(estaEnSpring(["propietarios", "a2000000-0000-4000-8000-000000000001"])).toBe(true);
  });

  it("no reenvía lo que sigue en el BFF ni rutas parecidas", () => {
    expect(estaEnSpring(["auth", "login"])).toBe(false);
    expect(estaEnSpring(["auth"])).toBe(false);
    expect(estaEnSpring(["auth", "meme"])).toBe(false);
    expect(estaEnSpring(["inspecciones"])).toBe(false);
  });

  it("no deja salir de /api/v1 con . o ..", () => {
    expect(estaEnSpring(["auth", "me", "..", "..", "..", "actuator", "env"])).toBe(false);
    expect(estaEnSpring(["auth", "me", "."])).toBe(false);
  });
});

describe("urlEnSpring", () => {
  it("conserva la ruta y los filtros", () => {
    expect(urlEnSpring("http://localhost:8080", ["inmuebles"], "?page=2&search=casa")).toBe(
      "http://localhost:8080/api/v1/inmuebles?page=2&search=casa",
    );
  });

  it("acepta la base con barra final", () => {
    expect(urlEnSpring("https://api.inmocheck.co/", ["auth", "me"], "")).toBe("https://api.inmocheck.co/api/v1/auth/me");
  });

  it("codifica cada segmento: una / dentro de un segmento no crea rutas nuevas", () => {
    expect(urlEnSpring("http://localhost:8080", ["a/../../actuator"], "")).toBe(
      "http://localhost:8080/api/v1/a%2F..%2F..%2Factuator",
    );
  });
});

describe("cabecerasParaSpring", () => {
  const originales = new Headers({
    "content-type": "application/json",
    accept: "application/json",
    cookie: "sb-proyecto-auth-token=secreto",
    host: "inmocheck.vercel.app",
    authorization: "Bearer token-que-mando-el-navegador",
  });
  const cabeceras = cabecerasParaSpring(originales, "token-de-la-sesion");

  it("manda el token de la sesión como Bearer", () => {
    expect(cabeceras.get("authorization")).toBe("Bearer token-de-la-sesion");
  });

  it("no manda las cookies del navegador a Spring", () => {
    expect(cabeceras.get("cookie")).toBeNull();
    expect(cabeceras.get("host")).toBeNull();
  });

  it("conserva el tipo de contenido", () => {
    expect(cabeceras.get("content-type")).toBe("application/json");
  });
});

describe("cabecerasDeRespuesta", () => {
  it("devuelve solo las cabeceras útiles de Spring", () => {
    const cabeceras = cabecerasDeRespuesta(
      new Headers({
        "content-type": "application/problem+json",
        location: "/api/v1/inmuebles/1",
        "set-cookie": "JSESSIONID=abc",
        "x-powered-by": "Spring",
      }),
    );
    expect(cabeceras.get("content-type")).toBe("application/problem+json");
    expect(cabeceras.get("location")).toBe("/api/v1/inmuebles/1");
    expect(cabeceras.get("set-cookie")).toBeNull();
    expect(cabeceras.get("x-powered-by")).toBeNull();
  });
});

describe("llevaCuerpo", () => {
  it("GET y HEAD no llevan cuerpo; el resto sí", () => {
    expect(llevaCuerpo("GET")).toBe(false);
    expect(llevaCuerpo("head")).toBe(false);
    expect(llevaCuerpo("POST")).toBe(true);
    expect(llevaCuerpo("PATCH")).toBe(true);
    expect(llevaCuerpo("DELETE")).toBe(true);
  });
});

describe("origenPermitido (CSRF)", () => {
  const url = "https://inmocheck.vercel.app/api/v1/auth/me";

  it("acepta el mismo sitio o una petición sin Origin", () => {
    expect(origenPermitido("https://inmocheck.vercel.app", url)).toBe(true);
    expect(origenPermitido(null, url)).toBe(true);
  });

  it("rechaza otro sitio o un Origin inválido", () => {
    expect(origenPermitido("https://sitio-malicioso.com", url)).toBe(false);
    expect(origenPermitido("null", url)).toBe(false);
  });
});
