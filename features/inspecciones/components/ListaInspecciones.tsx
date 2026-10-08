import Link from "next/link";
import { formatearFechaHora } from "@/lib/formato";
import { ETIQUETA_TIPO_INSPECCION, type InspeccionResumen } from "@/lib/inspecciones";
import { BadgeEstadoInspeccion } from "./BadgeEstadoInspeccion";

type Props = {
  inspecciones: InspeccionResumen[];
  vacio: string;
  // En la ficha de un inmueble no hace falta repetir su código.
  mostrarInmueble?: boolean;
};

// Lista compacta de inspecciones (ficha del inmueble, panel del inspector).
export function ListaInspecciones({ inspecciones, vacio, mostrarInmueble = false }: Props) {
  if (inspecciones.length === 0) {
    return <p className="px-5 pb-5 text-cuerpo-sm text-texto-secundario">{vacio}</p>;
  }

  return (
    <ul>
      {inspecciones.map((inspeccion) => (
        <li key={inspeccion.id} className="border-t border-borde">
          <Link
            href={`/dashboard/inspecciones/${inspeccion.id}`}
            className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#fafbfd]"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-cuerpo-sm font-medium">
                {mostrarInmueble && inspeccion.inmueble ? `${inspeccion.inmueble.codigo} · ` : ""}
                {ETIQUETA_TIPO_INSPECCION[inspeccion.tipo]}
              </span>
              <span className="text-pequeno font-medium text-texto-tenue">
                {formatearFechaHora(inspeccion.programadaPara)}
                {!mostrarInmueble && inspeccion.inspector ? ` · ${inspeccion.inspector.nombre}` : ""}
              </span>
            </div>
            <BadgeEstadoInspeccion estado={inspeccion.estado} programadaPara={inspeccion.programadaPara} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
