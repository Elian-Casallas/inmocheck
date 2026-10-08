import type { NombreIcono } from "@/components/ui/Icono";
import type { Rol } from "@/lib/constantes";

export type OpcionMenu = {
  href: string;
  etiqueta: string;
  // Texto para pantallas angostas, donde la etiqueta completa no cabe en una línea.
  etiquetaCorta?: string;
  icono: NombreIcono;
  // Las 3 principales también salen en la navegación inferior del celular.
  enMovil?: boolean;
};

// El menú solo decide qué se MUESTRA. Que un inspector no vea "Propietarios"
// no es seguridad: la página y la API lo validan por su cuenta.
export const MENU_POR_ROL: Record<Rol, OpcionMenu[]> = {
  ADMIN: [
    { href: "/dashboard", etiqueta: "Resumen", icono: "resumen", enMovil: true },
    { href: "/dashboard/inmuebles", etiqueta: "Inmuebles", icono: "inmueble", enMovil: true },
    { href: "/dashboard/inspecciones", etiqueta: "Inspecciones", icono: "inspeccion", enMovil: true },
    { href: "/dashboard/propietarios", etiqueta: "Propietarios", icono: "personas" },
    { href: "/dashboard/inspectores", etiqueta: "Inspectores", icono: "inspector" },
    { href: "/dashboard/informes", etiqueta: "Informes", icono: "informe" },
  ],
  INSPECTOR: [
    {
      href: "/dashboard/mis-inspecciones",
      etiqueta: "Mis inspecciones",
      etiquetaCorta: "Inspecciones",
      icono: "inspeccion",
      enMovil: true,
    },
    { href: "/dashboard/inmuebles", etiqueta: "Inmuebles", icono: "inmueble", enMovil: true },
    { href: "/dashboard/informes", etiqueta: "Informes", icono: "informe", enMovil: true },
  ],
};

export const OPCION_CONFIGURACION: OpcionMenu = {
  href: "/dashboard/configuracion",
  etiqueta: "Configuración",
  icono: "configuracion",
};

// "/dashboard" solo está activo en su ruta exacta; las demás también en sus
// subrutas (/dashboard/inmuebles/123 marca "Inmuebles").
export function estaActiva(rutaActual: string, href: string): boolean {
  if (href === "/dashboard") return rutaActual === href;
  return rutaActual === href || rutaActual.startsWith(`${href}/`);
}
