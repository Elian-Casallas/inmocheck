# InmoCheck — Guía del plan de desarrollo

Este plan está pensado para que **tú escribas el código** y uses a Claude como
profesor: cada prompt pide explicaciones, pistas o revisión, no código hecho.

Archivos del plan:

- `00-guia-del-plan.md` → este archivo: orden de trabajo, reglas y prompts generales.
- `01-plan-backend.md` → ruta B: base de datos, seguridad y API.
- `02-plan-frontend.md` → ruta F: pantallas y componentes.

Cada paso tiene una casilla «Paso terminado»: márcala cambiando `- [ ]` por `- [x]`.

---

## Orden recomendado

No hagas una ruta completa y después la otra. Alterna para ver cada módulo
funcionando de punta a punta y no acumular dudas.

| Etapa | Qué haces | Resultado visible |
|---|---|---|
| 1 | B0 + F0 | Proyecto creado y conectado |
| 2 | B1 + B2 | Base de datos segura |
| 3 | B3 + F1 + F2 | Login funcionando con tu diseño |
| 4 | B4 + F3 + F4 | Inmuebles, inventario y personas |
| 5 | B5 + F5 + F6 | Programar y realizar inspecciones |
| 6 | B6 | Fotos privadas |
| 7 | B7 + F7 | Comparación, PDF y dashboard |
| 8 | B8 + F8 | Pruebas, despliegue y entrega |

**Si el tiempo aprieta**, protege primero el flujo central: login → inmueble con
inventario → programar → realizar con fotos → finalizar → PDF. La comparación,
el dashboard y la auditoría completa pueden quedar más sencillos sin romper el
proyecto.

---

## Reglas de código limpio

Aplícalas en todo el proyecto:

1. **Nombres que se explican solos.** `crearInmueble`, no `fn1` ni `data2`.
   Español para el dominio (inmueble, inspección); inglés solo para lo técnico
   que ya viene así (`route.ts`, `page.tsx`).
2. **Funciones pequeñas con una sola tarea.** Si una función valida, guarda y
   además responde, divídela.
3. **Cada capa hace lo suyo:**
   - la página muestra,
   - el Route Handler recibe y responde,
   - el servicio aplica las reglas,
   - la base de datos protege.
4. **No repitas.** Los esquemas Zod se escriben una vez y los usan el formulario
   y la API.
5. **TypeScript estricto.** Nada de `any`; si no sabes el tipo, pregúntalo.
6. **Nada de números ni textos mágicos regados.** Límites como "8 fotos" o
   "10 MB" van en un archivo de constantes.
7. **Un commit por paso**, con mensaje claro: `feat: formulario de inmueble`,
   `fix: validación de código duplicado`.

---

## Prompt de contexto

Claude no recuerda conversaciones anteriores. Pega esto al iniciar cada chat nuevo:

```text
Estoy haciendo InmoCheck, un proyecto de diplomado Full Stack: app web para
inspecciones de inmuebles con Next.js (App Router), TypeScript, Tailwind,
Supabase (Auth, PostgreSQL con RLS, Storage) y Zod. Roles: administrador e
inspector, multi-inmobiliaria con organizacion_id. Quiero APRENDER: no me
escribas el código completo. Explícame conceptos, dame pistas, pseudocódigo
o ejemplos pequeños distintos a mi caso, y revisa lo que yo escriba
señalando errores y mejoras de código limpio.
```

## Prompts comodín

Para cualquier error:

```text
Me salió este error: [pega el error completo]. Esto es lo que intentaba
hacer: [explica]. Este es mi código: [pega]. No me des la solución directa:
explícame qué significa el error y dame una pista para encontrarlo yo.
```

Para revisar tu código:

```text
Revisa este código como si fueras mi profesor: [pega]. Dime qué está bien,
qué rompe las reglas de código limpio (nombres, funciones largas, repetición,
tipos) y por qué. Sugiéreme cómo mejorarlo sin reescribirlo todo por mí.
```
