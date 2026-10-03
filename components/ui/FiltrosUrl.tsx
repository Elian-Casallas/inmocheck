"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CLASES_ENTRADA } from "./Campo";
import { Icono } from "./Icono";

const ESPERA_BUSQUEDA_MS = 350;

// Los filtros viven en la URL (?search=apt&tipo=CASA), no en useState:
// así sobreviven a recargar, se pueden compartir por enlace y el botón
// "atrás" funciona. Este hook cambia un parámetro y vuelve a la página 1.
function useParametroUrl() {
  const router = useRouter();
  const ruta = usePathname();
  const parametros = useSearchParams();

  return (clave: string, valor: string) => {
    const nuevos = new URLSearchParams(parametros);
    if (valor) nuevos.set(clave, valor);
    else nuevos.delete(clave);
    nuevos.delete("page");
    router.replace(`${ruta}?${nuevos}`, { scroll: false });
  };
}

type PropsBusqueda = {
  placeholder: string;
  etiqueta: string;
  parametro?: string;
};

export function FiltroBusqueda({ placeholder, etiqueta, parametro = "search" }: PropsBusqueda) {
  const parametros = useSearchParams();
  const cambiarParametro = useParametroUrl();
  const [texto, setTexto] = useState(parametros.get(parametro) ?? "");
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (temporizador.current) clearTimeout(temporizador.current);
  }, []);

  // Debounce: espera a que la persona deje de escribir antes de consultar.
  function alEscribir(valor: string) {
    setTexto(valor);
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => cambiarParametro(parametro, valor.trim()), ESPERA_BUSQUEDA_MS);
  }

  return (
    <div className="relative min-w-56 flex-1">
      <Icono nombre="buscar" className="absolute top-3.5 left-3 size-5 text-texto-tenue" />
      <input
        type="search"
        value={texto}
        onChange={(evento) => alEscribir(evento.target.value)}
        placeholder={placeholder}
        aria-label={etiqueta}
        className={`${CLASES_ENTRADA} pl-[42px]`}
      />
    </div>
  );
}

type PropsSeleccion = {
  parametro: string;
  etiqueta: string;
  opciones: { valor: string; texto: string }[];
  // Valor que se usa cuando el parámetro no está en la URL.
  porDefecto?: string;
};

export function FiltroSeleccion({ parametro, etiqueta, opciones, porDefecto = "" }: PropsSeleccion) {
  const parametros = useSearchParams();
  const cambiarParametro = useParametroUrl();

  return (
    <select
      aria-label={etiqueta}
      value={parametros.get(parametro) ?? porDefecto}
      onChange={(evento) => cambiarParametro(parametro, evento.target.value)}
      className={`${CLASES_ENTRADA} w-auto min-w-44 cursor-pointer max-sm:flex-1`}
    >
      {opciones.map(({ valor, texto }) => (
        <option key={valor} value={valor}>
          {texto}
        </option>
      ))}
    </select>
  );
}
