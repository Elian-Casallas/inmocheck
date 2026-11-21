import { Cargando } from "@/components/ui/Cargando";

// Primera carga de la app: el layout protegido pregunta a Spring quién es el
// usuario antes de pintar el menú (y Render puede estar despertando). Sin este
// archivo la pantalla quedaría en blanco mientras tanto.
export default function CargandoApp() {
  return <Cargando pantallaCompleta texto="Cargando InmoCheck…" />;
}
