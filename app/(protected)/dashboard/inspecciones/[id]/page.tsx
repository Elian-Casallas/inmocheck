import Link from "next/link";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { Badge } from "@/components/ui/Badge";
import { clasesBoton } from "@/components/ui/Boton";
import { ListaDatos } from "@/components/ui/ListaDatos";
import { PanelLateral } from "@/components/ui/PanelLateral";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { cargarInspeccion } from "@/features/inspecciones/cargar";
import {
  BotonIniciarInspeccion,
  FormularioCancelar,
  FormularioReasignar,
} from "@/features/inspecciones/components/AccionesInspeccion";
import { BarraProgreso } from "@/features/inspecciones/components/BarraProgreso";
import { formatearFechaHora, plural } from "@/lib/formato";
import {
  ESTADOS_ABIERTOS,
  ETIQUETA_ESTADO_INSPECCION,
  ETIQUETA_TIPO_INSPECCION,
  TONO_ESTADO_INSPECCION,
} from "@/lib/inspecciones";
import { aplanarParametros, type ParametrosBusqueda } from "@/lib/url";
import type { Detalle, Inspeccion } from "@/schemas/inspecciones";
import { exigirActor } from "@/server/auth/sesion";
import type { Actividad } from "@/server/repositories/inspecciones.repository";
import { listarOpcionesInspector } from "@/server/services/inspectores.service";
import { listarActividad, listarDetalles } from "@/server/services/inspecciones.service";

const TEXTO_ACTIVIDAD: Record<string, string> = {
  PROGRAMADA: "programó la inspección",
  REPROGRAMADA: "cambió la fecha o la nota",
  INICIADA: "inició la inspección",
  FINALIZADA: "finalizó la inspección",
  CANCELADA: "canceló la inspección",
  REASIGNADA: "reasignó la inspección",
  INFORME_GENERADO: "generó el informe",
};

export default async function PaginaInspeccionDetalle({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<ParametrosBusqueda>;
}) {
  const { id } = await params;
  const { accion } = aplanarParametros(await searchParams);
  const [actor, inspeccion] = await Promise.all([exigirActor(), cargarInspeccion(id)]);

  const esAdmin = actor.rol === "ADMIN";
  const abierta = ESTADOS_ABIERTOS.includes(inspeccion.estado);
  const ruta = `/dashboard/inspecciones/${inspeccion.id}`;

  const [{ data: detalles }, actividad, inspectores] = await Promise.all([
    listarDetalles(inspeccion.id),
    esAdmin ? listarActividad(inspeccion.id) : Promise.resolve([]),
    esAdmin && abierta ? listarOpcionesInspector() : Promise.resolve([]),
  ]);

  return (
    <>
      <EncabezadoPagina
        titulo={`${inspeccion.inmueble.codigo} · Inspección de ${ETIQUETA_TIPO_INSPECCION[inspeccion.tipo].toLowerCase()}`}
        descripcion={[inspeccion.inmueble.direccion, inspeccion.inmueble.barrio, inspeccion.inmueble.ciudad]
          .filter(Boolean)
          .join(", ")}
        volver={
          esAdmin
            ? { href: "/dashboard/inspecciones", etiqueta: "Inspecciones" }
            : { href: "/dashboard/mis-inspecciones", etiqueta: "Mis inspecciones" }
        }
        junto={
          <Badge tono={TONO_ESTADO_INSPECCION[inspeccion.estado]}>
            {ETIQUETA_ESTADO_INSPECCION[inspeccion.estado]}
          </Badge>
        }
        // La misma URL muestra acciones distintas según el rol. Es solo
        // presentación: cada endpoint valida el rol por su cuenta.
        acciones={esAdmin ? <AccionesAdmin inspeccion={inspeccion} ruta={ruta} /> : <AccionesInspector inspeccion={inspeccion} ruta={ruta} />}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          <ResumenInventario detalles={detalles} inspeccion={inspeccion} esAdmin={esAdmin} />
          {esAdmin && <TarjetaActividad actividad={actividad} />}
        </div>
        <DatosVisita inspeccion={inspeccion} />
      </div>

      {esAdmin && abierta && accion === "reasignar" && (
        <PanelLateral titulo="Reasignar inspección" hrefCerrar={ruta}>
          <FormularioReasignar
            inspeccionId={inspeccion.id}
            version={inspeccion.version}
            inspectorActualId={inspeccion.inspector?.id}
            inspectores={inspectores}
            hrefCerrar={ruta}
          />
        </PanelLateral>
      )}
      {esAdmin && abierta && accion === "cancelar" && (
        <PanelLateral titulo="Cancelar inspección" hrefCerrar={ruta}>
          <FormularioCancelar inspeccionId={inspeccion.id} version={inspeccion.version} hrefCerrar={ruta} />
        </PanelLateral>
      )}
    </>
  );
}

type PropsAcciones = { inspeccion: Inspeccion; ruta: string };

function AccionesAdmin({ inspeccion, ruta }: PropsAcciones) {
  if (inspeccion.estado === "FINALIZADA") return <EnlaceInforme ruta={ruta} />;
  if (inspeccion.estado === "CANCELADA") return null;

  return (
    <>
      <Link href={`${ruta}?accion=cancelar`} scroll={false} className={clasesBoton({ variante: "peligro" })}>
        Cancelar inspección
      </Link>
      <Link href={`${ruta}?accion=reasignar`} scroll={false} className={clasesBoton()}>
        Reasignar
      </Link>
    </>
  );
}

function AccionesInspector({ inspeccion, ruta }: PropsAcciones) {
  if (inspeccion.estado === "PENDIENTE") {
    return <BotonIniciarInspeccion inspeccionId={inspeccion.id} version={inspeccion.version} />;
  }
  if (inspeccion.estado === "EN_PROCESO") {
    return (
      <Link href={`${ruta}/realizar`} className={clasesBoton()}>
        Continuar inspección
      </Link>
    );
  }
  if (inspeccion.estado === "FINALIZADA") return <EnlaceInforme ruta={ruta} />;
  return null;
}

function EnlaceInforme({ ruta }: { ruta: string }) {
  return (
    <Link href={`${ruta}/informe`} className={clasesBoton()}>
      Ver informe
    </Link>
  );
}

function ResumenInventario({
  detalles,
  inspeccion,
  esAdmin,
}: {
  detalles: Detalle[];
  inspeccion: Inspeccion;
  esAdmin: boolean;
}) {
  // Agrupa los detalles por el nombre de espacio guardado en el snapshot.
  const espacios = new Map<string, { total: number; obligatorios: number }>();
  for (const detalle of detalles) {
    const espacio = espacios.get(detalle.espacioNombre) ?? { total: 0, obligatorios: 0 };
    espacio.total += 1;
    if (detalle.obligatorio) espacio.obligatorios += 1;
    espacios.set(detalle.espacioNombre, espacio);
  }
  const { evaluados, total } = inspeccion.progreso;

  return (
    <Tarjeta relleno={false}>
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
        <h2 className="text-titulo-seccion font-semibold">
          {esAdmin ? "Inventario a revisar" : "Qué vas a revisar"}
        </h2>
        <span className="text-cuerpo-sm text-texto-secundario">{plural(total, "elemento")}</span>
      </div>
      {inspeccion.estado !== "PENDIENTE" && (
        <div className="flex items-center gap-3 px-5 pb-4">
          <BarraProgreso evaluados={evaluados} total={total} />
          <span className="text-pequeno font-medium text-texto-secundario">
            {evaluados} de {total} evaluados
          </span>
        </div>
      )}
      <ul>
        {[...espacios].map(([nombre, espacio]) => (
          <li key={nombre} className="flex items-center gap-3 border-t border-borde px-5 py-3.5">
            <span className="flex-1 text-cuerpo-sm font-medium">{nombre}</span>
            <span className="text-cuerpo-sm text-texto-secundario">
              {plural(espacio.total, "elemento")} · {plural(espacio.obligatorios, "obligatorio")}
            </span>
          </li>
        ))}
      </ul>
    </Tarjeta>
  );
}

function TarjetaActividad({ actividad }: { actividad: Actividad[] }) {
  return (
    <Tarjeta relleno={false}>
      <h2 className="px-5 pt-5 pb-3 text-titulo-seccion font-semibold">Actividad</h2>
      <ul>
        {actividad.map((evento) => (
          <li key={evento.id} className="flex flex-col gap-0.5 border-t border-borde px-5 py-3.5">
            <span className="text-cuerpo-sm">
              {evento.actor?.nombre ?? "El sistema"} {TEXTO_ACTIVIDAD[evento.accion] ?? evento.accion.toLowerCase()}
            </span>
            <span className="text-pequeno font-medium text-texto-tenue">{formatearFechaHora(evento.fecha)}</span>
          </li>
        ))}
      </ul>
    </Tarjeta>
  );
}

function DatosVisita({ inspeccion }: { inspeccion: Inspeccion }) {
  const datos = [
    { etiqueta: "Tipo", valor: ETIQUETA_TIPO_INSPECCION[inspeccion.tipo] },
    { etiqueta: "Fecha programada", valor: formatearFechaHora(inspeccion.programadaPara) },
    { etiqueta: "Inspector asignado", valor: inspeccion.inspector?.nombre ?? "—" },
  ];
  if (inspeccion.iniciadaEn) datos.push({ etiqueta: "Iniciada", valor: formatearFechaHora(inspeccion.iniciadaEn) });
  if (inspeccion.finalizadaEn) datos.push({ etiqueta: "Finalizada", valor: formatearFechaHora(inspeccion.finalizadaEn) });
  if (inspeccion.canceladaEn) datos.push({ etiqueta: "Cancelada", valor: formatearFechaHora(inspeccion.canceladaEn) });
  if (inspeccion.motivoCancelacion) datos.push({ etiqueta: "Motivo de cancelación", valor: inspeccion.motivoCancelacion });

  return (
    <Tarjeta className="flex flex-col gap-4">
      <h2 className="text-titulo-seccion font-semibold">Datos de la visita</h2>
      <ListaDatos datos={datos} />
      {inspeccion.nota && (
        <div className="flex flex-col gap-1 rounded-lg bg-sutil px-3 py-2.5">
          <span className="text-pequeno font-medium text-texto-secundario">Nota del administrador</span>
          <span className="text-cuerpo-sm">{inspeccion.nota}</span>
        </div>
      )}
      <Link
        href={`/dashboard/inmuebles/${inspeccion.inmueble.id}`}
        className="text-cuerpo-sm font-medium text-primario hover:underline"
      >
        Ver el inmueble
      </Link>
    </Tarjeta>
  );
}
