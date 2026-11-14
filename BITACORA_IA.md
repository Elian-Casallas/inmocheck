# Bitácora de IA · InmoCheck

## Unidad M4U3 · Documentación SDD inversa (2026-11-14)

El proyecto ya estaba terminado. Se le pidió al agente (Claude Code) reconstruir los planos SDD como si se hubieran escrito antes del código.

| # | Prompt clave (resumen) | Qué hizo el agente |
|---|---|---|
| 1 | "Documenta inmocheck con SDD siguiendo la guía M4U3. Solo archivos .md: sin tocar código, sin builds ni tests, leyendo lo mínimo y sin preguntarme. Lo que no se deduzca, anótalo como supuesto." | Leyó las plantillas de la guía, el README, los encabezados de la especificación y del diseño técnico, `globals.css`, `layout.tsx`, `lib/navegacion.ts`, los esquemas Zod y el historial de git |
| 2 | (mismo prompt) → `docs/producto.md` y `docs/arquitectura.md` | Resumió la especificación y el diseño técnico existentes en lugar de duplicarlos, y enlazó a `documentos/` para el detalle |
| 3 | (mismo prompt) → `docs/specs/F1..F5` | Escribió 5 specs con criterios sí/no basados en los mensajes reales de validación (`schemas/`) y en reglas del código (plazo de 7:00 p. m., máximo 8 fotos, enlaces de 60 s) |
| 4 | (mismo prompt) → `docs/diseno/identidad-visual.md` | Sacó los HEX de los tokens `@theme` de `app/globals.css` y calculó el contraste AA |
| 5 | (mismo prompt) → `docs/decisiones.md` y `docs/tareas.md` | Fechó las decisiones con los commits, reconstruyó el checklist desde `git log` y anotó 6 supuestos |
| 6 | (mismo prompt) → `CLAUDE.md`, skill `ui-componentes` y `GUIA_ENTREGA.md` | Amplió el `CLAUDE.md` existente conservando `@AGENTS.md`, y escribió la skill con los componentes y convenciones reales |

| 7 | "Antes de conocer SDD ya tenía todo en `documentos/`: analiza qué le sirve al SDD y agrégalo." | Revisó la especificación, el diseño técnico, el plan, los manuales y el prototipo. Creó `docs/contratos/api.md` comparando con los `route.ts` reales (43 endpoints: los 41 del diseño más 2 nuevos) y `docs/reglas-de-negocio.md` (RN, estados, permisos y casos especiales). Agregó CA-01..16, RNF y definición de terminado a producto, el diagrama ER a arquitectura, trazabilidad a cada spec, estados de UI a identidad y reglas de código limpio a `CLAUDE.md` |
| 8 | "En arquitectura debería ir lo que creé para el backend y el frontend, ¿cierto?" | Reescribió `arquitectura.md` en Front / Back / Base de datos con los componentes, servicios, funciones SQL y migraciones reales. Corrigió un dato: `service_role` también lo usan evidencias e informes |
| 9 | "Le falta material a diseño; en `documentos/inmocheck-prototipo` está el prototipo, ¿sirve?" | Analizó el README, `styles.css` y `sistema-de-diseno.html` del prototipo. Creó `docs/diseno/sistema-de-diseno.md` (5 reglas, medidas, puntos de quiebre y equivalencia de clases CSS con componentes React), `pantallas.md` (22 pantallas → ruta, rol, spec y botón primario) y `referencias/README.md`. Comprobó los puntos de quiebre en el código (menú en 900 px) |
| 10 | "Analiza lo que creamos contra la guía del profe y contra un SDD formal" y luego "rellena los huecos según el profe" | Comparó `docs/` con los entregables de la guía y con Spec Kit / Kiro. Creó `docs/specs/F0-plantilla.md`, reorganizó `tareas.md` en Front (U3) / Back (U4) / Pruebas (U5) / Nube (U6) con la tarea pendiente sin marcar, y explicó en `decisiones.md` por qué los commits son por etapa, por qué no hay variantes `/prototipo/a,b,c` y por qué no hubo datos mock |

**Pendiente de mi parte:** recorrer los criterios de aceptación en el navegador y marcarlos; tomar las capturas de `docs/diseno/referencias/`. Se escribieron a partir del código, sin ejecutar la app.

## Taller M4U2 · Filtro "Con / Sin inmuebles" en Propietarios

**Feature:** en `/dashboard/propietarios`, un selector Todos / Con inmuebles / Sin inmuebles (`?inmuebles=con|sin`) que funciona junto con la búsqueda y la paginación.

**Archivos:** `schemas/propietarios.ts`, `server/repositories/propietarios.repository.ts`, `app/(protected)/dashboard/propietarios/page.tsx`, `tests/unit/schemas.test.ts`, `tests/unit/propietarios.repository.test.ts` (nuevo).

### Prompt final

```text
<rol>Desarrollador fullstack senior en Next.js y Supabase que escribe código limpio y probado.</rol>

<contexto>
Proyecto: InmoCheck, app para que una inmobiliaria gestione inmuebles, propietarios e inspecciones.
Stack: Next.js 16.3 (App Router), React 19.2, TypeScript 5, Tailwind 4, Supabase (supabase-js 2.117), Zod 4, Vitest 5.
Arquitectura: page/route.ts → server/services → server/repositories. Los filtros viven en la URL.
Código existente: propietariosFiltroSchema, listarPropietarios() del repositorio y el patrón
FiltroSeleccion que ya usa la lista de inmuebles.
</contexto>

<tarea>Agregar a /dashboard/propietarios un filtro "Inmuebles" (Todos / Con inmuebles / Sin inmuebles)
que funcione junto con la búsqueda y la paginación.</tarea>

<restricciones>
- Parámetro en el schema Zod, filtro en el repositorio; la página solo lo pinta.
- Filtrar en la consulta a Supabase, no en JavaScript después de paginar.
- Un valor inválido en la URL se ignora sin romper los demás filtros.
- Reusar FiltroSeleccion; sin componentes ni dependencias nuevas.
- No cambiar la forma de la respuesta de GET /api/v1/propietarios.
</restricciones>

<ejemplo>?inmuebles=sin&search=ana → solo propietarios con "ana" y sin inmuebles; meta.total cuenta solo esos.</ejemplo>

<formato>Primero un plan de máximo 5 pasos con los archivos. Espera mi confirmación antes de escribir código.</formato>
```

### Qué falló en el primer intento

- **Pruebas:** las 4 pruebas del repositorio fallaron con `supabase.from is not a function`. El error estaba en la prueba: el cliente falso de Supabase tenía `then`, así que el `await` lo resolvía como una promesa y el repositorio recibía la respuesta vacía.
- **Valor inválido:** la revisión crítica (en un chat nuevo) encontró que con `?search=ana&inmuebles=xyz` el `.catch()` del schema completo borraba también la búsqueda y la página.

### Qué corregí a mano

- Separé en el mock el cliente (sin `then`) de la consulta (con `then`).
- Moví el `.catch(undefined)` al campo `inmuebles`, de modo que solo se ignora el valor malo. También cambié la prueba a "ignora un valor inválido sin perder la búsqueda ni la página".
- **Descartados de la revisión:**
  - Contar como "con inmuebles" a quien solo tiene inmuebles desactivados. Es una decisión tomada en el plan. Cambiarla afecta también la columna "Inmuebles" y el panel de detalle, así que queda como mejora aparte.
  - `.order("id")` para desempatar y el `_` en la búsqueda. Son problemas que ya existían antes de este cambio y no son de esta feature.

### Resultado

58/58 pruebas pasan, `tsc` y `eslint` sin errores. Probado en el navegador: Todos, Con inmuebles, Sin inmuebles (con un propietario de prueba) y un valor inválido.

### Qué aprendí

- Pedir **plan antes que código** permitió verificar que la IA respetara la arquitectura (filtrar en el repositorio, no en la página).
- Cuando una prueba falla, primero hay que revisar la prueba y el mock.
- La **revisión en un chat nuevo** encontró un caso borde que ni las pruebas ni yo habíamos visto.
- Un mock comprueba qué se llama, no que la base devuelva lo correcto. La prueba en el navegador con datos reales sigue siendo necesaria.
