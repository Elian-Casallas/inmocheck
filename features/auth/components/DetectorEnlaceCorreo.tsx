"use client";

import { useEffect } from "react";

// Red de seguridad para los enlaces del correo. Si Supabase no reconoce la
// dirección de regreso, manda al usuario a la raíz del sitio con la sesión
// en el fragmento (#access_token=…) y la app termina en /login sin hacer
// nada. Este componente detecta ese caso y lo lleva a /auth/enlace, que es
// la pantalla que sí sabe crear la sesión.
export function DetectorEnlaceCorreo() {
  useEffect(() => {
    const fragmento = window.location.hash;

    if (fragmento.includes("access_token=")) {
      // Se conserva el fragmento: ahí viajan los tokens.
      window.location.replace(`/auth/enlace?siguiente=/auth/actualizar-contrasena${fragmento}`);
    } else if (fragmento.includes("error_code=")) {
      // Enlace vencido o ya usado: Supabase lo avisa en el fragmento.
      window.location.replace("/login?enlace=invalido");
    }
  }, []);

  return null;
}
