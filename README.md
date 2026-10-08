# InmoCheck

Aplicación web para gestionar inmuebles y realizar inspecciones digitales con
fotos, historial, comparación entrada/salida e informes PDF. Proyecto del
Diplomado Full Stack.

**Aplicación desplegada:** https://inmocheck.vercel.app

- **Roles:** administrador e inspector. Propietarios y arrendatarios son datos, no cuentas.
- **Multi-inmobiliaria:** cada registro pertenece a una organización y la base de datos impide ver los de otra.

## Tecnologías

| Capa | Herramienta |
|---|---|
| Interfaz y servidor | Next.js 16 (App Router), React 19, TypeScript |
| Estilos | Tailwind CSS 4 |
| Formularios y validación | React Hook Form + Zod (un mismo esquema para formulario y API) |
| Autenticación | Supabase Auth (sesión en cookies httpOnly) |
| Base de datos | Supabase PostgreSQL con Row Level Security |
| Archivos | Supabase Storage (buckets privados, enlaces firmados) |
| PDF | @react-pdf/renderer |
| Pruebas | Vitest (unitarias), pruebas SQL de RLS, colección de Postman |

## Cómo ejecutarlo

Requisitos: Node.js 20 o superior y un proyecto de Supabase.

```bash
npm install
```

Copia `.env.example` como `.env.local` y completa los tres valores
(Supabase → Project Settings → API Keys):

| Variable | Qué es |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (`anon`). Puede ir en el navegador |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave `service_role`. **Solo servidor**: salta RLS. Nunca con `NEXT_PUBLIC_` |

Base de datos: ejecuta en orden los archivos de `supabase/migrations/` y luego
`supabase/seed.sql` (SQL Editor de Supabase o `npx supabase db push`).

En Supabase → Authentication → URL Configuration agrega la URL de la app con
`/**` a las Redirect URLs (por ejemplo `http://localhost:3000/**`), para que
funcionen los enlaces de invitación y de recuperación de contraseña.

```bash
npm run dev
```

Abre http://localhost:3000.

### Cuentas de demostración

`supabase/seed.sql` crea dos inmobiliarias con datos inventados. La contraseña
de demostración está definida en ese archivo.

| Inmobiliaria | Administrador | Inspectores |
|---|---|---|
| Los Pinos | `admin@pinos.test` | `laura@pinos.test`, `carlos@pinos.test` |
| Andes | `admin@andes.test` | `sofia@andes.test`, `mateo@andes.test` |

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila para producción |
| `npm run lint` | Revisa el código con ESLint |
| `npm test` | Pruebas unitarias con Vitest |

## Estructura

```text
app/
  (public)/            login y recuperar contraseña (sin sesión)
  (protected)/         todo /dashboard: exige sesión y cuenta activa
  auth/                pantallas a las que llegan los enlaces del correo
  api/v1/              API REST (Route Handlers)
components/            piezas reutilizables en toda la app (ui/ y layout/)
features/              componentes de un módulo concreto
schemas/               esquemas Zod compartidos por formularios y API
server/                solo servidor: auth, errores, servicios, repositorios, PDF
lib/                   utilidades, clientes de Supabase, constantes
supabase/
  migrations/          tablas, índices, RLS y funciones SQL versionadas
  seed.sql             datos de prueba
  tests/rls.sql        pruebas de seguridad entre organizaciones y roles
tests/unit/            pruebas unitarias
documentos/            especificación, diseño técnico, plan, prototipo y Postman
proxy.ts               refresca la sesión y bloquea /dashboard sin sesión
```

Las carpetas entre paréntesis son *grupos de rutas*: organizan archivos y
comparten un `layout.tsx`, pero no aparecen en la URL.

### Camino de una petición

```text
página o formulario → /api/v1 (Route Handler) → servicio → repositorio → PostgreSQL + RLS
```

- **Route Handler:** valida sesión, rol y forma de los datos (Zod); responde.
- **Servicio:** aplica reglas de negocio y traduce errores.
- **Repositorio:** consulta Supabase.
- **Base de datos:** RLS, restricciones y funciones transaccionales son la última barrera.

## Seguridad

- El rol y la organización salen de la sesión y de la tabla `perfiles`, nunca del cuerpo de la petición.
- RLS en las 11 tablas: el administrador ve su organización; el inspector, solo sus inspecciones asignadas.
- Las inspecciones solo cambian mediante funciones SQL transaccionales que validan estado, versión y permisos, y dejan auditoría.
- Una inspección finalizada no se puede modificar ni reabrir.
- Nada se borra: inmuebles, elementos e inspectores se desactivan y conservan su historial.
- Fotos y PDF viven en buckets privados; se accede con enlaces firmados de 60 segundos emitidos tras autorizar.
- Los errores de la API tienen formato uniforme `application/problem+json` (RFC 9457).

## Pruebas

- **Unitarias:** `npm test` cubre los esquemas Zod, el cálculo de progreso y la comparación.
- **Seguridad en la base:** `supabase/tests/rls.sql` se hace pasar por cada usuario y compara lo esperado con lo obtenido; no deja cambios.
- **API:** importa `documentos/api/postman_collection.json` en Postman, escribe la variable `password` y ejecuta la colección completa en orden.

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. Agrega las tres variables de entorno de `.env.example`. `SUPABASE_SERVICE_ROLE_KEY` va sin el prefijo `NEXT_PUBLIC_`.
3. Agrega la URL de producción con `/**` a las Redirect URLs de Supabase.
4. Verifica que la clave de servicio no quedó expuesta: en el navegador, busca su valor en las fuentes de la página; no debe aparecer.

## Fuera del alcance de esta versión

Portal para propietarios y arrendatarios, firmas, correos automáticos, modo sin
conexión, pagos y contratos. Los datos del proyecto son ficticios.
