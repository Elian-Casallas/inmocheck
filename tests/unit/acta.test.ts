import { writeFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import type { Detalle } from "@/schemas/inspecciones";

// "server-only" lanza un error fuera de Next.js; en la prueba se reemplaza por nada.
vi.mock("server-only", () => ({}));

const { renderizarActa } = await import("@/server/pdf/acta");

// PNG de 1×1 píxel: suficiente para comprobar que las fotos se incrustan.
const PNG_MINIMO = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function detalle(espacio: string, elemento: string, cambios: Partial<Detalle> = {}): Detalle {
  return {
    id: `${espacio}-${elemento}`,
    elementoId: `${espacio}-${elemento}`,
    espacioNombre: espacio,
    elementoNombre: elemento,
    obligatorio: true,
    estado: "BUENO",
    observacion: null,
    version: 2,
    evidencias: [],
    ...cambios,
  };
}

const foto = (espacio: string, elemento: string) => ({
  espacio,
  elemento,
  datos: PNG_MINIMO,
  formato: "png" as const,
});

const datosBase = {
  codigoInforme: "INF-2026-PRUEBA01",
  version: 1,
  organizacion: "Inmobiliaria de Prueba",
  tipo: "SALIDA" as const,
  inmueble: "APT-302 · Calle 10 #20-30 · Villavicencio",
  propietario: "María López",
  inspector: "Laura Díaz",
  programadaPara: "2026-10-08T15:00:00Z",
  finalizadaEn: "2026-10-08T16:30:00Z",
  generadoEn: "2026-10-08T16:32:00Z",
  detalles: [
    detalle("Cocina", "Grifería", { estado: "REGULAR", observacion: "Presenta fuga al cerrar la llave." }),
    detalle("Cocina", "Paredes"),
    detalle("Baño", "Ducha", { estado: "DANADO", observacion: "La regadera está rota." }),
    detalle("Sala comedor", "Ventanas", { estado: "EXCELENTE" }),
  ],
  resumenComparacion: "3 elementos comparados, 1 con cambio de estado y 0 no comparables.",
};

describe("renderizarActa", () => {
  it("genera un PDF válido sin fotos", async () => {
    const pdf = await renderizarActa({ ...datosBase, fotos: [] });

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("genera un PDF con fotos de varios espacios y elementos", async () => {
    // Un caso parecido al real: varios elementos con una foto, uno con dos y
    // uno con más de cuatro (que debe partirse en dos bloques).
    const fotos = [
      ...["Paredes", "Piso", "Grifería", "Gabinetes", "Enchufes", "Mesón"].map((elemento) => foto("Cocina", elemento)),
      foto("Baño", "Ducha"),
      foto("Baño", "Ducha"),
      foto("Baño", "Lavamanos"),
      ...Array.from({ length: 6 }, () => foto("Sala comedor", "Ventanas")),
      foto("Sala comedor", "Piso"),
    ];
    const sinFotos = await renderizarActa({ ...datosBase, fotos: [] });
    const conFotos = await renderizarActa({ ...datosBase, fotos });

    expect(conFotos.subarray(0, 5).toString()).toBe("%PDF-");
    expect(conFotos.length).toBeGreaterThan(sinFotos.length);

    // Para revisar el diseño a ojo: GUARDAR_PDF=ruta.pdf npm test
    if (process.env.GUARDAR_PDF) writeFileSync(process.env.GUARDAR_PDF, conFotos);
  });
});
