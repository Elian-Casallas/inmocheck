@AGENTS.md

# Proyecto: InmoCheck

Inspecciones digitales de inmuebles para inmobiliarias: inventario, visitas con fotos, comparación entrada/salida y actas PDF. App: https://inmocheck.vercel.app

## Stack
- Front: Next.js 16.3 (App Router) + React 19.2 + TypeScript 5 + Tailwind CSS 4 · React Hook Form + Zod 4 · Vitest
- Back: **Spring Boot 4.1 + Java 21** en `backend/` (Maven, Spring Security con el JWT de Supabase, `JdbcClient`, Bean Validation, OpenPDF, JUnit 5)
- **En migración** (sección 5 de `docs/tareas.md`): los módulos que aún no están en Spring siguen en el BFF viejo de `app/api/v1` y `server/`. Next.js reenvía `/api/v1` a Spring con un proxy.
- Supabase: PostgreSQL con RLS y funciones SQL, Auth (cookies en el front, JWT en el back) y Storage privado
- Despliegue: Vercel (front), AWS Elastic Beanstalk (back) y Supabase (datos)

## Documentación (léela antes de cualquier cambio)
- Qué es el producto y qué NO entra: @docs/producto.md
- Tecnología, carpetas, rutas y entidades: @docs/arquitectura.md
- Funcionalidades y criterios: `docs/specs/` (F1–F5)
- Reglas de negocio, estados y permisos: @docs/reglas-de-negocio.md
- Endpoints, errores y convenciones de la API: `docs/contratos/api.md`
- Colores, tipografía y estilo: @docs/diseno/identidad-visual.md
- Reglas de diseño y componentes: `docs/diseno/sistema-de-diseno.md` · Pantallas: `docs/diseno/pantallas.md`
- Prototipo de referencia: `documentos/inmocheck-prototipo/index.html`
- Por qué se hizo así: `docs/decisiones.md`
- Qué está hecho y qué sigue: `docs/tareas.md`
- Detalle ampliado: `documentos/` (especificación, diseño técnico, plan, prototipo, Postman)

## Reglas de trabajo
- Implementa UNA tarea de `docs/tareas.md` a la vez y márcala al terminar.
- No agregues funcionalidades que no estén en `docs/specs/`. Si el alcance cambia, actualiza primero los docs.
- No toques archivos que la tarea no requiera.
- Nunca escribas llaves o tokens en el código: usa `.env.local`. `SUPABASE_SERVICE_ROLE_KEY` es solo de servidor.
- Para la UI, usa la skill `ui-componentes`.
- Al terminar cada tarea, explica cómo probarla en el navegador.

## Convenciones
- Capas del back: Controller (rol y `@Valid`) → Service (reglas) → Repository (`JdbcClient`, siempre dentro de `EjecutorRls`). Sin lógica de negocio en páginas, en el proxy ni en los controllers.
- Spring respeta `docs/contratos/api.md` tal cual; si algo del contrato cambia, primero se actualiza el doc.
- El rol y la organización salen de la sesión, nunca del cuerpo de la petición.
- Los esquemas Zod de `schemas/` se comparten entre el formulario y la API.
- Los cambios de estado de una inspección van por funciones SQL con `version` (control de concurrencia).
- Nada se borra: se desactiva (`activo = false`).
- Los filtros, la página y los paneles viven en la URL.
- Los errores de la API van en `application/problem+json`.
- Código, nombres y textos en español. Componentes en PascalCase. Diseño mobile first.
- Cambios en la base solo con una migración nueva en `supabase/migrations/`.

## Código limpio (de `documentos/Plan/00-guia-del-plan.md`)
- Nombres que se explican solos: dominio en español (`crearInmueble`) e inglés solo para lo que ya viene así (`route.ts`).
- Funciones pequeñas con una sola tarea.
- TypeScript estricto: nada de `any`.
- Nada de números ni textos mágicos: los límites (8 fotos, 10 MB, 60 s) van en `lib/constantes.ts`.
- Un commit por paso con mensaje claro (`feat: …`, `fix: …`, `docs: …`).
