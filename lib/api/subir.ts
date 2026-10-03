import { ApiError, type ErrorDeCampo } from "./client";

type Problema = { code?: string; detail?: string; errors?: ErrorDeCampo[] };

// Sube un FormData mostrando el avance. Se usa XMLHttpRequest porque fetch
// no informa el progreso de subida.
// No se pone la cabecera Content-Type a mano: el navegador la arma solo con
// el "boundary" que separa los campos; si se escribe a mano, el servidor no
// puede leer el archivo.
export function subirArchivo<T>(
  ruta: string,
  formulario: FormData,
  alProgresar: (porcentaje: number) => void,
): Promise<T> {
  return new Promise((resolver, rechazar) => {
    const peticion = new XMLHttpRequest();
    peticion.open("POST", `/api/v1${ruta}`);
    peticion.responseType = "json";

    peticion.upload.onprogress = (evento) => {
      if (evento.lengthComputable) alProgresar(Math.round((evento.loaded / evento.total) * 100));
    };

    peticion.onload = () => {
      if (peticion.status >= 200 && peticion.status < 300) {
        resolver(peticion.response as T);
        return;
      }
      const problema = (peticion.response ?? {}) as Problema;
      rechazar(
        new ApiError(
          peticion.status,
          problema.code ?? "HTTP_ERROR",
          problema.detail ?? "No se pudo subir la foto.",
          problema.errors,
        ),
      );
    };

    peticion.onerror = () =>
      rechazar(new ApiError(0, "SIN_CONEXION", "No hay conexión. La foto no se subió."));

    peticion.send(formulario);
  });
}
