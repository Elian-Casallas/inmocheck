import { TarjetaAcceso } from "@/components/layout/TarjetaAcceso";
import { DetectorEnlaceCorreo } from "@/features/auth/components/DetectorEnlaceCorreo";

// Diseño común de las pantallas sin sesión: tarjeta centrada, sin menú.
export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return (
    <TarjetaAcceso>
      <DetectorEnlaceCorreo />
      {children}
    </TarjetaAcceso>
  );
}
