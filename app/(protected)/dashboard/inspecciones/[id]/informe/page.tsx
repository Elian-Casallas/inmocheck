export default async function PaginaInspeccionInforme({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <h1 className="text-titulo-pantalla font-semibold">Informe de la inspección</h1>
      <p className="text-cuerpo-sm text-texto-secundario">ID: {id}</p>
    </>
  );
}
