# InmoCheck — Plan Frontend

Pantallas y componentes en Next.js (App Router) con TypeScript y Tailwind.
Referencia visual: el prototipo HTML (`docs/prototipo/`).
Antes de cada chat nuevo, pega el **prompt de contexto** de `00-guia-del-plan.md`.

---

## Cómo leer las rutas (léelo una vez)

En Next.js App Router **cada carpeta dentro de `src/app` es un pedazo de la URL**
y el archivo `page.tsx` es la pantalla que se muestra.

| Si creas este archivo… | …la URL es |
|---|---|
| `src/app/(public)/login/page.tsx` | `/login` |
| `src/app/(protected)/dashboard/inmuebles/page.tsx` | `/dashboard/inmuebles` |
| `src/app/(protected)/dashboard/inmuebles/[id]/page.tsx` | `/dashboard/inmuebles/123` |

Tres reglas que evitan confusiones:

1. **Paréntesis = no sale en la URL.** `(public)` y `(protected)` solo agrupan
   carpetas para darles un layout distinto.
2. **Corchetes = parte variable.** `[id]` recibe el identificador del inmueble o
   de la inspección.
3. **`layout.tsx` envuelve a todas las páginas de su carpeta y subcarpetas.**
   Ahí va lo que se repite (menú, encabezado, pestañas).

En este plan, rutas y archivos aparecen siempre así:
**Ruta** `/dashboard/inmuebles` → **Archivo** `src/app/(protected)/dashboard/inmuebles/page.tsx`.

---

## Mapa general de rutas

Tenlo a la mano: es la lista completa de pantallas del MVP.
En las tablas, `…/` equivale a `src/app/(protected)/dashboard/`.

### Públicas (sin sesión)

| Ruta | Carpeta del `page.tsx` | Prototipo |
|---|---|---|
| `/login` | `src/app/(public)/login/` | `3-sistema-y-compartidas/login.html` |
| `/recuperar-contrasena` | `src/app/(public)/recuperar-contrasena/` | `recuperar-contrasena.html` |
| `/auth/actualizar-contrasena` | `src/app/auth/actualizar-contrasena/` | `nueva-contrasena.html` |

### Protegidas: administrador

| Ruta | Carpeta del `page.tsx` | Prototipo |
|---|---|---|
| `/dashboard` | `src/app/(protected)/dashboard/` | `1-administrador/dashboard.html` |
| `/dashboard/inmuebles` | `…/inmuebles/` | `inmuebles.html` |
| `/dashboard/inmuebles/nuevo` | `…/inmuebles/nuevo/` | `inmueble-nuevo.html` |
| `/dashboard/inmuebles/[id]` | `…/inmuebles/[id]/` | `inmueble-detalle.html` |
| `/dashboard/inmuebles/[id]/editar` | `…/inmuebles/[id]/editar/` | `inmueble-editar.html` |
| `/dashboard/inmuebles/[id]/inventario` | `…/inmuebles/[id]/inventario/` | `inmueble-inventario.html` |
| `/dashboard/inmuebles/[id]/historial` | `…/inmuebles/[id]/historial/` | `inmueble-historial.html` |
| `/dashboard/propietarios` | `…/propietarios/` | `propietarios.html` |
| `/dashboard/inspectores` | `…/inspectores/` | `inspectores.html` |
| `/dashboard/inspecciones` | `…/inspecciones/` | `inspecciones.html` |
| `/dashboard/inspecciones/nueva` | `…/inspecciones/nueva/` | `inspeccion-nueva.html` |
| `/dashboard/inspecciones/[id]/comparar` | `…/inspecciones/[id]/comparar/` | `inspeccion-comparar.html` |
| `/dashboard/inspecciones/[id]/informe` | `…/inspecciones/[id]/informe/` | `inspeccion-informe.html` |
| `/dashboard/informes` | `…/informes/` | `informes.html` |
| `/dashboard/configuracion` | `…/configuracion/` | `configuracion.html` |

### Protegidas: inspector

| Ruta | Carpeta del `page.tsx` | Prototipo |
|---|---|---|
| `/dashboard/mis-inspecciones` | `…/mis-inspecciones/` | `2-inspector/mis-inspecciones.html` |
| `/dashboard/inspecciones/[id]` | `…/inspecciones/[id]/` | `inspeccion-detalle.html` |
| `/dashboard/inspecciones/[id]/realizar` | `…/inspecciones/[id]/realizar/` | `inspeccion-realizar.html` |

### Compartidas y de error

| Ruta | Archivo | Nota |
|---|---|---|
| `/dashboard/inspecciones/[id]` | la misma de arriba | El admin ve *Reasignar* y *Cancelar*; el inspector, *Iniciar* |
| `/dashboard/inmuebles`, `/dashboard/informes`, `/dashboard/configuracion` | las mismas del admin | El inspector las ve en modo lectura y filtradas |
| `/403` | `src/app/403/page.tsx` | Sin permiso |
| Cualquier ruta inexistente | `src/app/not-found.tsx` | Página 404 |

**Propietarios e inspectores no tienen ruta `[id]`**: su detalle se abre en un
panel lateral dentro de su listado, como en el prototipo.

---

## F0 · Preparación

### F0.1 Crear el proyecto

- [ ] Paso terminado

Ejecuta `create-next-app` con TypeScript, Tailwind, ESLint, App Router y la
carpeta `src/`.

**Archivos que aparecen:** `src/app/layout.tsx` (layout raíz), `src/app/page.tsx`
(la ruta `/`) y `src/app/globals.css`.

**Listo cuando:** corre con `npm run dev` y abres `http://localhost:3000`.

```text
Explícame los archivos que creó create-next-app en src/app: qué hace
layout.tsx, page.tsx y globals.css, y qué significa que un componente sea
"Server Component" por defecto.
```

### F0.2 Llevar el sistema de diseño a Tailwind

- [ ] Paso terminado

Pasa los colores y la tipografía de `docs/prototipo/assets/styles.css` al tema
de Tailwind. En Tailwind 4 van en `src/app/globals.css` con `@theme`; en
Tailwind 3, en `tailwind.config.ts`.

**Listo cuando:** puedes usar clases como `bg-primario` o `text-estado-regular`.

```text
Tengo estos tokens CSS de mi prototipo: [pega el :root de styles.css].
Instalé Tailwind versión [número]. Explícame cómo convertirlos en tema de
Tailwind para mantener los mismos nombres.
```

### F0.3 Esqueleto de rutas (tu mapa vivo)

- [ ] Paso terminado

Crea **todas** las carpetas del mapa general, cada una con un `page.tsx` que por
ahora solo muestre su título, por ejemplo `<h1>Inmuebles</h1>`. Haz que
`src/app/page.tsx` (la ruta `/`) redirija a `/login`.

**Por qué:** desde el primer día ves la aplicación completa, y cada paso
siguiente consiste en "llenar" una carpeta que ya existe. Así no te pierdes.

**Listo cuando:** puedes escribir cada URL del mapa en el navegador y ver su título.

```text
Voy a crear el esqueleto de rutas de mi app con carpetas vacías y un
page.tsx de prueba en cada una. Explícame cómo recibir el parámetro [id] en
una página (params) en mi versión de Next.js, y cómo hacer que "/"
redirija a "/login" con redirect().
```

---

## F1 · Componentes base

### F1.1 Componentes pequeños

- [ ] Paso terminado

Crea `Boton`, `Badge`, `EstadoElemento`, `SelectorEstado`, `Campo`, `Tarjeta`,
`Aviso` y `Tabla`, cada uno con sus variantes tipadas.

**Archivos:** `src/components/ui/Boton.tsx`, `src/components/ui/Badge.tsx`, etc.

**Ruta de práctica (solo para desarrollo):** `/sistema-de-diseno`
→ `src/app/(dev)/sistema-de-diseno/page.tsx`. Ahí pones todos los componentes
juntos, como en el prototipo, para compararlos. Bórrala antes de entregar o
protégela.

**Listo cuando:** `/sistema-de-diseno` se ve igual que `sistema-de-diseno.html`.

```text
Quiero crear un componente Boton con variantes primario, secundario, texto y
peligro en TypeScript. Explícame cómo tipar las props con variantes y cómo
evitar un if gigante para las clases. Luego revisa el mío: [pega].
```

### F1.2 Estructura de la app (menú y layout)

- [ ] Paso terminado

Crea el menú lateral (escritorio), la navegación inferior (celular) y el
encabezado de página, y úsalos en el layout del dashboard.

**Archivos:**

- `src/components/layout/MenuLateral.tsx`
- `src/components/layout/NavegacionInferior.tsx`
- `src/components/layout/EncabezadoPagina.tsx`
- `src/app/(protected)/dashboard/layout.tsx` ← envuelve **todas** las rutas `/dashboard/...`

**Detalle:** en `/dashboard/inspecciones/[id]/realizar` la navegación inferior
se oculta en celular. Resuélvelo con `usePathname()` dentro de `NavegacionInferior`.

**Listo cuando:** navegas por las páginas del esqueleto con el menú, y la opción
activa se marca sola.

```text
Explícame cómo hacer un layout en App Router que muestre un menú lateral en
escritorio y una navegación inferior en celular, cómo marcar la opción
activa según la ruta con usePathname, y cómo ocultar la navegación inferior
solo en /realizar. Revisa el mío: [pega].
```

---

## F2 · Autenticación

### F2.1 Login y contraseñas

- [ ] Paso terminado

| Ruta | Archivo |
|---|---|
| `/login` | `src/app/(public)/login/page.tsx` |
| `/recuperar-contrasena` | `src/app/(public)/recuperar-contrasena/page.tsx` |
| `/auth/actualizar-contrasena` | `src/app/auth/actualizar-contrasena/page.tsx` |
| (diseño común) | `src/app/(public)/layout.tsx` ← tarjeta centrada, sin menú |

Construye los formularios con React Hook Form, Zod y estados de carga y error.
Ponlos en `src/features/auth/components/` (por ejemplo `FormularioLogin.tsx`) y
deja el `page.tsx` corto: solo importa y muestra el formulario.

**Listo cuando:** entras con usuarios reales de Supabase (CA-01).

```text
Explícame cómo conectar React Hook Form con un esquema Zod, cómo mostrar el
error debajo de cada campo y cómo evitar que el usuario envíe el formulario
dos veces mientras carga. ¿Por qué conviene que page.tsx sea corto y el
formulario esté en otro archivo?
```

### F2.2 Proteger rutas y redirigir por rol

- [ ] Paso terminado

| Qué | Archivo |
|---|---|
| Revisión de sesión en cada petición | `src/middleware.ts` (en Next.js 16 se llama `src/proxy.ts`) |
| Verificar rol y cuenta activa | `src/app/(protected)/layout.tsx` |
| Admin ve el resumen; el inspector va a su agenda | `src/app/(protected)/dashboard/page.tsx` |
| Página sin permiso | `src/app/403/page.tsx` |
| Página no encontrada | `src/app/not-found.tsx` |

**Listo cuando:**

- sin sesión, cualquier `/dashboard/...` te manda a `/login` (CA-02);
- un inspector que abre `/dashboard` termina en `/dashboard/mis-inspecciones`;
- un inspector que abre `/dashboard/propietarios` ve `/403`.

```text
Explícame la diferencia entre proteger una ruta en el middleware/proxy, en el
layout y en el endpoint, y por qué ocultar un botón NO es seguridad. ¿Cómo
decido en /dashboard/page.tsx si muestro el resumen o redirijo al inspector?
```

---

## F3 · Inmuebles

Todas estas rutas viven en `src/app/(protected)/dashboard/inmuebles/`.

| Ruta | Archivo | Quién entra |
|---|---|---|
| `/dashboard/inmuebles` | `page.tsx` | Admin (todo) · Inspector (solo los suyos) |
| `/dashboard/inmuebles/nuevo` | `nuevo/page.tsx` | Admin |
| `/dashboard/inmuebles/[id]` | `[id]/page.tsx` | Admin · Inspector |
| `/dashboard/inmuebles/[id]/editar` | `[id]/editar/page.tsx` | Admin |
| `/dashboard/inmuebles/[id]/inventario` | `[id]/inventario/page.tsx` | Admin (edita) · Inspector (lee) |
| `/dashboard/inmuebles/[id]/historial` | `[id]/historial/page.tsx` | Admin · Inspector |
| (encabezado + pestañas) | `[id]/layout.tsx` | Compartido por las 4 rutas de `[id]` |

**Ojo:** `nuevo` es una carpeta fija y `[id]` una variable. Next.js elige
primero la fija, así que `/inmuebles/nuevo` no se confunde con un id.

### F3.1 Listado con búsqueda y filtros en la URL

- [ ] Paso terminado

**Ruta** `/dashboard/inmuebles` → `inmuebles/page.tsx`, más `loading.tsx` y
`error.tsx` en la misma carpeta. Componentes en `src/features/inmuebles/components/`
(`TablaInmuebles.tsx`, `FiltrosInmuebles.tsx`).

**Listo cuando:** abres `/dashboard/inmuebles?search=apt&page=2`, recargas y los
filtros se mantienen.

```text
Explícame por qué guardar los filtros en la URL (searchParams) es mejor que
en useState, y cómo manejar los estados loading, empty y error en App Router
(loading.tsx, error.tsx).
```

### F3.2 Registrar y editar con un solo formulario

- [ ] Paso terminado

**Rutas** `/nuevo` → `nuevo/page.tsx` y `/[id]/editar` → `[id]/editar/page.tsx`.
Ambas usan el mismo `src/features/inmuebles/components/FormularioInmueble.tsx`.

**Listo cuando:**

- no se puede enviar dos veces;
- el 409 de código duplicado aparece en el campo "Código";
- al crear, navegas a `/dashboard/inmuebles/[id]/inventario`.

```text
Quiero un solo FormularioInmueble para crear y editar. Explícame cómo
diseñar sus props (modo, valores iniciales) y cómo convertir un error 409
de la API en un error visible en el campo "código".
```

### F3.3 Detalle, inventario e historial con pestañas

- [ ] Paso terminado

Primero crea `[id]/layout.tsx` con el encabezado del inmueble y las pestañas
*Resumen · Inventario · Historial*. Luego llena las tres páginas.

**Listo cuando:** al cambiar de pestaña, el encabezado no se recarga y la
pestaña activa se marca sola.

```text
Explícame cómo compartir el encabezado y las pestañas entre
/inmuebles/[id], /inventario y /historial usando un layout.tsx en la
carpeta [id], y cómo leer el id desde ese layout. Dame la estructura, no el
código.
```

---

## F4 · Propietarios e inspectores

| Ruta | Archivo | Quién entra |
|---|---|---|
| `/dashboard/propietarios` | `…/propietarios/page.tsx` | Admin |
| `/dashboard/inspectores` | `…/inspectores/page.tsx` | Admin |

### F4.1 Panel lateral reutilizable

- [ ] Paso terminado

Crea `src/components/ui/PanelLateral.tsx`: accesible, se cierra con Esc y mueve
el foco. Úsalo para registrar y editar propietarios, y para invitar y ver
inspectores.

**Consejo:** para que el panel se pueda compartir por enlace, ábrelo con un
parámetro en la URL, por ejemplo `/dashboard/propietarios?ver=ID`.

**Listo cuando:** funciona con teclado en las dos pantallas.

```text
Explícame qué hace accesible a un panel lateral o modal (foco, Esc, aria),
cómo hacerlo reutilizable con children, y cómo abrirlo con un parámetro de
la URL (?ver=ID). Revisa el mío: [pega].
```

---

## F5 · Inspecciones (administrador)

| Ruta | Archivo | Quién entra |
|---|---|---|
| `/dashboard/inspecciones` | `…/inspecciones/page.tsx` | Admin |
| `/dashboard/inspecciones/nueva` | `…/inspecciones/nueva/page.tsx` | Admin |
| `/dashboard/inspecciones/[id]` | `…/inspecciones/[id]/page.tsx` | Admin (vista con *Reasignar* y *Cancelar*) |

### F5.1 Listado y programar

- [ ] Paso terminado

Construye el listado con filtros por estado en la URL (`?estado=pendiente`) y el
formulario de programar, con el aviso de comparación cuando el tipo es Salida.

**Listo cuando:** la inspección programada aparece en `/dashboard/mis-inspecciones`
del inspector correcto (CA-06).

```text
Explícame cómo cargar las opciones de un select (inmuebles activos,
inspectores activos) desde un Server Component y pasarlas a un formulario
cliente, sin exponer datos de otras organizaciones.
```

### F5.2 Detalle según el rol

- [ ] Paso terminado

En `inspecciones/[id]/page.tsx` muestra acciones distintas según el rol:

- **inspector:** *Iniciar inspección*;
- **admin:** *Reasignar* y *Cancelar* en paneles laterales, más la tarjeta *Actividad*.

**Listo cuando:** la misma URL muestra botones distintos a cada rol.

```text
Tengo una página que se ve distinta según el rol. Explícame cómo organizarla
para no llenar el page.tsx de condiciones: por ejemplo, dos componentes
AccionesAdmin y AccionesInspector. ¿Dónde leo el rol de forma segura?
```

---

## F6 · Pantallas del inspector

| Ruta | Archivo | Quién entra |
|---|---|---|
| `/dashboard/mis-inspecciones` | `…/mis-inspecciones/page.tsx` | Inspector |
| `/dashboard/inspecciones/[id]` | la misma de F5.2 | Inspector (vista con *Iniciar*) |
| `/dashboard/inspecciones/[id]/realizar` | `…/inspecciones/[id]/realizar/page.tsx` | Solo el inspector asignado |

### F6.1 Mis inspecciones

- [ ] Paso terminado

Arriba muestra la tarjeta "En curso" y debajo la tabla con filtro
*Próximas / Finalizadas* en la URL (`?vista=finalizadas`).

**Listo cuando:** *Continuar inspección* lleva a `/dashboard/inspecciones/[id]/realizar`.

```text
Explícame cómo consultar solo las inspecciones asignadas al usuario
conectado desde un Server Component, y por qué la seguridad real está en RLS
aunque yo filtre también en la consulta.
```

### F6.2 Realizar inspección: dividirla en componentes

- [ ] Paso terminado

Crea los componentes en `src/features/inspecciones/components/realizar/`:
`ProgresoInspeccion`, `ListaEspacios`, `TarjetaElemento`, `SelectorEstado` y
`FotosElemento`. El `page.tsx` de `/realizar` solo carga los datos y los pasa.

**Listo cuando:** ningún componente pasa de ~150 líneas.

```text
Mi pantalla "Realizar inspección" es grande. Ayúdame a dividirla en
componentes: cuáles, qué props recibe cada uno y dónde debe vivir el estado.
Dame un diagrama en texto, no el código.
```

### F6.3 Estado de guardado honesto

- [ ] Paso terminado

Muestra "Cambios sin guardar" hasta recibir la respuesta del servidor, y maneja
el 409 de versión sin reintentar a ciegas.

**Listo cuando:** si apagas el internet, nunca aparece "Guardado" (CA-15).

```text
Explícame cómo manejar los estados de un guardado (sin cambios, sucio,
guardando, guardado, error) y qué debe hacer la interfaz cuando la API
responde 409 VERSION_CONFLICT.
```

### F6.4 Fotos y finalizar

- [ ] Paso terminado

Construye la subida con `FormData` y su progreso, y la validación que lista los
obligatorios pendientes con un enlace a cada uno.

**Listo cuando:** completas y finalizas una inspección desde el celular, y después
te lleva a `/dashboard/inspecciones/[id]/informe`.

```text
Explícame cómo subir una imagen con FormData desde React, por qué no debo
poner el Content-Type a mano, y cómo mostrar errores por archivo (413, 415).
```

---

## F7 · Consultas y cierre de pantallas

| Ruta | Archivo | Quién entra |
|---|---|---|
| `/dashboard/inspecciones/[id]/comparar` | `…/inspecciones/[id]/comparar/page.tsx` | Admin · Inspector autorizado |
| `/dashboard/inspecciones/[id]/informe` | `…/inspecciones/[id]/informe/page.tsx` | Admin · Inspector autorizado |
| `/dashboard/informes` | `…/informes/page.tsx` | Admin (todos) · Inspector (los suyos) |
| `/dashboard` | `src/app/(protected)/dashboard/page.tsx` | Admin (resumen) |
| `/dashboard/configuracion` | `…/configuracion/page.tsx` | Admin · Inspector |

### F7.1 Comparación e informe

- [ ] Paso terminado

La comparación usa filtros en la URL (`?contra=ID&ver=cambios`). El informe
muestra la vista previa, las versiones y la descarga.

**Listo cuando:** descargas un PDF y ves las diferencias de entrada y salida.

```text
Explícame cómo descargar un PDF desde una URL firmada en Next.js y cómo
mostrar un botón de reintento si la generación falla, sin cambiar la
inspección.
```

### F7.2 Biblioteca, dashboard y configuración

- [ ] Paso terminado

Todas reutilizan los componentes que ya tienes, así que esta fase debería ir rápido.

**Listo cuando:** las 22 pantallas del mapa general están llenas y ya no queda
ningún título de prueba del esqueleto.

```text
Revisa si estoy reutilizando bien mis componentes: estas son mis páginas
[pega dos page.tsx]. ¿Qué se repite que debería volverse componente?
```

---

## F8 · Calidad y entrega

### F8.1 Revisión final

- [ ] Paso terminado

Recorre el mapa general de rutas en celular y en escritorio. Revisa responsive,
accesibilidad (teclado y etiquetas) y consistencia con las 5 reglas de diseño.
Borra o protege la ruta `/sistema-de-diseno`.

```text
Dame una lista de verificación de accesibilidad y responsive para revisar
mis pantallas yo mismo, explicando por qué importa cada punto.
```

### F8.2 Pruebas E2E con Playwright

- [ ] Paso terminado

Recorre el flujo `/login` → `/dashboard/inspecciones/nueva` →
`/dashboard/mis-inspecciones` → `/realizar` → `/informe`.

**Archivos:** `tests/e2e/login.spec.ts`, `tests/e2e/flujo-inspeccion.spec.ts`.

```text
Explícame qué es una prueba E2E con Playwright y cómo escribir la primera
(login) paso a paso, con un ejemplo distinto a mi app.
```

### F8.3 Despliegue en Vercel

- [ ] Paso terminado

Despliega con variables de entorno separadas, y termina el README y los manuales.

```text
Explícame cómo desplegar Next.js en Vercel conectado a Supabase, qué
variables de entorno configuro allá y cómo verifico que la service_role no
quedó expuesta.
```

---

## Estructura final del proyecto

Así debe verse tu carpeta al terminar. Incluye frontend, backend (API) y base
de datos, porque todo vive en el mismo repositorio.

```text
Inmocheck/
├── docs/
│   ├── especificacion/              ← tus 2 documentos del proyecto
│   ├── plan/                        ← los 3 archivos del plan
│   ├── prototipo/                   ← el prototipo HTML
│   └── api/
│       ├── openapi.yaml
│       └── postman_collection.json
│
├── supabase/                        ← BASE DE DATOS
│   ├── migrations/                  ← SQL versionado: tablas, índices, RLS, funciones
│   ├── seed.sql                     ← datos de prueba inventados
│   └── tests/                       ← pruebas de RLS
│
├── src/
│   ├── app/                         ← RUTAS (cada carpeta = parte de la URL)
│   │   ├── layout.tsx               ← layout raíz: fuente, <html>, <body>
│   │   ├── globals.css              ← Tailwind + tokens de diseño
│   │   ├── page.tsx                 ← "/" → redirige a /login
│   │   ├── not-found.tsx            ← 404
│   │   ├── 403/page.tsx             ← /403
│   │   │
│   │   ├── (public)/                ← sin sesión (no sale en la URL)
│   │   │   ├── layout.tsx           ← tarjeta centrada, sin menú
│   │   │   ├── login/page.tsx
│   │   │   └── recuperar-contrasena/page.tsx
│   │   ├── auth/
│   │   │   └── actualizar-contrasena/page.tsx
│   │   │
│   │   ├── (dev)/                   ← solo desarrollo; borrar al entregar
│   │   │   └── sistema-de-diseno/page.tsx
│   │   │
│   │   ├── (protected)/             ← exige sesión (no sale en la URL)
│   │   │   ├── layout.tsx           ← verifica sesión, rol y cuenta activa
│   │   │   └── dashboard/
│   │   │       ├── layout.tsx       ← menú lateral + navegación inferior
│   │   │       ├── page.tsx         ← /dashboard (admin) o redirige al inspector
│   │   │       ├── mis-inspecciones/page.tsx
│   │   │       ├── inmuebles/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── loading.tsx
│   │   │       │   ├── error.tsx
│   │   │       │   ├── nuevo/page.tsx
│   │   │       │   └── [id]/
│   │   │       │       ├── layout.tsx         ← encabezado + pestañas
│   │   │       │       ├── page.tsx           ← Resumen
│   │   │       │       ├── editar/page.tsx
│   │   │       │       ├── inventario/page.tsx
│   │   │       │       └── historial/page.tsx
│   │   │       ├── propietarios/page.tsx
│   │   │       ├── inspectores/page.tsx
│   │   │       ├── inspecciones/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── nueva/page.tsx
│   │   │       │   └── [id]/
│   │   │       │       ├── page.tsx           ← detalle (cambia según el rol)
│   │   │       │       ├── realizar/page.tsx
│   │   │       │       ├── comparar/page.tsx
│   │   │       │       └── informe/page.tsx
│   │   │       ├── informes/page.tsx
│   │   │       └── configuracion/page.tsx
│   │   │
│   │   └── api/v1/                  ← BACKEND: endpoints REST (ver plan backend)
│   │       ├── auth/ …
│   │       ├── propietarios/ …
│   │       ├── inspectores/ …
│   │       ├── inmuebles/ …
│   │       ├── espacios/ …
│   │       ├── elementos/ …
│   │       ├── inspecciones/ …
│   │       ├── evidencias/ …
│   │       ├── informes/ …
│   │       ├── dashboard/ …
│   │       └── auditoria/ …
│   │
│   ├── components/                  ← piezas reutilizables en TODA la app
│   │   ├── ui/                      ← Boton, Badge, Campo, Tarjeta, Aviso,
│   │   │                               Tabla, PanelLateral, EstadoElemento,
│   │   │                               SelectorEstado
│   │   └── layout/                  ← MenuLateral, NavegacionInferior,
│   │                                   EncabezadoPagina, Pestanas
│   │
│   ├── features/                    ← piezas de UN módulo concreto
│   │   ├── auth/components/         ← FormularioLogin, FormularioRecuperar…
│   │   ├── inmuebles/components/    ← TablaInmuebles, FormularioInmueble…
│   │   ├── inventario/components/   ← ArbolInventario, FilaElemento…
│   │   ├── personas/components/     ← TablaPropietarios, PanelInspector…
│   │   ├── inspecciones/components/ ← TablaInspecciones, AccionesAdmin…
│   │   │   └── realizar/            ← ProgresoInspeccion, ListaEspacios,
│   │   │                               TarjetaElemento, FotosElemento
│   │   ├── informes/components/     ← VistaInforme, ListaVersiones…
│   │   └── dashboard/components/    ← Indicadores, ProximasInspecciones…
│   │
│   ├── schemas/                     ← esquemas Zod compartidos (front + API)
│   ├── server/                      ← SOLO servidor: nunca se importa en el navegador
│   │   ├── auth/require-role.ts
│   │   ├── http/problem.ts
│   │   ├── services/                ← reglas de negocio
│   │   ├── repositories/            ← consultas a Supabase
│   │   └── pdf/                     ← plantilla del informe
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            ← cliente del navegador
│   │   │   └── server.ts            ← cliente del servidor (cookies)
│   │   ├── api/client.ts            ← función para llamar a /api/v1
│   │   ├── constantes.ts            ← límites (8 fotos, 10 MB), textos de estado
│   │   └── formato.ts               ← fechas en hora de Bogotá, números
│   ├── types/                       ← tipos compartidos (y los generados de Supabase)
│   └── middleware.ts                ← en Next.js 16: proxy.ts
│
├── tests/
│   ├── unit/                        ← Vitest
│   └── e2e/                         ← Playwright
│
├── public/                          ← favicon, logo
├── .env.example                     ← nombres de variables, sin valores
├── .env.local                       ← tus valores reales (NO se sube a GitHub)
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

### Cómo decidir dónde va cada archivo

- **¿Es una pantalla con URL?** → `src/app/.../page.tsx`, y que sea corto:
  carga datos y arma componentes.
- **¿Se usa en varios módulos?** (un botón, una tabla) → `src/components/`.
- **¿Solo sirve para un módulo?** (el formulario de inmueble) → `src/features/<módulo>/components/`.
- **¿Valida datos?** → `src/schemas/`.
- **¿Toca la base de datos o usa secretos?** → `src/server/`, nunca en un componente cliente.
- **¿Es una utilidad pequeña?** (formatear una fecha) → `src/lib/`.

**Convención de nombres:**

- carpetas de rutas en minúsculas con guiones: `mis-inspecciones`;
- componentes en PascalCase: `TarjetaElemento.tsx`;
- funciones y variables en camelCase: `crearInmueble`.
