import { ETIQUETA_ROL, RUTA_INICIO_POR_ROL, type Rol } from "@/lib/constantes";
import { MENU_POR_ROL, OPCION_CONFIGURACION } from "@/lib/navegacion";
import { BotonCerrarSesion } from "./BotonCerrarSesion";
import { EnlacesMenu } from "./EnlacesMenu";
import { Marca } from "./Marca";

type Props = {
  nombre: string;
  rol: Rol;
};

// Menú fijo a la izquierda. Solo se ve en escritorio (desde 900px).
export function MenuLateral({ nombre, rol }: Props) {
  return (
    <aside
      aria-label="Menú principal"
      className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1 border-r border-borde bg-tarjeta px-4 py-6 min-[900px]:flex"
    >
      <div className="px-3 pb-7">
        <Marca href={RUTA_INICIO_POR_ROL[rol]} />
      </div>
      <nav className="flex flex-col gap-1">
        <EnlacesMenu opciones={MENU_POR_ROL[rol]} />
      </nav>
      <div className="flex-1" />
      <EnlacesMenu opciones={[OPCION_CONFIGURACION]} />
      <UsuarioActual nombre={nombre} rol={rol} />
    </aside>
  );
}

export function UsuarioActual({ nombre, rol }: Props) {
  return (
    <div className="mt-2 flex flex-col gap-0.5 border-t border-borde px-3 pt-4">
      <span className="text-cuerpo-sm font-medium">{nombre}</span>
      <span className="text-pequeno font-medium text-texto-tenue">{ETIQUETA_ROL[rol]}</span>
      <BotonCerrarSesion />
    </div>
  );
}
