"use client";

import { useState } from "react";
import { useNavegacion } from "@/components/layout/ProveedorNavegacion";
import { apiFetch } from "@/lib/api/client";

export function BotonCerrarSesion() {
  const router = useNavegacion();
  const [saliendo, setSaliendo] = useState(false);

  async function cerrarSesion() {
    setSaliendo(true);
    try {
      await apiFetch("/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch {
      setSaliendo(false);
    }
  }

  return (
    <button
      type="button"
      onClick={cerrarSesion}
      disabled={saliendo}
      className="cursor-pointer self-start text-pequeno text-texto-tenue hover:underline disabled:opacity-50"
    >
      {saliendo ? "Cerrando sesión…" : "Cerrar sesión"}
    </button>
  );
}
