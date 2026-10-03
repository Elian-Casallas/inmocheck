import { useRef, useState, type ChangeEvent } from "react";
import { Icono } from "@/components/ui/Icono";
import { apiFetch, mensajeDeError } from "@/lib/api/client";
import { subirArchivo } from "@/lib/api/subir";
import { FOTOS_MAXIMAS_POR_ELEMENTO } from "@/lib/constantes";
import { reducirFoto } from "@/lib/imagenes";
import type { Evidencia } from "@/schemas/inspecciones";

type Props = {
  inspeccionId: string;
  detalleId: string;
  nombreElemento: string;
  evidencias: Evidencia[];
  alAgregar: (evidencia: Evidencia) => void;
  alQuitar: (evidenciaId: string) => void;
};

// La miniatura apunta a nuestra API, que valida permisos y redirige a un
// enlace firmado de 60 segundos. El bucket es privado: no hay URL pública.
export const urlFoto = (evidenciaId: string) => `/api/v1/evidencias/${evidenciaId}/acceso?redirigir=1`;

export function FotosElemento({ inspeccionId, detalleId, nombreElemento, evidencias, alAgregar, alQuitar }: Props) {
  const selector = useRef<HTMLInputElement>(null);
  const [progreso, setProgreso] = useState<number | null>(null);
  const [errores, setErrores] = useState<string[]>([]);
  const cupo = FOTOS_MAXIMAS_POR_ELEMENTO - evidencias.length;

  async function alElegirArchivos(evento: ChangeEvent<HTMLInputElement>) {
    const archivos = [...(evento.target.files ?? [])].slice(0, cupo);
    evento.target.value = ""; // permite volver a elegir el mismo archivo
    setErrores([]);

    // Una por una: cada foto tiene su propio resultado y su propio error.
    for (const archivo of archivos) {
      setProgreso(0);
      try {
        const formulario = new FormData();
        formulario.append("archivo", await reducirFoto(archivo), archivo.name);
        const { data } = await subirArchivo<{ data: Evidencia }>(
          `/inspecciones/${inspeccionId}/detalles/${detalleId}/evidencias`,
          formulario,
          setProgreso,
        );
        // La miniatura aparece solo cuando el servidor confirma la subida.
        alAgregar(data);
      } catch (error) {
        setErrores((actuales) => [...actuales, `${archivo.name}: ${mensajeDeError(error)}`]);
      }
    }
    setProgreso(null);
  }

  async function quitar(evidenciaId: string) {
    setErrores([]);
    try {
      await apiFetch(`/evidencias/${evidenciaId}`, { method: "DELETE" });
      alQuitar(evidenciaId);
    } catch (error) {
      setErrores([mensajeDeError(error)]);
    }
  }

  return (
    <div className="flex flex-col gap-1.5 min-[900px]:max-w-[330px]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-cuerpo-sm font-medium">Fotos</span>
        <span className="text-pequeno font-medium text-texto-tenue">
          {evidencias.length} de {FOTOS_MAXIMAS_POR_ELEMENTO}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {evidencias.map((evidencia, indice) => (
          <div key={evidencia.id} className="relative size-[72px]">
            {/* <img> normal: el optimizador de next/image no puede seguir un enlace privado que vence. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urlFoto(evidencia.id)}
              alt={`Foto ${indice + 1} de ${nombreElemento}`}
              loading="lazy"
              className="size-full rounded-lg bg-sutil object-cover"
            />
            <button
              type="button"
              onClick={() => quitar(evidencia.id)}
              aria-label={`Quitar la foto ${indice + 1} de ${nombreElemento}`}
              className="absolute -top-1.5 -right-1.5 grid size-6 cursor-pointer place-items-center rounded-full border border-borde bg-tarjeta text-texto-secundario shadow-tarjeta hover:bg-sutil"
            >
              <Icono nombre="cerrar" className="size-3.5" />
            </button>
          </div>
        ))}

        {cupo > 0 && (
          <button
            type="button"
            onClick={() => selector.current?.click()}
            disabled={progreso !== null}
            className="flex size-[72px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-primario bg-primario-suave text-pequeno font-medium text-primario disabled:cursor-wait disabled:opacity-70"
          >
            <Icono nombre="camara" className="size-[22px]" />
            {progreso === null ? "Foto" : `${progreso}%`}
          </button>
        )}
      </div>

      {/* capture="environment" abre la cámara trasera en el celular. */}
      <input
        ref={selector}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        multiple
        onChange={alElegirArchivos}
        className="hidden"
        aria-label={`Agregar fotos de ${nombreElemento}`}
      />

      {errores.length > 0 && (
        <ul role="alert" className="flex flex-col gap-0.5 text-pequeno text-error">
          {errores.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
