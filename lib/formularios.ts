import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/lib/api/client";

// Conversores para register() de React Hook Form: un <input> siempre entrega
// texto, y el esquema Zod espera número o null.
export const textoONull = (valor: unknown) =>
  typeof valor === "string" && valor.trim() !== "" ? valor.trim() : null;

export const numeroONull = (valor: unknown) => {
  if (valor === "" || valor === null || valor === undefined) return null;
  // Se acepta coma decimal: "85,5" → 85.5
  return Number(String(valor).replace(",", "."));
};

// Si la API respondió 422 con errores por campo, los pinta en el formulario.
// Devuelve el mensaje general cuando el error no es de un campo concreto.
export function aplicarErroresDeApi<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): string | null {
  if (error instanceof ApiError && error.errors.length > 0) {
    for (const { field, message } of error.errors) {
      setError(field as Path<T>, { message });
    }
    return null;
  }
  return error instanceof ApiError ? error.message : "Ocurrió un error inesperado.";
}
