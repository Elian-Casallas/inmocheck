type Props = {
  datos: { etiqueta: string; valor: React.ReactNode }[];
  columnas?: 1 | 2;
};

// Lista de "etiqueta: valor" con las etiquetas HTML correctas (dl, dt, dd).
export function ListaDatos({ datos, columnas = 1 }: Props) {
  return (
    <dl className={`grid gap-3.5 ${columnas === 2 ? "sm:grid-cols-2" : ""}`}>
      {datos.map(({ etiqueta, valor }) => (
        <div key={etiqueta} className="flex flex-col gap-0.5">
          <dt className="text-cuerpo-sm text-texto-tenue">{etiqueta}</dt>
          <dd className="text-cuerpo-sm font-medium">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}
