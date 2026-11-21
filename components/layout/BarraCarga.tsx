// Barra fina arriba de la pantalla mientras se espera al servidor (Spring en
// Render puede tardar, sobre todo si estaba dormido). Aparece con un pequeño
// retraso para no parpadear en las respuestas rápidas.
export function BarraCarga({ visible }: { visible: boolean }) {
  return (
    <>
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-x-0 top-0 z-[60] h-1 overflow-hidden bg-primario-suave transition-opacity duration-200 ${
          visible ? "opacity-100 delay-150" : "opacity-0"
        }`}
      >
        <div className="h-full w-1/3 bg-primario animate-barra-carga motion-reduce:w-full motion-reduce:animate-none" />
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {visible ? "Cargando…" : ""}
      </p>
    </>
  );
}
