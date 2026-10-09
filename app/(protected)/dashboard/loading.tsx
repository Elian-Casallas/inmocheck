// Next.js muestra este archivo mientras una página de /dashboard espera sus
// datos. Al estar en la carpeta dashboard, sirve para todas sus pantallas:
// el menú se queda quieto y solo el contenido muestra este esqueleto.
export default function CargandoDashboard() {
  return (
    <div role="status" aria-label="Cargando" className="flex animate-pulse flex-col gap-6">
      <div className="h-9 w-56 rounded-lg bg-sutil" />
      <div className="h-12 rounded-lg bg-sutil" />
      <div className="h-80 rounded-xl bg-sutil" />
    </div>
  );
}
