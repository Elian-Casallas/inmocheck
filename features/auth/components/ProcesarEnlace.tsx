"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";

// Solo se permite continuar hacia rutas internas de la app.
function destinoSeguro(siguiente: string | null): string {
  return siguiente && siguiente.startsWith("/") && !siguiente.startsWith("//") ? siguiente : "/dashboard";
}

// Los enlaces de invitación y de recuperación llegan con la sesión en el
// "fragmento" de la URL (lo que va después de #). El fragmento nunca viaja
// al servidor, así que solo un componente cliente puede leerlo.
// Este componente crea la sesión y sigue a la pantalla de nueva contraseña.
export function ProcesarEnlace() {
  const router = useRouter();
  const parametros = useSearchParams();
  const procesado = useRef(false);

  useEffect(() => {
    // En desarrollo React ejecuta los efectos dos veces; el enlace es de un solo uso.
    if (procesado.current) return;
    procesado.current = true;

    async function crearSesion() {
      const supabase = crearClienteNavegador();
      const fragmento = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = fragmento.get("access_token");
      const refreshToken = fragmento.get("refresh_token");
      const codigo = parametros.get("code");

      // Se quitan los tokens de la barra de direcciones y del historial.
      window.history.replaceState(null, "", window.location.pathname);

      let error: unknown = "sin datos";
      if (accessToken && refreshToken) {
        ({ error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }));
      } else if (codigo) {
        ({ error } = await supabase.auth.exchangeCodeForSession(codigo));
      }

      // Enlace vencido, ya usado o incompleto: se avisa en el login.
      router.replace(error ? "/login?enlace=invalido" : destinoSeguro(parametros.get("siguiente")));
      router.refresh();
    }

    void crearSesion();
  }, [router, parametros]);

  return (
    <p role="status" className="pt-2 text-cuerpo-sm text-texto-secundario">
      Verificando el enlace…
    </p>
  );
}
