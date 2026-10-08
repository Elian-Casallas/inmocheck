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
  fotos: FotoActa[];
};

export type FotoActa = { espacio: string; elemento: string; datos: Buffer; formato: "jpg" | "png" };

type FotosPorEspacio = { nombre: string; elementos: { nombre: string; fotos: FotoActa[] }[] };

// Convierte la lista plana de fotos en espacio → elemento → fotos,
// conservando el orden en que llegan (el mismo de la tabla de resultados).
function agruparFotos(fotos: FotoActa[]): FotosPorEspacio[] {
  const espacios: FotosPorEspacio[] = [];
  for (const foto of fotos) {
    let espacio = espacios.find((candidato) => candidato.nombre === foto.espacio);
    if (!espacio) {
      espacio = { nombre: foto.espacio, elementos: [] };
      espacios.push(espacio);
    }
    let elemento = espacio.elementos.find((candidato) => candidato.nombre === foto.elemento);
    if (!elemento) {
      elemento = { nombre: foto.elemento, fotos: [] };
      espacio.elementos.push(elemento);
    }
    elemento.fotos.push(foto);
  }
  return espacios;
}

const FOTOS_POR_FILA = 3;

// Parte las fotos de un elemento en filas de tres.
function enFilas(fotos: FotoActa[]): FotoActa[][] {
  const filas: FotoActa[][] = [];
  for (let inicio = 0; inicio < fotos.length; inicio += FOTOS_POR_FILA) {
    filas.push(fotos.slice(inicio, inicio + FOTOS_POR_FILA));
  }
  return filas;
}

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
  espacio: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    marginTop: 10,
    marginBottom: 4,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR.borde,
  },
  elemento: { fontSize: 9, color: COLOR.tenue, marginTop: 4, marginBottom: 4 },
  fotos: { flexDirection: "row" },
  foto: { width: "31%", marginRight: "2%", marginBottom: 8 },
  imagen: { width: "100%", height: 120, objectFit: "cover", borderRadius: 3 },
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
        <View style={[estilos.fila, estilos.cabecera]}>
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
          // Las fotos van clasificadas: espacio → elemento.
          <View>
            <Text style={estilos.seccion}>Evidencias fotográficas</Text>
            {agruparFotos(datos.fotos).map((espacio) =>
              espacio.elementos.map((elemento, indiceElemento) =>
                enFilas(elemento.fotos).map((fila, indiceFila) => (
                  // wrap={false}: el bloque no se parte entre páginas. Los títulos
                  // viajan pegados a la primera fila de fotos, así nunca queda un
                  // título solo al final de una página.
                  <View key={`${espacio.nombre}-${elemento.nombre}-${indiceFila}`} wrap={false}>
                    {indiceFila === 0 && indiceElemento === 0 && (
                      <Text style={estilos.espacio}>{espacio.nombre}</Text>
                    )}
                    {indiceFila === 0 && <Text style={estilos.elemento}>{elemento.nombre}</Text>}
                    <View style={estilos.fotos}>
                      {fila.map((foto, indice) => (
                        <View key={indice} style={estilos.foto}>
                          {/* eslint-disable-next-line jsx-a11y/alt-text -- es el componente Image de react-pdf, no un <img> */}
                          <Image style={estilos.imagen} src={{ data: foto.datos, format: foto.formato }} />
                        </View>
                      ))}
                    </View>
                  </View>
                )),
              ),
            )}
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
