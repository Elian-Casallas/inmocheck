import { FOTO_LADO_MAXIMO_PX } from "@/lib/constantes";

const CALIDAD_JPEG = 0.82;

// Reduce la foto en el navegador antes de subirla. Una foto de celular pesa
// varios MB; para una evidencia basta con 1600 px de lado. Si algo falla
// (formato que el navegador no sabe abrir) se devuelve el archivo original
// y el servidor decide si lo acepta.
export async function reducirFoto(archivo: File): Promise<Blob> {
  try {
    const imagen = await createImageBitmap(archivo);
    const escala = Math.min(1, FOTO_LADO_MAXIMO_PX / Math.max(imagen.width, imagen.height));

    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(imagen.width * escala);
    lienzo.height = Math.round(imagen.height * escala);
    lienzo.getContext("2d")?.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    imagen.close();

    const reducida = await new Promise<Blob | null>((resolver) =>
      lienzo.toBlob(resolver, "image/jpeg", CALIDAD_JPEG),
    );
    return reducida && reducida.size < archivo.size ? reducida : archivo;
  } catch {
    return archivo;
  }
}
