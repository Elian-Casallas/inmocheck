import { Cargando } from "@/components/ui/Cargando";

// Next.js muestra este archivo mientras una página de /dashboard espera sus
// datos. Al estar en la carpeta dashboard, sirve para todas sus pantallas:
// el menú se queda quieto y solo el contenido muestra el indicador.
export default function CargandoDashboard() {
  return <Cargando />;
}
