import { plural } from "@/lib/formato";
import type { Progreso } from "@/schemas/inspecciones";
import { BarraProgreso } from "../BarraProgreso";

export function ProgresoInspeccion({ evaluados, total, obligatoriosPendientes }: Progreso) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-borde bg-tarjeta px-5 py-4">
      <span className="text-cuerpo-sm font-medium">
        {evaluados} de {total} elementos evaluados
      </span>
      <BarraProgreso evaluados={evaluados} total={total} />
      <span
        className={`text-pequeno font-medium ${obligatoriosPendientes > 0 ? "text-inspeccion-pendiente" : "text-primario"}`}
      >
        {obligatoriosPendientes > 0
          ? plural(obligatoriosPendientes, "obligatorio pendiente", "obligatorios pendientes")
          : "Obligatorios completos"}
      </span>
    </div>
  );
}
