import "server-only";

// Reglas del proxy que reenvía /api/v1 al backend de Spring Boot
// (app/api/v1/[...ruta]/route.ts). Son funciones puras para poder probarlas.

// Módulos que YA responde Spring. Para migrar uno:
//   1. agregarlo aquí,
//   2. borrar sus route.ts del BFF (una ruta específica le gana al catch-all,
//      así que mientras exista, Next.js la sigue atendiendo).
// Lo que no esté en la lista responde 404: el proxy nunca reenvía a ciegas.
export const MODULOS_EN_SPRING: readonly string[] = ["auth/me", "propietarios", "inmuebles", "espacios", "elementos", "inspectores", "inspecciones", "evidencias"];

// Cabeceras de la petición que sí viajan a Spring. Las cookies NO: Spring
// recibe el token en Authorization y nunca ve la sesión del navegador.
const CABECERAS_DE_PETICION = ["content-type", "accept", "accept-language"] as const;

// Cabeceras de la respuesta de Spring que se devuelven al navegador.
const CABECERAS_DE_RESPUESTA = ["content-type", "location", "content-disposition", "cache-control"] as const;

const METODOS_SIN_CUERPO = new Set(["GET", "HEAD"]);

const SEGMENTOS_DE_NAVEGACION = new Set([".", ".."]);

export function estaEnSpring(segmentos: readonly string[]): boolean {
  // "/auth/me/../../actuator" saldría de /api/v1 al llegar a Spring.
  if (segmentos.some((segmento) => SEGMENTOS_DE_NAVEGACION.has(segmento))) return false;
  return MODULOS_EN_SPRING.some((modulo) => {
    const partes = modulo.split("/");
    return partes.every((parte, indice) => segmentos[indice] === parte);
  });
}

// Arma la URL de Spring con la misma ruta y los mismos filtros (?page=…).
// Cada segmento se codifica para que nadie cuele "../" u otra ruta.
export function urlEnSpring(base: string, segmentos: readonly string[], busqueda: string): string {
  const ruta = segmentos.map(encodeURIComponent).join("/");
  return `${base.replace(/\/+$/, "")}/api/v1/${ruta}${busqueda}`;
}

export function cabecerasParaSpring(originales: Headers, token: string): Headers {
  const cabeceras = new Headers();
  for (const nombre of CABECERAS_DE_PETICION) {
    const valor = originales.get(nombre);
    if (valor) cabeceras.set(nombre, valor);
  }
  cabeceras.set("authorization", `Bearer ${token}`);
  return cabeceras;
}

export function cabecerasDeRespuesta(deSpring: Headers): Headers {
  const cabeceras = new Headers();
  for (const nombre of CABECERAS_DE_RESPUESTA) {
    const valor = deSpring.get(nombre);
    if (valor) cabeceras.set(nombre, valor);
  }
  return cabeceras;
}

export function llevaCuerpo(metodo: string): boolean {
  return !METODOS_SIN_CUERPO.has(metodo.toUpperCase());
}

// Protección CSRF. El navegador manda las cookies de sesión solo, así que otro
// sitio podría intentar una petición a nombre del usuario. Spring no puede
// detectarlo (recibe un token, no cookies): lo detecta el proxy, igual que
// leerJson() del BFF. Si la petición declara un origen, debe ser este sitio.
export function origenPermitido(origen: string | null, urlDeLaPeticion: string): boolean {
  if (!origen) return true;
  try {
    return new URL(origen).host === new URL(urlDeLaPeticion).host;
  } catch {
    return false;
  }
}
