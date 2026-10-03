type Props = {
  evaluados: number;
  total: number;
};

export function BarraProgreso({ evaluados, total }: Props) {
  const porcentaje = total === 0 ? 0 : Math.round((evaluados / total) * 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={evaluados}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`${evaluados} de ${total} elementos evaluados`}
      className="h-1.5 min-w-20 flex-1 overflow-hidden rounded-full bg-sutil"
    >
      <div className="h-full rounded-full bg-primario transition-[width]" style={{ width: `${porcentaje}%` }} />
    </div>
  );
}
