import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // proxy.ts lee el cuerpo de cada petición con un tope de 10 MB por defecto.
    // Una foto de 10 MB más los encabezados del formulario lo supera, así que
    // se sube un poco para que el endpoint pueda responder 413 él mismo.
    proxyClientMaxBodySize: "12mb",
  },
};

export default nextConfig;
