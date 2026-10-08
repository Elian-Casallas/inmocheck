import { Badge } from "@/components/ui/Badge";
import {
  ETIQUETA_ESTADO_INSPECCION,
  TONO_ESTADO_INSPECCION,
  estaVencida,
  type EstadoInspeccion,
} from "@/lib/inspecciones";

type Props = {
  estado: EstadoInspeccion;
  programadaPara: string;
};

// Estado de una inspección. Una pendiente cuyo plazo ya pasó se muestra en
// rojo como "No realizada"; en la base sigue siendo PENDIENTE.
export function BadgeEstadoInspeccion({ estado, programadaPara }: Props) {
  if (estaVencida({ estado, programadaPara })) return <Badge tono="vencida">No realizada</Badge>;

  return <Badge tono={TONO_ESTADO_INSPECCION[estado]}>{ETIQUETA_ESTADO_INSPECCION[estado]}</Badge>;
}
