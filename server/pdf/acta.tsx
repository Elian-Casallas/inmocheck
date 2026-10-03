import "server-only";
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { formatearFechaHora } from "@/lib/formato";
import { ETIQUETA_ESTADO_ELEMENTO, ETIQUETA_TIPO_INSPECCION, type TipoInspeccion } from "@/lib/inspecciones";
import type { Detalle } from "@/schemas/inspecciones";

// Todo lo que necesita el acta. El PDF se arma SOLO con esto: los nombres de
// espacios y elementos vienen del snapshot de la inspección, no del
// inventario actual, así el acta refleja lo que se revisó ese día.
export type DatosActa = {
  codigoInforme: string;
  version: number;
  organizacion: string;
  tipo: TipoInspeccion;
  inmueble: string;
  propietario: string | null;
  inspector: string;
  programadaPara: string;
  finalizadaEn: string;
  generadoEn: string;
  detalles: Detalle[];
  resumenComparacion: string | null;
  fotos: { titulo: string; datos: Buffer; formato: "jpg" | "png" }[];
};

const COLOR = { texto: "#0f172a", tenue: "#64748b", borde: "#e2e8f0", primario: "#1d4ed8", sutil: "#f1f5f9" };

const estilos = StyleSheet.create({
  pagina: { padding: 40, fontSize: 9.5, fontFamily: "Helvetica", color: COLOR.texto },
  encabezado: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  marca: { fontSize: 13, fontFamily: "Helvetica-Bold", color: COLOR.primario },
  tenue: { color: COLOR.tenue },
  titulo: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  datos: { flexDirection: "row", flexWrap: "wrap", marginTop: 14, marginBottom: 14 },
  dato: { width: "50%", marginBottom: 8, paddingRight: 10 },
  etiqueta: { fontSize: 8.5, color: COLOR.tenue, marginBottom: 2 },
  seccion: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 10, marginBottom: 6 },
  fila: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: COLOR.borde, paddingVertical: 4 },
  cabecera: { backgroundColor: COLOR.sutil, color: COLOR.tenue, fontSize: 8.5 },
  cEspacio: { width: "20%", paddingHorizontal: 4 },
  cElemento: { width: "22%", paddingHorizontal: 4 },
  cEstado: { width: "14%", paddingHorizontal: 4 },
  cObservacion: { width: "44%", paddingHorizontal: 4 },
  fotos: { flexDirection: "row", flexWrap: "wrap" },
  foto: { width: "31%", marginRight: "2%", marginBottom: 8 },
  imagen: { width: "100%", height: 110, objectFit: "cover", borderRadius: 3 },
  pie: { position: "absolute", left: 40, right: 40, bottom: 24, fontSize: 8, color: COLOR.tenue, borderTopWidth: 0.5, borderTopColor: COLOR.borde, paddingTop: 6 },
});

function Acta({ datos }: { datos: DatosActa }) {
  const tipo = ETIQUETA_TIPO_INSPECCION[datos.tipo].toLowerCase();

  return (
    <Document title={`Acta de inspección de ${tipo} · ${datos.inmueble}`} author={datos.organizacion}>
      <Page size="A4" style={estilos.pagina}>
        <View style={estilos.encabezado}>
          <Text style={estilos.marca}>InmoCheck</Text>
          <Text style={estilos.tenue}>
            {datos.codigoInforme} · Versión {datos.version}
          </Text>
        </View>

        <Text style={estilos.titulo}>Acta de inspección de {tipo}</Text>
        <Text style={estilos.tenue}>{datos.organizacion}</Text>

        <View style={estilos.datos}>
          <Dato etiqueta="Inmueble" valor={datos.inmueble} />
          <Dato etiqueta="Inspector" valor={datos.inspector} />
          {datos.propietario && <Dato etiqueta="Propietario" valor={datos.propietario} />}
          <Dato etiqueta="Fecha programada" valor={formatearFechaHora(datos.programadaPara)} />
          <Dato etiqueta="Inspección finalizada" valor={formatearFechaHora(datos.finalizadaEn)} />
        </View>

        <Text style={estilos.seccion}>Resultado por elemento</Text>
        <View style={[estilos.fila, estilos.cabecera]} fixed>
          <Text style={estilos.cEspacio}>Espacio</Text>
          <Text style={estilos.cElemento}>Elemento</Text>
          <Text style={estilos.cEstado}>Estado</Text>
          <Text style={estilos.cObservacion}>Observación</Text>
        </View>
        {datos.detalles.map((detalle) => (
          <View key={detalle.id} style={estilos.fila} wrap={false}>
            <Text style={estilos.cEspacio}>{detalle.espacioNombre}</Text>
            <Text style={estilos.cElemento}>{detalle.elementoNombre}</Text>
            <Text style={estilos.cEstado}>
              {detalle.estado ? ETIQUETA_ESTADO_ELEMENTO[detalle.estado] : "Sin evaluar"}
            </Text>
            <Text style={estilos.cObservacion}>{detalle.observacion ?? ""}</Text>
          </View>
        ))}

        {datos.resumenComparacion && (
          <>
            <Text style={estilos.seccion}>Diferencias con la inspección de entrada</Text>
            <Text>{datos.resumenComparacion}</Text>
          </>
        )}

        {datos.fotos.length > 0 && (
          <View break={datos.detalles.length > 22}>
            <Text style={estilos.seccion}>Evidencias seleccionadas</Text>
            <View style={estilos.fotos}>
              {datos.fotos.map((foto, indice) => (
                <View key={indice} style={estilos.foto} wrap={false}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text -- es el componente Image de react-pdf, no un <img> */}
                  <Image style={estilos.imagen} src={{ data: foto.datos, format: foto.formato }} />
                  <Text style={[estilos.tenue, { fontSize: 8, marginTop: 2 }]}>{foto.titulo}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={estilos.pie} fixed>
          Generado el {formatearFechaHora(datos.generadoEn)} a partir de la inspección finalizada. Las
          diferencias registradas describen cambios de estado y no determinan responsabilidades.
        </Text>
      </Page>
    </Document>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={estilos.dato}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <Text>{valor}</Text>
    </View>
  );
}

export function renderizarActa(datos: DatosActa): Promise<Buffer> {
  return renderToBuffer(<Acta datos={datos} />);
}
