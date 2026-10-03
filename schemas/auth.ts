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

// Regla de contraseña: corta de explicar y suficiente para evitar las más
// obvias ("12345678", "password"). Mínimo 8, con al menos una letra y un número.
export const contrasenaSchema = z
  .string()
  .min(CONTRASENA_MINIMA, `Mínimo ${CONTRASENA_MINIMA} caracteres.`)
  .max(72, "Máximo 72 caracteres.")
  .regex(/\p{L}/u, "Incluye al menos una letra.")
  .regex(/\d/, "Incluye al menos un número.");

export const nuevaContrasenaSchema = z
  .object({
    password: contrasenaSchema,
    confirmacion: z.string(),
  })
  .refine((datos) => datos.password === datos.confirmacion, {
    path: ["confirmacion"],
    message: "Las contraseñas no coinciden.",
  });

export type LoginDatos = z.infer<typeof loginSchema>;
export type RecuperarContrasenaDatos = z.infer<typeof recuperarContrasenaSchema>;
export type NuevaContrasenaDatos = z.infer<typeof nuevaContrasenaSchema>;
