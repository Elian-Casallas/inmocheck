import { describe, expect, it } from "vitest";
import { contrasenaSchema, loginSchema, nuevaContrasenaSchema } from "@/schemas/auth";
import { paginacionSchema } from "@/schemas/comun";
import { inmuebleCrearSchema, inmuebleEditarSchema, inmueblesFiltroSchema } from "@/schemas/inmuebles";
import { detalleGuardarSchema, inspeccionCancelarSchema, inspeccionCrearSchema } from "@/schemas/inspecciones";

const UUID = "11111111-1111-4111-8111-111111111111";

const inmuebleValido = {
  codigo: "APT-302",
  tipo: "APARTAMENTO",
  direccion: "Calle 10 #20-30, apartamento 302",
  ciudad: "Villavicencio",
  departamento: "Meta",
  habitaciones: 3,
  banos: 2,
  propietarioId: UUID,
};

describe("contraseña", () => {
  it.each([
    ["12345678", "solo números"],
    ["abcdefgh", "solo letras"],
    ["abc123", "menos de 8 caracteres"],
  ])("rechaza %s (%s)", (valor) => {
    expect(contrasenaSchema.safeParse(valor).success).toBe(false);
  });

  it("acepta 8 caracteres con letra y número", () => {
    expect(contrasenaSchema.safeParse("clave2026").success).toBe(true);
  });

  it("exige que la confirmación coincida", () => {
    const resultado = nuevaContrasenaSchema.safeParse({ password: "clave2026", confirmacion: "clave2027" });

    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0].path).toEqual(["confirmacion"]);
  });
});

describe("login", () => {
  it("normaliza el correo a minúsculas y sin espacios", () => {
    expect(loginSchema.parse({ email: "  Admin@Pinos.TEST ", password: "x" }).email).toBe("admin@pinos.test");
  });

  it("rechaza campos de más (.strict)", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x", rol: "ADMIN" }).success).toBe(false);
  });
});

describe("inmueble", () => {
  it("acepta un inmueble válido", () => {
    expect(inmuebleCrearSchema.safeParse(inmuebleValido).success).toBe(true);
  });

  it("rechaza habitaciones negativas y área en cero", () => {
    expect(inmuebleCrearSchema.safeParse({ ...inmuebleValido, habitaciones: -1 }).success).toBe(false);
    expect(inmuebleCrearSchema.safeParse({ ...inmuebleValido, areaM2: 0 }).success).toBe(false);
  });

  it("no deja que el cliente envíe la organización", () => {
    expect(inmuebleCrearSchema.safeParse({ ...inmuebleValido, organizacionId: UUID }).success).toBe(false);
    expect(inmuebleEditarSchema.safeParse({ organizacionId: UUID }).success).toBe(false);
  });

  it("al editar todos los campos son opcionales", () => {
    expect(inmuebleEditarSchema.safeParse({ descripcion: "Nueva descripción" }).success).toBe(true);
  });

  it("solo acepta valores de orden de la lista blanca", () => {
    expect(inmueblesFiltroSchema.safeParse({ sort: "-createdAt" }).success).toBe(true);
    expect(inmueblesFiltroSchema.safeParse({ sort: "codigo; drop table inmuebles" }).success).toBe(false);
  });
});

describe("paginación", () => {
  it("usa página 1 y tamaño 20 por defecto", () => {
    expect(paginacionSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
  });

  it("convierte los textos de la URL a número", () => {
    expect(paginacionSchema.parse({ page: "3", pageSize: "50" })).toEqual({ page: 3, pageSize: 50 });
  });

  it("rechaza página 0 y tamaños mayores a 100", () => {
    expect(paginacionSchema.safeParse({ page: "0" }).success).toBe(false);
    expect(paginacionSchema.safeParse({ pageSize: "101" }).success).toBe(false);
  });
});

describe("inspecciones", () => {
  it("exige fecha con zona horaria", () => {
    const base = { inmuebleId: UUID, inspectorId: UUID, tipo: "ENTRADA" };

    expect(inspeccionCrearSchema.safeParse({ ...base, programadaPara: "2026-10-05T09:00:00-05:00" }).success).toBe(true);
    expect(inspeccionCrearSchema.safeParse({ ...base, programadaPara: "mañana" }).success).toBe(false);
  });

  it("no acepta estados que no existen", () => {
    expect(detalleGuardarSchema.safeParse({ estado: "PERFECTO", version: 1 }).success).toBe(false);
    expect(detalleGuardarSchema.safeParse({ estado: "DANADO", version: 1 }).success).toBe(true);
  });

  it("exige la versión para guardar", () => {
    expect(detalleGuardarSchema.safeParse({ estado: "BUENO" }).success).toBe(false);
  });

  it("exige motivo para cancelar", () => {
    expect(inspeccionCancelarSchema.safeParse({ motivo: "  ", version: 1 }).success).toBe(false);
    expect(inspeccionCancelarSchema.safeParse({ motivo: "El ocupante canceló", version: 1 }).success).toBe(true);
  });
});
