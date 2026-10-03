// En Next.js los searchParams pueden traer un valor repetido (?a=1&a=2) como
// arreglo. Esta función deja siempre un solo texto por parámetro.
export type ParametrosBusqueda = Record<string, string | string[] | undefined>;

export function aplanarParametros(parametros: ParametrosBusqueda): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(parametros).map(([clave, valor]) => [clave, Array.isArray(valor) ? valor[0] : valor]),
  );
}

// Arma una URL conservando los parámetros actuales y cambiando algunos.
// Un valor undefined quita el parámetro.
export function urlCon(
  ruta: string,
  actuales: Record<string, string | undefined>,
  cambios: Record<string, string | undefined>,
): string {
  const query = new URLSearchParams();
  for (const [clave, valor] of Object.entries({ ...actuales, ...cambios })) {
    if (valor) query.set(clave, valor);
  }
  const texto = query.toString();
  return texto ? `${ruta}?${texto}` : ruta;
}
