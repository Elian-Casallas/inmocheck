// Límites y textos fijos de la app. Si un número o texto se repite en varias
// partes, vive aquí para cambiarlo en un solo lugar.

export const ROLES = ["ADMIN", "INSPECTOR"] as const;
export type Rol = (typeof ROLES)[number];

export const ETIQUETA_ROL: Record<Rol, string> = {
  ADMIN: "Administrador",
  INSPECTOR: "Inspector",
};

export const RUTA_INICIO_POR_ROL: Record<Rol, string> = {
  ADMIN: "/dashboard",
  INSPECTOR: "/dashboard/mis-inspecciones",
};

export const CONTRASENA_MINIMA = 8;

export const PAGINA_TAMANO_DEFECTO = 20;
export const PAGINA_TAMANO_MAXIMO = 100;

export const FOTOS_MAXIMAS_POR_ELEMENTO = 8;
export const FOTO_TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024;
export const FOTO_TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"] as const;

// Las fotos se reducen en el celular antes de subirlas: ahorra datos y tiempo.
export const FOTO_LADO_MAXIMO_PX = 1600;
// Duración de los enlaces firmados a fotos y PDF privados.
export const URL_FIRMADA_SEGUNDOS = 60;

export const ZONA_HORARIA = "America/Bogota";
