import Link from "next/link";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { Aviso } from "@/components/ui/Aviso";
import { clasesBoton } from "@/components/ui/Boton";
import { ChipsFiltro } from "@/components/ui/ChipsFiltro";
import { FiltroSeleccion } from "@/components/ui/FiltrosUrl";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { cargarInspeccion } from "@/features/inspecciones/cargar";
import { EstadoElementoTexto } from "@/features/inspecciones/components/realizar/SelectorEstado";
import type { ElementoComparado, LadoComparado, ResultadoComparacion } from "@/lib/comparacion";
import { formatearFecha } from "@/lib/formato";
import { aplanarParametros, urlCon, type ParametrosBusqueda } from "@/lib/url";
import { exigirActor } from "@/server/auth/sesion";
import { compararInspecciones, listarEntradasComparables } from "@/server/services/comparacion.service";

const TEXTO_RESULTADO: Record<ResultadoComparacion, { texto: string; clase: string }> = {
  SIN_CAMBIO: { texto: "Sin cambio", clase: "text-texto-tenue" },
  CAMBIO: { texto: "Cambio de estado registrado", clase: "text-inspeccion-pendiente" },
  NO_COMPARABLE: { texto: "No comparable", clase: "text-texto-secundario" },
};

const FILTROS = [
  { valor: "todos", texto: "Todos" },
  { valor: "cambios", texto: "Con cambios", resultado: "CAMBIO" },
  { valor: "no-comparables", texto: "No comparables", resultado: "NO_COMPARABLE" },
] as const;

export default async function PaginaInspeccionComparar({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<ParametrosBusqueda>;
}) {
  const { id } = await params;
  const parametros = aplanarParametros(await searchParams);
  const [, salida] = await Promise.all([exigirActor(), cargarInspeccion(id)]);
  const ruta = `/dashboard/inspecciones/${salida.id}`;
  const rutaComparar = `${ruta}/comparar`;

  const encabezado = (
    <EncabezadoPagina
      titulo={`${salida.inmueble.codigo} · Entrada y salida`}
      volver={{ href: ruta, etiqueta: "Inspección" }}
      acciones={
        <Link href={`${ruta}/informe`} className={clasesBoton()}>
          Ver informe de salida
        </Link>
      }
    />
  );

  if (salida.tipo !== "SALIDA" || salida.estado !== "FINALIZADA") {
    return (
      <>
        {encabezado}
        <Aviso>La comparación está disponible para inspecciones de salida ya finalizadas.</Aviso>
      </>
    );
  }

  const entradas = await listarEntradasComparables(salida);
  if (entradas.length === 0) {
    return (
      <>
        {encabezado}
        <Aviso>Este inmueble no tiene una inspección de entrada finalizada anterior con la cual comparar.</Aviso>
      </>
    );
  }

  // ?contra=ID elige la entrada; por defecto, la más reciente.
  const entradaId = entradas.some((entrada) => entrada.id === parametros.contra) ? parametros.contra! : entradas[0].id;
  const { resumen, elementos } = await compararInspecciones(salida.id, entradaId);

  const ver = FILTROS.find((filtro) => filtro.valor === parametros.ver) ?? FILTROS[0];
  const visibles = "resultado" in ver ? elementos.filter((elemento) => elemento.resultado === ver.resultado) : elementos;
  const cantidad = { todos: elementos.length, cambios: resumen.cambios, "no-comparables": resumen.noComparables };

  return (
    <>
      {encabezado}

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <label className="flex min-w-64 flex-col gap-1.5 text-cuerpo-sm font-medium">
          Comparar con
          <FiltroSeleccion
            parametro="contra"
            etiqueta="Inspección de entrada"
            porDefecto={entradaId}
            opciones={entradas.map((entrada) => ({
              valor: entrada.id,
              texto: `Entrada del ${formatearFecha(entrada.finalizadaEn ?? entrada.programadaPara)}`,
            }))}
          />
        </label>
        <ChipsFiltro
          etiqueta="Qué elementos ver"
          opciones={FILTROS.map((filtro) => ({
            href: urlCon(rutaComparar, { contra: parametros.contra }, { ver: filtro.valor === "todos" ? undefined : filtro.valor }),
            texto: filtro.texto,
            cantidad: cantidad[filtro.valor],
            activa: filtro.valor === ver.valor,
          }))}
        />
      </div>

      <Aviso>
        «Cambio de estado registrado» significa que el estado anotado en la salida es distinto al de la
        entrada. No determina quién es responsable.
      </Aviso>

      <Tarjeta relleno={false}>
        <div className="hidden grid-cols-[1.2fr_1fr_1fr_auto] gap-4 px-5 py-3 text-pequeno font-medium text-texto-secundario min-[760px]:grid">
          <span>Elemento</span>
          <span>Entrada</span>
          <span>Salida</span>
          <span className="w-44 text-right">Resultado</span>
        </div>
        {visibles.length === 0 && (
          <p className="border-t border-borde px-5 py-6 text-cuerpo-sm text-texto-secundario">
            No hay elementos en este filtro.
          </p>
        )}
        {visibles.map((elemento) => (
          <FilaComparada key={elemento.elementoId} elemento={elemento} />
        ))}
      </Tarjeta>
    </>
  );
}

function FilaComparada({ elemento }: { elemento: ElementoComparado }) {
  const { texto, clase } = TEXTO_RESULTADO[elemento.resultado];

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-borde px-4 py-3.5 min-[760px]:grid-cols-[1.2fr_1fr_1fr_auto] min-[760px]:px-5">
      <div className="col-span-2 flex flex-col gap-0.5 min-[760px]:col-span-1">
        <span className="text-cuerpo-sm font-medium">{elemento.nombre}</span>
        <span className="text-pequeno font-medium text-texto-tenue">{elemento.espacio}</span>
      </div>
      <Lado titulo="Entrada" lado={elemento.entrada} nombre={elemento.nombre} />
      <Lado titulo="Salida" lado={elemento.salida} nombre={elemento.nombre} />
      <span className={`col-span-2 text-cuerpo-sm font-medium min-[760px]:col-span-1 min-[760px]:w-44 min-[760px]:text-right ${clase}`}>
        {texto}
      </span>
    </div>
  );
}

function Lado({ titulo, lado, nombre }: { titulo: string; lado: LadoComparado | null; nombre: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-pequeno font-medium text-texto-tenue min-[760px]:hidden">{titulo}</span>
      {lado ? (
        <>
          <EstadoElementoTexto estado={lado.estado} />
          {lado.observacion && <span className="text-pequeno text-texto-secundario">{lado.observacion}</span>}
          {lado.evidenciaIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {lado.evidenciaIds.map((evidenciaId, indice) => (
                // eslint-disable-next-line @next/next/no-img-element -- enlace privado que vence; next/image no puede optimizarlo
                <img
                  key={evidenciaId}
                  src={`/api/v1/evidencias/${evidenciaId}/acceso?redirigir=1`}
                  alt={`Foto ${indice + 1} de ${nombre} en la ${titulo.toLowerCase()}`}
                  loading="lazy"
                  className="size-12 rounded-lg bg-sutil object-cover"
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <span className="text-cuerpo-sm text-texto-tenue">No estaba en el inventario</span>
      )}
    </div>
  );
}
