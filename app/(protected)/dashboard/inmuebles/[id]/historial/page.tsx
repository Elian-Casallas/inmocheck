export default async function PaginaInmuebleHistorial({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <h1 className="text-titulo-pantalla font-semibold">Historial del inmueble</h1>
      <p className="text-cuerpo-sm text-texto-secundario">ID: {id}</p>
    </>
  );
}
