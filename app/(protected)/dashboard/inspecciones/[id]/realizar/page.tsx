import { exigirRol } from "@/server/auth/sesion";

export default async function PaginaInspeccionRealizar({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirRol("INSPECTOR");
  const { id } = await params;

  return (
    <>
      <h1 className="text-titulo-pantalla font-semibold">Realizar inspección</h1>
      <p className="text-cuerpo-sm text-texto-secundario">ID: {id}</p>
    </>
  );
}
