import { Marca } from "@/components/layout/Marca";
import { MenuLateral } from "@/components/layout/MenuLateral";
import { NavegacionInferior } from "@/components/layout/NavegacionInferior";
import { RUTA_INICIO_POR_ROL } from "@/lib/constantes";
import { exigirActor } from "@/server/auth/sesion";

// Estructura común de /dashboard/...: menú lateral en escritorio, barra
// superior y navegación inferior en celular. Las páginas solo ponen su contenido.
export default async function LayoutDashboard({ children }: { children: React.ReactNode }) {
  // No repite la consulta: obtenerActor() está en cache() por petición.
  const actor = await exigirActor();

  return (
    <div className="flex min-h-screen flex-1">
      <MenuLateral nombre={actor.nombre} rol={actor.rol} />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center border-b border-borde bg-tarjeta px-4 py-2.5 min-[900px]:hidden">
          <Marca href={RUTA_INICIO_POR_ROL[actor.rol]} />
        </header>
        <main className="flex max-w-[1200px] flex-col gap-5 px-4 pt-5 pb-28 min-[900px]:gap-6 min-[900px]:px-10 min-[900px]:pt-8 min-[900px]:pb-16">
          {children}
        </main>
      </div>
      <NavegacionInferior nombre={actor.nombre} rol={actor.rol} />
    </div>
  );
}
