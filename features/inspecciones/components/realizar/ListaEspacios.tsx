import { Icono } from "@/components/ui/Icono";
import type { Detalle } from "@/schemas/inspecciones";
import type { EspacioAgrupado } from "./tipos";

type Props = {
  espacios: EspacioAgrupado<Detalle>[];
  actual: string;
  alElegir: (nombre: string) => void;
};

// Navegación por espacios: columna en escritorio, fila deslizable en celular.
export function ListaEspacios({ espacios, actual, alElegir }: Props) {
  return (
    <nav
      aria-label="Espacios"
      className="flex gap-2 overflow-x-auto max-[899px]:-mx-4 max-[899px]:border-y max-[899px]:border-borde max-[899px]:px-4 max-[899px]:py-3 min-[900px]:flex-col min-[900px]:gap-0 min-[900px]:rounded-xl min-[900px]:border min-[900px]:border-borde min-[900px]:bg-tarjeta min-[900px]:p-2"
    >
      <span className="hidden px-3 pt-2 pb-1 text-pequeno font-medium text-texto-tenue min-[900px]:block">Espacios</span>
      {espacios.map(({ nombre, detalles }) => {
        const evaluados = detalles.filter((detalle) => detalle.estado !== null).length;
        const completo = evaluados === detalles.length;
        const activo = nombre === actual;

        return (
          <button
            key={nombre}
            type="button"
            onClick={() => alElegir(nombre)}
            aria-current={activo ? "true" : undefined}
            className={`flex shrink-0 cursor-pointer items-center justify-between gap-2 text-left text-cuerpo-sm whitespace-nowrap max-[899px]:rounded-full max-[899px]:border max-[899px]:px-3.5 max-[899px]:py-2 min-[900px]:w-full min-[900px]:rounded-lg min-[900px]:px-3 min-[900px]:py-2.5 ${
              activo
                ? "font-medium max-[899px]:border-primario max-[899px]:bg-primario max-[899px]:text-white min-[900px]:bg-primario-suave min-[900px]:text-primario"
                : "max-[899px]:border-borde-fuerte max-[899px]:bg-tarjeta min-[900px]:hover:bg-sutil"
            }`}
          >
            <span>{nombre}</span>
            {completo ? (
              <Icono nombre="check" className={`size-4 ${activo ? "" : "text-inspeccion-finalizada"}`} />
            ) : (
              <span className={`text-pequeno ${activo ? "" : "text-texto-tenue"}`}>
                {evaluados}/{detalles.length}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
