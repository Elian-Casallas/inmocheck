// Next.js muestra este archivo mientras page.tsx espera los datos.
export default function CargandoInmuebles() {
  return (
    <div role="status" aria-label="Cargando inmuebles" className="flex animate-pulse flex-col gap-6">
      <div className="h-9 w-48 rounded-lg bg-sutil" />
      <div className="h-12 rounded-lg bg-sutil" />
      <div className="h-80 rounded-xl bg-sutil" />
    </div>
  );
}
