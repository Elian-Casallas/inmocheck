import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PropietariosFiltro } from "@/schemas/propietarios";

// "server-only" falla fuera de Next.js; en las pruebas no hace falta.
vi.mock("server-only", () => ({}));

// Consulta falsa de Supabase: guarda cada método llamado y, al hacer await,
// devuelve una respuesta vacía. Así se prueba qué filtros arma el repositorio
// sin tocar la base de datos.
let llamadas: { metodo: string; args: unknown[] }[] = [];

function crearConsultaFalsa() {
  const consulta: Record<string, unknown> = {
    then: (resolver: (valor: unknown) => void) => resolver({ data: [], count: 0, error: null }),
  };
  for (const metodo of ["select", "eq", "order", "range", "or", "is", "not"]) {
    consulta[metodo] = (...args: unknown[]) => {
      llamadas.push({ metodo, args });
      return consulta;
    };
  }
  return consulta;
}

// El cliente NO tiene "then": si lo tuviera, el await de crearClienteServidor()
// lo resolvería como si fuera la consulta y el repositorio no recibiría el cliente.
vi.mock("@/lib/supabase/server", () => ({
  crearClienteServidor: async () => ({ from: () => crearConsultaFalsa() }),
}));

const { listarPropietarios } = await import("@/server/repositories/propietarios.repository");

const filtroBase: PropietariosFiltro = { page: 1, pageSize: 20 };
const llamadasA = (metodo: string) => llamadas.filter((llamada) => llamada.metodo === metodo);

describe("listarPropietarios: filtro por inmuebles", () => {
  beforeEach(() => {
    llamadas = [];
  });

  it("con inmuebles=sin pide los que no tienen inmuebles", async () => {
    await listarPropietarios({ ...filtroBase, inmuebles: "sin" });

    expect(llamadasA("is")).toEqual([{ metodo: "is", args: ["inmuebles", null] }]);
    expect(llamadasA("not")).toEqual([]);
  });

  it("con inmuebles=con pide los que tienen al menos uno", async () => {
    await listarPropietarios({ ...filtroBase, inmuebles: "con" });

    expect(llamadasA("not")).toEqual([{ metodo: "not", args: ["inmuebles", "is", null] }]);
    expect(llamadasA("is")).toEqual([]);
  });

  it("sin el filtro no agrega condiciones sobre inmuebles", async () => {
    await listarPropietarios(filtroBase);

    expect(llamadasA("is")).toEqual([]);
    expect(llamadasA("not")).toEqual([]);
  });

  it("se combina con la búsqueda por nombre o correo", async () => {
    await listarPropietarios({ ...filtroBase, search: "ana", inmuebles: "sin" });

    expect(llamadasA("or")).toHaveLength(1);
    expect(llamadasA("is")).toHaveLength(1);
  });
});
