import type { Metadata } from "next";
import { TarjetaAcceso } from "@/components/layout/TarjetaAcceso";
import { FormularioNuevaContrasena } from "@/features/auth/components/FormularioNuevaContrasena";

export const metadata: Metadata = { title: "Nueva contraseña" };

// Se llega aquí desde el enlace del correo, ya con sesión (ver /auth/confirmar).
export default function PaginaActualizarContrasena() {
  return (
    <TarjetaAcceso>
      <FormularioNuevaContrasena />
    </TarjetaAcceso>
  );
}
