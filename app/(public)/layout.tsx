import { TarjetaAcceso } from "@/components/layout/TarjetaAcceso";

// Diseño común de las pantallas sin sesión: tarjeta centrada, sin menú.
export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return <TarjetaAcceso>{children}</TarjetaAcceso>;
}
