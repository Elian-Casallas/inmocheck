import { exigirRol } from "@/server/auth/sesion";

export default async function PaginaInmuebleEditar({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirRol("ADMIN");
  const { id } = await params;

  return (
    <>
      <h1 className="text-titulo-pantalla font-semibold">Editar inmueble</h1>
      <p className="text-cuerpo-sm text-texto-secundario">ID: {id}</p>
    </>
  );
}
