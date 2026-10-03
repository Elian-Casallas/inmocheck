"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { CLASES_ENTRADA } from "@/components/ui/Campo";
import { Icono } from "@/components/ui/Icono";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { apiFetch, mensajeDeError } from "@/lib/api/client";
import { plural } from "@/lib/formato";
import type { Elemento, Espacio } from "@/schemas/inventario";

type Props = {
  inmuebleId: string;
  espacios: Espacio[];
  editable: boolean;
};

// Árbol de espacios y elementos. No guarda copia local de los datos: cada
// acción llama a la API y, cuando responde bien, router.refresh() vuelve a
// pedir la lista al servidor. Así lo que se ve es siempre lo guardado.
export function EditorInventario({ inmuebleId, espacios, editable }: Props) {
  const router = useRouter();
  const [actualizando, iniciarTransicion] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function ejecutar(ruta: string, metodo: "POST" | "PATCH", cuerpo: object): Promise<boolean> {
    setError(null);
    try {
      await apiFetch(ruta, { method: metodo, body: JSON.stringify(cuerpo) });
      iniciarTransicion(() => router.refresh());
      return true;
    } catch (causa) {
      setError(mensajeDeError(causa));
      return false;
    }
  }

  const visibles = editable ? espacios : espacios.filter((espacio) => espacio.activo);

  return (
    <div className="flex flex-col gap-3" aria-busy={actualizando}>
      {error && <Aviso tipo="error">{error}</Aviso>}

      {visibles.length === 0 && (
        <Tarjeta className="text-cuerpo-sm text-texto-secundario">
          {editable
            ? "Este inmueble aún no tiene espacios. Agrega el primero (por ejemplo, Cocina)."
            : "Este inmueble aún no tiene inventario."}
        </Tarjeta>
      )}

      {visibles.map((espacio) => {
        const elementos = editable ? espacio.elementos : espacio.elementos.filter((elemento) => elemento.activo);
        const activos = espacio.elementos.filter((elemento) => elemento.activo).length;

        return (
          <Tarjeta key={espacio.id} relleno={false} className={espacio.activo ? "" : "opacity-60"}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-3">
              <h2 className="text-titulo-seccion font-semibold">
                {espacio.nombre}
                {!espacio.activo && <span className="font-normal text-texto-tenue"> (inactivo)</span>}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-cuerpo-sm text-texto-secundario">{plural(activos, "elemento")}</span>
                {editable && (
                  <Boton
                    variante="texto"
                    tamano="pequeno"
                    onClick={() => ejecutar(`/espacios/${espacio.id}`, "PATCH", { activo: !espacio.activo })}
                  >
                    {espacio.activo ? "Desactivar espacio" : "Reactivar"}
                  </Boton>
                )}
              </div>
            </div>

            <ul className="border-t border-borde">
              {elementos.map((elemento) => (
                <FilaElemento
                  key={elemento.id}
                  elemento={elemento}
                  editable={editable && espacio.activo}
                  alCambiar={(cambios) => ejecutar(`/elementos/${elemento.id}`, "PATCH", cambios)}
                />
              ))}
              {editable && espacio.activo && (
                <li className="border-t border-borde first:border-t-0">
                  <FormularioAgregar
                    etiqueta={`Nuevo elemento en ${espacio.nombre}`}
                    placeholder="Nuevo elemento, ej.: Ventana"
                    alAgregar={(nombre) =>
                      ejecutar(`/espacios/${espacio.id}/elementos`, "POST", { nombre, obligatorio: true })
                    }
                  />
                </li>
              )}
            </ul>
          </Tarjeta>
        );
      })}

      {editable && (
        <Tarjeta relleno={false}>
          <FormularioAgregar
            etiqueta="Nombre del espacio nuevo"
            placeholder="Nuevo espacio, ej.: Balcón, Habitación 2"
            textoBoton="Agregar espacio"
            alAgregar={(nombre) => ejecutar(`/inmuebles/${inmuebleId}/espacios`, "POST", { nombre })}
          />
        </Tarjeta>
      )}
    </div>
  );
}

type PropsFila = {
  elemento: Elemento;
  editable: boolean;
  alCambiar: (cambios: { obligatorio?: boolean; activo?: boolean }) => void;
};

function FilaElemento({ elemento, editable, alCambiar }: PropsFila) {
  return (
    <li className="flex items-center gap-3 border-t border-borde px-5 py-3.5 first:border-t-0">
      <span className={`flex-1 text-cuerpo-sm ${elemento.activo ? "" : "text-texto-tenue line-through"}`}>
        {elemento.nombre}
      </span>

      {elemento.activo && (
        <label className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap">
          <input
            type="checkbox"
            role="switch"
            checked={elemento.obligatorio}
            disabled={!editable}
            onChange={(evento) => alCambiar({ obligatorio: evento.target.checked })}
            aria-label={`${elemento.nombre} obligatorio`}
            className="relative h-5 w-9 cursor-pointer appearance-none rounded-full bg-borde-fuerte transition-colors after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:transition-transform checked:bg-primario checked:after:translate-x-4 disabled:cursor-default disabled:opacity-60"
          />
          <span className="text-pequeno font-medium text-texto-secundario">Obligatorio</span>
        </label>
      )}

      {editable && (
        <Boton variante="texto" tamano="pequeno" onClick={() => alCambiar({ activo: !elemento.activo })}>
          {elemento.activo ? "Desactivar" : "Reactivar"}
        </Boton>
      )}
    </li>
  );
}

type PropsAgregar = {
  etiqueta: string;
  placeholder: string;
  textoBoton?: string;
  alAgregar: (nombre: string) => Promise<boolean>;
};

function FormularioAgregar({ etiqueta, placeholder, textoBoton = "Agregar", alAgregar }: PropsAgregar) {
  const [nombre, setNombre] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (nombre.trim().length < 2) return;

    setEnviando(true);
    const guardado = await alAgregar(nombre.trim());
    setEnviando(false);
    // El campo solo se limpia si el servidor confirmó que guardó.
    if (guardado) setNombre("");
  }

  return (
    <form onSubmit={enviar} className="flex items-center gap-3 px-5 py-3.5">
      <input
        value={nombre}
        onChange={(evento) => setNombre(evento.target.value)}
        placeholder={placeholder}
        aria-label={etiqueta}
        maxLength={80}
        className={`${CLASES_ENTRADA} flex-1`}
      />
      <Boton type="submit" variante="secundario" tamano="pequeno" cargando={enviando} textoCargando="Agregando…">
        <Icono nombre="mas" />
        {textoBoton}
      </Boton>
    </form>
  );
}
