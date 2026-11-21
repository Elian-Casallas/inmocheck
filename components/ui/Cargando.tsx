type Props = {
  texto?: string;
  // true: ocupa toda la pantalla (antes de que exista el menú).
  pantallaCompleta?: boolean;
};

// Indicador de carga: círculo girando y un texto. Lo usan los loading.tsx
// mientras la página espera los datos del servidor.
export function Cargando({ texto = "Cargando…", pantallaCompleta = false }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-1 flex-col items-center justify-center gap-4 text-texto-secundario ${
        pantallaCompleta ? "min-h-dvh bg-fondo" : "min-h-80 py-16"
      }`}
    >
      <span
        aria-hidden="true"
        className="size-10 animate-spin rounded-full border-4 border-primario-suave border-t-primario motion-reduce:animate-none"
      />
      <p className="text-cuerpo-sm font-medium">{texto}</p>
    </div>
  );
}
