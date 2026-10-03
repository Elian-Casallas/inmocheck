export default async function PaginaInmuebleDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <h1 className="text-titulo-pantalla font-semibold">Detalle del inmueble</h1>
      <p className="text-cuerpo-sm text-texto-secundario">ID: {id}</p>
    </>
  );
}
