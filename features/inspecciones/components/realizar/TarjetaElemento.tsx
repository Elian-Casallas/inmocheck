import type { ReactNode } from "react";
import { Boton } from "@/components/ui/Boton";
import { CLASES_ENTRADA } from "@/components/ui/Campo";
import { Icono } from "@/components/ui/Icono";
import type { EstadoElemento } from "@/lib/inspecciones";
import { esObligatorioPendiente } from "@/lib/progreso";
import type { Detalle } from "@/schemas/inspecciones";
import { EstadoElementoTexto, SelectorEstado } from "./SelectorEstado";
import type { Borrador, EstadoGuardado } from "./tipos";

type Props = {
  detalle: Detalle;
  borrador: Borrador;
  guardado: EstadoGuardado;
  abierta: boolean;
  alAlternar: () => void;
  alCambiar: (cambios: Partial<Borrador>) => void;
  alGuardar: () => void;
  // Las fotos van dentro de la tarjeta de su elemento (regla de proximidad).
  fotos?: ReactNode;
};

const TEXTO_GUARDADO: Record<EstadoGuardado["tipo"], { texto: string; clase: string }> = {
  "sin-cambios": { texto: "Sin evaluar", clase: "text-texto-tenue" },
  sucio: { texto: "Cambios sin guardar", clase: "text-texto-secundario" },
  guardando: { texto: "Guardando…", clase: "text-texto-secundario" },
  guardado: { texto: "Guardado", clase: "text-inspeccion-finalizada" },
  error: { texto: "", clase: "text-error" },
  conflicto: { texto: "", clase: "text-error" },
};

export function TarjetaElemento({ detalle, borrador, guardado, abierta, alAlternar, alCambiar, alGuardar, fotos }: Props) {
  const idCuerpo = `cuerpo-${detalle.id}`;
  const idObservacion = `observacion-${detalle.id}`;
  const pendiente = esObligatorioPendiente(detalle);
  const faltaJustificar = borrador.estado === "NO_APLICA" && detalle.obligatorio && !borrador.observacion.trim();

  const etiquetas = [detalle.obligatorio ? "Obligatorio" : "Opcional"];
  if (detalle.evidencias.length > 0) {
    etiquetas.push(`${detalle.evidencias.length} ${detalle.evidencias.length === 1 ? "foto" : "fotos"}`);
  }

  return (
    <article id={detalle.id} className="scroll-mt-24 overflow-hidden rounded-xl border border-borde bg-tarjeta">
      <button
        type="button"
        onClick={alAlternar}
        aria-expanded={abierta}
        aria-controls={idCuerpo}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left min-[900px]:px-5 min-[900px]:py-4"
      >
        <span className="flex flex-1 flex-col gap-0.5">
          <span className={abierta ? "text-titulo-seccion font-semibold" : "text-cuerpo-sm font-medium"}>
            {detalle.elementoNombre}
          </span>
          <span className={`text-pequeno font-medium ${pendiente ? "text-inspeccion-pendiente" : "text-texto-tenue"}`}>
            {etiquetas.join(" · ")}
          </span>
        </span>
        {!abierta && <EstadoElementoTexto estado={detalle.estado} />}
        <Icono nombre="flecha-abajo" className={`size-5 text-texto-tenue transition-transform ${abierta ? "rotate-180" : ""}`} />
      </button>

      {abierta && (
        <div id={idCuerpo} className="flex flex-col gap-5 px-4 pb-4 min-[900px]:px-5 min-[900px]:pb-5">
          <SelectorEstado
            nombre={`estado-${detalle.id}`}
            valor={borrador.estado}
            alCambiar={(estado: EstadoElemento) => alCambiar({ estado })}
          />

          <div className="grid items-start gap-6 min-[900px]:grid-cols-[minmax(0,1fr)_auto]">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={idObservacion} className="text-cuerpo-sm font-medium">
                Observación
                {!faltaJustificar && <span className="font-normal text-texto-tenue"> (opcional)</span>}
              </label>
              <textarea
                id={idObservacion}
                value={borrador.observacion}
                onChange={(evento) => alCambiar({ observacion: evento.target.value })}
                maxLength={2000}
                placeholder="Describe lo que observas"
                aria-invalid={faltaJustificar || undefined}
                className={`${CLASES_ENTRADA} min-h-[88px] resize-y`}
              />
              {faltaJustificar && (
                <span className="text-pequeno text-error">Explica por qué este elemento obligatorio no aplica.</span>
              )}
            </div>
            {fotos}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-borde pt-4">
            <span
              role="status"
              className={`text-cuerpo-sm ${TEXTO_GUARDADO[guardado.tipo].clase}`}
            >
              {guardado.tipo === "error"
                ? guardado.mensaje
                : guardado.tipo === "conflicto"
                  ? "Este elemento cambió en otra sesión. Revisa el valor actual y guarda de nuevo."
                  : TEXTO_GUARDADO[guardado.tipo].texto}
            </span>
            <Boton
              variante="secundario"
              onClick={alGuardar}
              cargando={guardado.tipo === "guardando"}
              textoCargando="Guardando…"
              disabled={!borrador.estado || faltaJustificar}
            >
              Guardar
            </Boton>
          </div>
        </div>
      )}
    </article>
  );
}
