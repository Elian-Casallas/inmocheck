import { ESTADOS_ELEMENTO, ETIQUETA_ESTADO_ELEMENTO, type EstadoElemento } from "@/lib/inspecciones";

// Tailwind necesita ver los nombres de clase completos en el código, por eso
// van escritos uno por uno y no armados con una plantilla.
const COLOR_PUNTO: Record<EstadoElemento, string> = {
  EXCELENTE: "bg-estado-excelente",
  BUENO: "bg-estado-bueno",
  REGULAR: "bg-estado-regular",
  DANADO: "bg-estado-danado",
  NO_APLICA: "bg-estado-no-aplica",
};

const COLOR_TEXTO: Record<EstadoElemento, string> = {
  EXCELENTE: "text-estado-excelente",
  BUENO: "text-estado-bueno",
  REGULAR: "text-estado-regular",
  DANADO: "text-estado-danado",
  NO_APLICA: "text-estado-no-aplica",
};

const COLOR_ELEGIDO: Record<EstadoElemento, string> = {
  EXCELENTE: "peer-checked:border-estado-excelente peer-checked:bg-estado-excelente",
  BUENO: "peer-checked:border-estado-bueno peer-checked:bg-estado-bueno",
  REGULAR: "peer-checked:border-estado-regular peer-checked:bg-estado-regular",
  DANADO: "peer-checked:border-estado-danado peer-checked:bg-estado-danado",
  NO_APLICA: "peer-checked:border-estado-no-aplica peer-checked:bg-estado-no-aplica",
};

// Estado de un elemento en modo lectura: punto de color + texto.
export function EstadoElementoTexto({ estado }: { estado: EstadoElemento | null }) {
  if (!estado) return <span className="text-cuerpo-sm text-texto-tenue">Sin evaluar</span>;

  return (
    <span className={`inline-flex items-center gap-1.5 text-cuerpo-sm font-medium whitespace-nowrap ${COLOR_TEXTO[estado]}`}>
      <span className="size-2 rounded-full bg-current" aria-hidden="true" />
      {ETIQUETA_ESTADO_ELEMENTO[estado]}
    </span>
  );
}

type Props = {
  nombre: string;
  valor: EstadoElemento | null;
  alCambiar: (estado: EstadoElemento) => void;
};

// Cinco opciones tipo "chip". Por dentro son radios de verdad: se manejan
// con las flechas del teclado y el lector de pantalla anuncia el grupo.
export function SelectorEstado({ nombre, valor, alCambiar }: Props) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="pb-2 text-cuerpo-sm font-medium">Estado</legend>
      <div className="flex flex-wrap gap-2">
        {ESTADOS_ELEMENTO.map((estado) => (
          <label key={estado} className="relative">
            <input
              type="radio"
              name={nombre}
              value={estado}
              checked={valor === estado}
              onChange={() => alCambiar(estado)}
              className="peer absolute opacity-0"
            />
            <span
              className={`group inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-borde-fuerte bg-tarjeta px-3 text-cuerpo-sm font-medium peer-checked:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primario/35 ${COLOR_ELEGIDO[estado]}`}
            >
              <span
                aria-hidden="true"
                className={`size-2 rounded-full ${valor === estado ? "bg-white" : COLOR_PUNTO[estado]}`}
              />
              {ETIQUETA_ESTADO_ELEMENTO[estado]}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
