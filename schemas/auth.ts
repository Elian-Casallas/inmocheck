import { z } from "./zod";
import { CONTRASENA_MINIMA } from "@/lib/constantes";

// Esquemas compartidos: el formulario los usa para validar antes de enviar y
// la API los vuelve a usar al recibir. .strict() rechaza campos de más.

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Escribe un correo válido."));

export const loginSchema = z
  .object({
    email,
    password: z.string().min(1, "Escribe tu contraseña."),
  })
  .strict();

export const recuperarContrasenaSchema = z.object({ email }).strict();

export const nuevaContrasenaSchema = z
  .object({
    password: z.string().min(CONTRASENA_MINIMA, `Mínimo ${CONTRASENA_MINIMA} caracteres.`),
    confirmacion: z.string(),
  })
  .refine((datos) => datos.password === datos.confirmacion, {
    path: ["confirmacion"],
    message: "Las contraseñas no coinciden.",
  });

export type LoginDatos = z.infer<typeof loginSchema>;
export type RecuperarContrasenaDatos = z.infer<typeof recuperarContrasenaSchema>;
export type NuevaContrasenaDatos = z.infer<typeof nuevaContrasenaSchema>;
