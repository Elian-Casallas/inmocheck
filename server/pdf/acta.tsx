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

// Medidas de la cuadrícula de fotos, en puntos. Una hoja A4 con márgenes de
// 40 deja 515 de ancho útil: caben 4 fotos de 118 con 3 separaciones de 14.
const ANCHO_UTIL = 515;
const ANCHO_FOTO = 118;
const ALTO_FOTO = 96;
const SEPARACION = 14;
const FOTOS_POR_FILA = 4;

type BloqueDeFotos = { titulo: string; fotos: FotoActa[] };

// Acomoda los elementos de un espacio uno al lado del otro y pasa a la
// siguiente fila cuando ya no caben, como un "flex-wrap". Se calcula a mano
// para poder mantener cada fila entera en la misma página.
function empaquetarEnFilas(elementos: FotosPorEspacio["elementos"]): BloqueDeFotos[][] {
  // Un elemento con más de 4 fotos se parte en varios bloques.
  const bloques: BloqueDeFotos[] = elementos.flatMap((elemento) => {
    const partes: BloqueDeFotos[] = [];
    for (let inicio = 0; inicio < elemento.fotos.length; inicio += FOTOS_POR_FILA) {
      partes.push({
        titulo: inicio === 0 ? elemento.nombre : `${elemento.nombre} (continuación)`,
        fotos: elemento.fotos.slice(inicio, inicio + FOTOS_POR_FILA),
      });
    }
    return partes;
  });

  const filas: BloqueDeFotos[][] = [];
  let fila: BloqueDeFotos[] = [];
  let anchoOcupado = 0;

  for (const bloque of bloques) {
    const ancho = anchoDeBloque(bloque);
    const anchoConBloque = anchoOcupado + (fila.length > 0 ? SEPARACION : 0) + ancho;
    if (fila.length > 0 && anchoConBloque > ANCHO_UTIL) {
      filas.push(fila);
      fila = [];
      anchoOcupado = 0;
    }
    anchoOcupado += (fila.length > 0 ? SEPARACION : 0) + ancho;
    fila.push(bloque);
  }
  if (fila.length > 0) filas.push(fila);
  return filas;
}

function anchoDeBloque(bloque: BloqueDeFotos): number {
  return bloque.fotos.length * ANCHO_FOTO + (bloque.fotos.length - 1) * SEPARACION;
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
  elemento: { fontSize: 9, color: COLOR.tenue, marginBottom: 3 },
  filaDeFotos: { flexDirection: "row", marginTop: 4, marginBottom: 8 },
  fotos: { flexDirection: "row" },
  imagen: { width: ANCHO_FOTO, height: ALTO_FOTO, objectFit: "cover", borderRadius: 3 },
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
              empaquetarEnFilas(espacio.elementos).map((fila, indiceFila) => (
                // wrap={false}: la fila no se parte entre páginas. El título del
                // espacio viaja pegado a su primera fila, así nunca queda solo
                // al final de una página.
                <View key={`${espacio.nombre}-${indiceFila}`} wrap={false}>
                  {indiceFila === 0 && <Text style={estilos.espacio}>{espacio.nombre}</Text>}
                  <View style={estilos.filaDeFotos}>
                    {fila.map((bloque, indiceBloque) => (
                      <View
                        key={bloque.titulo}
                        style={{ width: anchoDeBloque(bloque), marginLeft: indiceBloque === 0 ? 0 : SEPARACION }}
                      >
                        <Text style={estilos.elemento}>{bloque.titulo}</Text>
                        <View style={estilos.fotos}>
                          {bloque.fotos.map((foto, indice) => (
                            // eslint-disable-next-line jsx-a11y/alt-text -- es el componente Image de react-pdf, no un <img>
                            <Image
                              key={indice}
                              style={[estilos.imagen, { marginLeft: indice === 0 ? 0 : SEPARACION }]}
                              src={{ data: foto.datos, format: foto.formato }}
                            />
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )),
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
