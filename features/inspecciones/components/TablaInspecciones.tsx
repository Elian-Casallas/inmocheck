import type { ReactNode } from "react";
import { CeldaFlecha, CeldaPrincipal, Tabla } from "@/components/ui/Tabla";
import { formatearFechaHora } from "@/lib/formato";
import { ETIQUETA_TIPO_INSPECCION, type InspeccionResumen } from "@/lib/inspecciones";
import { BadgeEstadoInspeccion } from "./BadgeEstadoInspeccion";

type Props = {
  inspecciones: InspeccionResumen[];
  vacio: string;
  // El inspector no necesita la columna con su propio nombre.
  mostrarInspector?: boolean;
  pie?: ReactNode;
};

export function TablaInspecciones({ inspecciones, vacio, mostrarInspector = false, pie }: Props) {
  const encabezados = mostrarInspector
    ? ["Inmueble", "Tipo", "Fecha", "Inspector", "Estado"]
    : ["Inmueble", "Tipo", "Fecha", "Estado"];

  return (
    <Tabla encabezados={encabezados} vacio={inspecciones.length === 0 && vacio} pie={pie}>
      {inspecciones.map((inspeccion) => (
        <tr key={inspeccion.id}>
          <CeldaPrincipal
            href={`/dashboard/inspecciones/${inspeccion.id}`}
            titulo={inspeccion.inmueble?.codigo ?? "Inmueble"}
            subtitulo={inspeccion.inmueble?.direccion}
          />
          <td>{ETIQUETA_TIPO_INSPECCION[inspeccion.tipo]}</td>
          <td>{formatearFechaHora(inspeccion.programadaPara)}</td>
          {mostrarInspector && <td className="solo-escritorio">{inspeccion.inspector?.nombre ?? "—"}</td>}
          <td className="a-la-derecha">
            <BadgeEstadoInspeccion estado={inspeccion.estado} programadaPara={inspeccion.programadaPara} />
          </td>
          <CeldaFlecha />
        </tr>
      ))}
    </Tabla>
  );
}
