import type { Metadata } from "next";
import { Aviso } from "@/components/ui/Aviso";
import { FormularioLogin } from "@/features/auth/components/FormularioLogin";

export const metadata: Metadata = { title: "Iniciar sesión · InmoCheck" };

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ enlace?: string }>;
}) {
  const { enlace } = await searchParams;

  return (
    <>
      <div className="flex flex-col gap-1.5 pt-2">
        <h1 className="text-titulo-movil font-semibold">Iniciar sesión</h1>
        <p className="text-cuerpo-sm text-texto-secundario">
          Ingresa con la cuenta que te asignó tu inmobiliaria.
        </p>
      </div>
      {enlace === "invalido" && (
        <Aviso tipo="error">El enlace no es válido o ya venció. Solicita uno nuevo.</Aviso>
      )}
      <FormularioLogin />
      <p className="text-center text-cuerpo-sm text-texto-tenue">
        ¿No tienes cuenta? Solicítala al administrador de tu inmobiliaria.
      </p>
    </>
  );
}
