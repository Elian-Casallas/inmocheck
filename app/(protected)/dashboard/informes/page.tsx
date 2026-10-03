import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { CeldaPrincipal, Tabla } from "@/components/ui/Tabla";
import { EnlaceDescarga } from "@/features/informes/components/AccionesInforme";
import { formatearFechaHora } from "@/lib/formato";
import { ETIQUETA_TIPO_INSPECCION } from "@/lib/inspecciones";
import { exigirActor } from "@/server/auth/sesion";
import { listarInformes } from "@/server/services/informes.service";

export default async function PaginaInformes() {
  const actor = await exigirActor();
  // La misma consulta sirve para los dos roles: RLS decide qué ve cada uno.
  const informes = await listarInformes();

  return (
    <>
      <EncabezadoPagina
        titulo="Informes"
        descripcion={
          actor.rol === "ADMIN"
            ? "Actas en PDF generadas a partir de inspecciones finalizadas."
            : "Actas de las inspecciones que realizaste."
        }
      />
      <Tabla
        encabezados={["Inmueble", "Tipo", "Versión", "Generado", "Generado por"]}
        vacio={informes.length === 0 && "Aún no hay informes. Se generan desde una inspección finalizada."}
      >
        {informes.map((informe) => (
          <tr key={informe.id}>
            <CeldaPrincipal
              href={`/dashboard/inspecciones/${informe.inspeccionId}/informe`}
              titulo={informe.inspeccion?.inmueble?.codigo ?? "Inmueble"}
              subtitulo={informe.inspeccion?.inmueble?.direccion}
            />
            <td>{informe.inspeccion ? ETIQUETA_TIPO_INSPECCION[informe.inspeccion.tipo] : "—"}</td>
            <td className="solo-escritorio">Versión {informe.version}</td>
            <td>{formatearFechaHora(informe.generadoEn)}</td>
            <td className="solo-escritorio">{informe.generadoPor?.nombre ?? "—"}</td>
            {/* relative z-10: queda por encima del enlace que cubre toda la fila. */}
            <td className="a-la-derecha relative z-10 w-10">
              <EnlaceDescarga informeId={informe.id} etiqueta={`Descargar PDF de ${informe.inspeccion?.inmueble?.codigo ?? "la inspección"}`} />
            </td>
          </tr>
        ))}
      </Tabla>
    </>
  );
}
