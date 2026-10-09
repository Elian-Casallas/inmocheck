import type { Metadata } from "next";
import Link from "next/link";
import { FormularioRecuperar } from "@/features/auth/components/FormularioRecuperar";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function PaginaRecuperarContrasena() {
  return (
    <>
      <FormularioRecuperar />
      <Link href="/login" className="text-center text-cuerpo-sm font-medium text-primario hover:underline">
        Volver a iniciar sesión
      </Link>
    </>
  );
}
