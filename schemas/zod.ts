import { z } from "zod";
import { es } from "zod/locales";

// Mensajes de validación por defecto en español. Todos los esquemas importan
// z desde aquí para que la configuración se aplique siempre.
z.config(es());

export { z };
