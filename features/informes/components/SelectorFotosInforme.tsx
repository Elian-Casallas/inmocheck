"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Aviso } from "@/components/ui/Aviso";
import { Boton, clasesBoton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import { PanelCuerpo, PanelPie } from "@/components/ui/PanelLateral";
import { apiFetch, mensajeDeError } from "@/lib/api/client";
import { plural } from "@/lib/formato";

// Fotos de la inspección agrupadas como se verán en el PDF: espacio → elemento.
export type GrupoDeFotos = {
  espacio: string;
  elementos: { nombre: string; fotoIds: string[] }[];
};

type Props = {
  inspeccionId: string;
  grupos: GrupoDeFotos[];
  hrefCerrar: string;
};

// Paso previo a generar el PDF: elegir qué fotos lleva el informe.
// Empieza con todas marcadas; la persona quita las que no quiere.
export function SelectorFotosInforme({ inspeccionId, grupos, hrefCerrar }: Props) {
  const router = useRouter();
  const todas = grupos.flatMap((grupo) => grupo.elementos.flatMap((elemento) => elemento.fotoIds));
  const [elegidas, setElegidas] = useState<Set<string>>(() => new Set(todas));
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function alternar(fotoId: string) {
    setElegidas((actuales) => {
      const siguientes = new Set(actuales);
      if (!siguientes.delete(fotoId)) siguientes.add(fotoId);
      return siguientes;
    });
  }

  async function generar() {
    setGenerando(true);
    setError(null);
    try {
      await apiFetch(`/inspecciones/${inspeccionId}/informes`, {
        method: "POST",
        body: JSON.stringify({ tipo: "ACTA", evidenciaIds: [...elegidas] }),
      });
      router.push(hrefCerrar, { scroll: false });
      router.refresh();
    } catch (causa) {
      setError(mensajeDeError(causa));
      setGenerando(false);
    }
  }

  return (
    <>
      <PanelCuerpo>
        {error && <Aviso tipo="error">{error} Puedes reintentar.</Aviso>}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-cuerpo-sm font-medium">
            {elegidas.size} de {plural(todas.length, "foto")} en el informe
          </span>
          <div className="flex gap-1">
            <Boton variante="texto" tamano="pequeno" onClick={() => setElegidas(new Set(todas))}>
              Todas
            </Boton>
            <Boton variante="texto" tamano="pequeno" onClick={() => setElegidas(new Set())}>
              Ninguna
            </Boton>
          </div>
        </div>

        {grupos.map((grupo) => (
          <section key={grupo.espacio} className="flex flex-col gap-3">
            <h3 className="border-b border-borde pb-1.5 text-cuerpo-sm font-semibold">{grupo.espacio}</h3>
            {grupo.elementos.map((elemento) => (
              <div key={elemento.nombre} className="flex flex-col gap-1.5">
                <span className="text-pequeno font-medium text-texto-secundario">{elemento.nombre}</span>
                <div className="flex flex-wrap gap-2">
                  {elemento.fotoIds.map((fotoId, indice) => {
                    const marcada = elegidas.has(fotoId);
                    return (
                      // La foto entera es la casilla: tocarla la incluye o la quita.
                      <label key={fotoId} className="relative size-[88px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={marcada}
                          onChange={() => alternar(fotoId)}
                          className="peer absolute opacity-0"
                          aria-label={`Incluir la foto ${indice + 1} de ${elemento.nombre} (${grupo.espacio})`}
                        />
                        {/* eslint-disable-next-line @next/next/no-img-element -- enlace privado que vence; next/image no puede optimizarlo */}
                        <img
                          src={`/api/v1/evidencias/${fotoId}/acceso?redirigir=1`}
                          alt=""
                          loading="lazy"
                          className={`size-full rounded-lg bg-sutil object-cover ring-offset-2 peer-focus-visible:ring-3 peer-focus-visible:ring-primario/50 ${
                            marcada ? "ring-2 ring-primario" : "opacity-40"
                          }`}
                        />
                        {marcada && (
                          <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-primario text-white">
                            <Icono nombre="check" className="size-3.5" />
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        ))}
      </PanelCuerpo>
      <PanelPie>
        <Link href={hrefCerrar} scroll={false} className={clasesBoton({ variante: "secundario" })}>
          Cancelar
        </Link>
        <Boton onClick={generar} cargando={generando} textoCargando="Generando PDF…">
          Generar PDF
        </Boton>
      </PanelPie>
    </>
  );
}
