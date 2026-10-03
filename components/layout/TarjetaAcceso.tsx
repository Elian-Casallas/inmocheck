import type { ReactNode } from "react";
import { Marca } from "./Marca";

type Props = {
  children: ReactNode;
  centrado?: boolean;
};

// Tarjeta centrada de las pantallas sin menú: login, contraseñas, 403 y 404.
// En celular pierde el borde y ocupa toda la pantalla, como en el prototipo.
export function TarjetaAcceso({ children, centrado = false }: Props) {
  return (
    <main className="grid min-h-screen flex-1 place-items-start bg-tarjeta px-6 pt-14 pb-6 sm:place-items-center sm:bg-fondo sm:p-6">
      <div
        className={`flex w-full max-w-[440px] flex-col gap-5 sm:rounded-2xl sm:border sm:border-borde sm:bg-tarjeta sm:p-10 sm:shadow-tarjeta ${
          centrado ? "items-center text-center" : ""
        }`}
      >
        <Marca />
        {children}
      </div>
    </main>
  );
}
