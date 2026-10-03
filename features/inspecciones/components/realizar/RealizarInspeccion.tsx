"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { ApiError, apiFetch, mensajeDeError } from "@/lib/api/client";
import { calcularProgreso, esObligatorioPendiente } from "@/lib/progreso";
import type { Detalle, Evidencia, Inspeccion } from "@/schemas/inspecciones";
import { FotosElemento } from "./FotosElemento";
import { ListaEspacios } from "./ListaEspacios";
import { ProgresoInspeccion } from "./ProgresoInspeccion";
import { TarjetaElemento } from "./TarjetaElemento";
import { agruparPorEspacio, type Borrador, type EstadoGuardado } from "./tipos";

type Props = {
  inspeccion: Inspeccion;
  detallesIniciales: Detalle[];
};

type Pendiente = { detalle: Detalle; motivo: string };

// Dónde vive el estado de esta pantalla:
//  * detalles   → lo CONFIRMADO por el servidor (con su versión).
//  * borradores → lo que la persona está editando y aún no guarda.
//  * guardados  → el estado de guardado de cada elemento.
// Separar "confirmado" de "borrador" es lo que permite no mostrar nunca
// "Guardado" antes de que el servidor responda (CA-15).
export function RealizarInspeccion({ inspeccion, detallesIniciales }: Props) {
  const router = useRouter();
  const [detalles, setDetalles] = useState(detallesIniciales);
  const [borradores, setBorradores] = useState<Record<string, Borrador>>({});
  const [guardados, setGuardados] = useState<Record<string, EstadoGuardado>>({});
  const [espacioActual, setEspacioActual] = useState(detallesIniciales[0]?.espacioNombre ?? "");
  const [abiertoId, setAbiertoId] = useState<string | null>(
    detallesIniciales.find((detalle) => detalle.estado === null)?.id ?? null,
  );
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [errorFinalizar, setErrorFinalizar] = useState<string | null>(null);
  const [finalizando, setFinalizando] = useState(false);

  const espacios = useMemo(() => agruparPorEspacio(detalles), [detalles]);
  const progreso = useMemo(() => calcularProgreso(detalles), [detalles]);
  const haySinGuardar = Object.keys(borradores).length > 0;

  // Aviso del navegador al cerrar o recargar con cambios sin guardar.
  useEffect(() => {
    if (!haySinGuardar) return;
    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [haySinGuardar]);

  const borradorDe = (detalle: Detalle): Borrador =>
    borradores[detalle.id] ?? { estado: detalle.estado, observacion: detalle.observacion ?? "" };

  const estadoGuardadoDe = (detalle: Detalle): EstadoGuardado =>
    guardados[detalle.id] ?? (detalle.estado ? { tipo: "guardado" } : { tipo: "sin-cambios" });

  const marcar = (id: string, estado: EstadoGuardado) =>
    setGuardados((actuales) => ({ ...actuales, [id]: estado }));

  function cambiar(detalle: Detalle, cambios: Partial<Borrador>) {
    setBorradores((actuales) => ({ ...actuales, [detalle.id]: { ...borradorDe(detalle), ...cambios } }));
    marcar(detalle.id, { tipo: "sucio" });
  }

  function quitarBorrador(id: string) {
    setBorradores((actuales) =>
      Object.fromEntries(Object.entries(actuales).filter(([clave]) => clave !== id)),
    );
  }

  // Las fotos se guardan al instante (no pasan por el borrador): la lista
  // solo cambia cuando el servidor ya confirmó la subida o el borrado.
  function cambiarEvidencias(detalleId: string, cambio: (actuales: Evidencia[]) => Evidencia[]) {
    setDetalles((actuales) =>
      actuales.map((item) => (item.id === detalleId ? { ...item, evidencias: cambio(item.evidencias) } : item)),
    );
  }

  async function guardar(detalle: Detalle) {
    const borrador = borradorDe(detalle);
    if (!borrador.estado) return;

    marcar(detalle.id, { tipo: "guardando" });
    try {
      const { data } = await apiFetch<{ data: Pick<Detalle, "estado" | "observacion" | "version"> }>(
        `/inspecciones/${inspeccion.id}/detalles/${detalle.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            estado: borrador.estado,
            observacion: borrador.observacion.trim() || null,
            version: detalle.version,
          }),
        },
      );
      // Solo aquí, con la respuesta del servidor en la mano, pasa a "Guardado".
      setDetalles((actuales) => actuales.map((item) => (item.id === detalle.id ? { ...item, ...data } : item)));
      quitarBorrador(detalle.id);
      marcar(detalle.id, { tipo: "guardado" });
      setPendientes((actuales) => actuales.filter((pendiente) => pendiente.detalle.id !== detalle.id));
    } catch (error) {
      if (error instanceof ApiError && error.code === "VERSION_CONFLICT") {
        await resolverConflicto(detalle.id);
        return;
      }
      marcar(detalle.id, { tipo: "error", mensaje: mensajeDeError(error) });
    }
  }

  // 409 de versión: NO se reintenta a ciegas. Se trae lo que hay en el
  // servidor, se muestra, y la persona decide si vuelve a guardar.
  async function resolverConflicto(detalleId: string) {
    try {
      const { data } = await apiFetch<{ data: Detalle[] }>(`/inspecciones/${inspeccion.id}/detalles`);
      setDetalles(data);
      quitarBorrador(detalleId);
      marcar(detalleId, { tipo: "conflicto" });
    } catch (error) {
      marcar(detalleId, { tipo: "error", mensaje: mensajeDeError(error) });
    }
  }

  async function finalizar() {
    setErrorFinalizar(null);
    const faltantes: Pendiente[] = [
      ...detalles.filter(esObligatorioPendiente).map((detalle) => ({ detalle, motivo: "sin evaluar" })),
      ...detalles
        .filter((detalle) => borradores[detalle.id])
        .map((detalle) => ({ detalle, motivo: "cambios sin guardar" })),
    ];
    setPendientes(faltantes);
    if (faltantes.length > 0) return;

    setFinalizando(true);
    try {
      await apiFetch(`/inspecciones/${inspeccion.id}/finalizacion`, {
        method: "POST",
        body: JSON.stringify({ version: inspeccion.version }),
      });
      router.push(`/dashboard/inspecciones/${inspeccion.id}/informe`);
      router.refresh();
    } catch (error) {
      setErrorFinalizar(mensajeDeError(error));
      setFinalizando(false);
    }
  }

  function irA(detalle: Detalle) {
    setEspacioActual(detalle.espacioNombre);
    setAbiertoId(detalle.id);
    requestAnimationFrame(() => document.getElementById(detalle.id)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  function elegirEspacio(nombre: string) {
    setEspacioActual(nombre);
    const primeroSinEvaluar = espacios
      .find((espacio) => espacio.nombre === nombre)
      ?.detalles.find((detalle) => detalle.estado === null);
    setAbiertoId(primeroSinEvaluar?.id ?? null);
  }

  const visibles = espacios.find((espacio) => espacio.nombre === espacioActual)?.detalles ?? [];
  const botonFinalizar = (
    <Boton onClick={finalizar} cargando={finalizando} textoCargando="Finalizando…" bloque>
      Finalizar inspección
    </Boton>
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <ProgresoInspeccion {...progreso} />
        </div>
        <div className="hidden min-[900px]:block">{botonFinalizar}</div>
      </div>

      <div className="grid items-start gap-6 min-[900px]:grid-cols-[260px_minmax(0,1fr)]">
        <ListaEspacios espacios={espacios} actual={espacioActual} alElegir={elegirEspacio} />

        <section className="flex flex-col gap-3">
          {errorFinalizar && <Aviso tipo="error">{errorFinalizar}</Aviso>}
          {pendientes.length > 0 && (
            <Aviso tipo="error">
              <strong>Aún no puedes finalizar.</strong> Revisa estos elementos:
              <ul className="mt-1.5 list-disc pl-5">
                {pendientes.map(({ detalle, motivo }) => (
                  <li key={`${detalle.id}-${motivo}`}>
                    <button type="button" onClick={() => irA(detalle)} className="cursor-pointer font-medium underline">
                      {detalle.espacioNombre} · {detalle.elementoNombre}
                    </button>{" "}
                    — {motivo}
                  </li>
                ))}
              </ul>
            </Aviso>
          )}

          <h2 className="text-titulo-seccion font-semibold">{espacioActual}</h2>
          {visibles.map((detalle) => (
            <TarjetaElemento
              key={detalle.id}
              detalle={detalle}
              borrador={borradorDe(detalle)}
              guardado={estadoGuardadoDe(detalle)}
              abierta={abiertoId === detalle.id}
              alAlternar={() => setAbiertoId(abiertoId === detalle.id ? null : detalle.id)}
              alCambiar={(cambios) => cambiar(detalle, cambios)}
              alGuardar={() => guardar(detalle)}
              fotos={
                <FotosElemento
                  inspeccionId={inspeccion.id}
                  detalleId={detalle.id}
                  nombreElemento={detalle.elementoNombre}
                  evidencias={detalle.evidencias}
                  alAgregar={(evidencia) =>
                    cambiarEvidencias(detalle.id, (actuales) => [...actuales, evidencia])
                  }
                  alQuitar={(evidenciaId) =>
                    cambiarEvidencias(detalle.id, (actuales) => actuales.filter(({ id }) => id !== evidenciaId))
                  }
                />
              }
            />
          ))}
        </section>
      </div>

      {/* En celular el botón queda fijo abajo, al alcance del pulgar. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-borde bg-tarjeta px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] min-[900px]:hidden">
        {botonFinalizar}
      </div>
    </>
  );
}
