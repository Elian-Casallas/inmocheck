# InmoCheck — Plan Backend

Base de datos (Supabase PostgreSQL), seguridad (RLS) y API (`/api/v1` en Next.js).
Antes de cada chat nuevo, pega el **prompt de contexto** de `00-guia-del-plan.md`.

---

## B0 · Preparación

### B0.1 Repositorio y proyecto Supabase

- [x] Paso terminado

Crea el repositorio en GitHub, el proyecto en Supabase y un archivo `.env.local`
con la URL y la clave pública (`anon`). Agrega `.env.local` al `.gitignore` y
crea un `.env.example` sin valores.

**Listo cuando:** el repo existe y ningún secreto está subido a GitHub.

```text
Explícame la diferencia entre la clave anon y la clave service_role de
Supabase, cuál puede ir en el navegador y cuál nunca, y cómo organizo mis
variables de entorno en Next.js (.env.local, .env.example, NEXT_PUBLIC_).
```

### B0.2 Migraciones versionadas

- [x] Paso terminado

Instala Supabase CLI y aprende a crear migraciones, para que tu SQL quede
guardado en `supabase/migrations/` y no solo en el editor web.

**Listo cuando:** creas una migración de prueba y la aplicas.

```text
Explícame qué es una migración de base de datos y por qué es mejor que
escribir SQL directo en el editor de Supabase. Dame los comandos básicos de
Supabase CLI para crear y aplicar una migración, con una explicación de cada uno.
```

---

## B1 · Base de datos

### B1.1 Tipos enumerados

- [x] Paso terminado

Crea los `enum`: rol, tipo de inspección, estado de inspección y estado de
elemento. Tu documento técnico ya los tiene definidos.

**Listo cuando:** existen los 4 tipos en la base de datos.

```text
Explícame qué es un ENUM en PostgreSQL, cuándo conviene usarlo frente a una
tabla de catálogo, y qué problema tendría si luego quiero agregar un valor.
No escribas mis enums; déjame hacerlos y luego los reviso contigo.
```

### B1.2 Tablas núcleo

- [x] Paso terminado

Crea `organizaciones`, `perfiles`, `personas` e `inmuebles`, con UUID, llaves
foráneas y `UNIQUE(organizacion_id, codigo)`.

**Listo cuando:** no puedes insertar dos inmuebles con el mismo código en la
misma organización.

```text
Voy a crear las tablas organizaciones, perfiles, personas e inmuebles.
Explícame: cómo se relaciona perfiles con auth.users, por qué un UNIQUE
compuesto (organizacion_id, codigo) y no solo codigo, y por qué NO debo usar
ON DELETE CASCADE aquí. Luego revisa mi SQL: [pega].
```

### B1.3 Inventario

- [x] Paso terminado

Crea `espacios` y `elementos`, con `orden`, `obligatorio` y `activo`.

**Listo cuando:** puedes cargar la cocina con sus 5 elementos.

```text
Explícame por qué los elementos se desactivan (activo = false) en lugar de
borrarse, y cómo eso protege el historial de inspecciones. Revisa mi SQL de
espacios y elementos: [pega].
```

### B1.4 Inspecciones y detalles

- [x] Paso terminado

Crea `inspecciones` (con la columna `version`) y `detalles_inspeccion`, con los
campos de copia histórica (*snapshot*): nombre del espacio, nombre del elemento
y si es obligatorio.

**Listo cuando:** entiendes y puedes explicar para qué sirve cada columna snapshot.

```text
Explícame con un ejemplo cotidiano qué es un "snapshot" histórico y por qué
detalles_inspeccion guarda el nombre del elemento aunque ya exista
elemento_id. Explícame también para qué sirve la columna version (control de
concurrencia optimista).
```

### B1.5 Evidencias, informes y auditoría

- [x] Paso terminado

Crea las tres tablas restantes y los índices de búsqueda.

**Listo cuando:** están las 11 tablas y los índices del documento técnico.

```text
Explícame qué es un índice, cómo decido qué columnas indexar según las
búsquedas de mi app (organización, estado, fecha) y cómo compruebo con
EXPLAIN que se está usando. Revisa mis índices: [pega].
```

### B1.6 Datos de prueba (seed)

- [x] Paso terminado

Crea `seed.sql` con 2 organizaciones, un administrador y 2 inspectores en cada
una, y algunos inmuebles. Usa datos inventados.

**Listo cuando:** puedes reiniciar la base y quedan datos listos para probar.

```text
Explícame cómo funciona seed.sql en Supabase y por qué conviene tener DOS
organizaciones en los datos de prueba para probar la seguridad.
```

---

## B2 · Seguridad (la fase más importante)

### B2.1 Funciones de ayuda para RLS

- [x] Paso terminado

Crea funciones como `mi_organizacion()` y `mi_rol()`, que leen el perfil de
quien está conectado.

**Listo cuando:** `select mi_rol();` devuelve el rol correcto al probar con un usuario.

```text
Explícame qué es Row Level Security con un ejemplo sencillo, qué hace
auth.uid(), y por qué conviene crear funciones de ayuda como mi_organizacion().
Explícame también los riesgos de SECURITY DEFINER y qué es search_path.
```

### B2.2 Políticas por tabla

- [x] Paso terminado

Activa RLS en todas las tablas y escribe las políticas:

- el administrador ve todo lo de su organización;
- el inspector ve solo lo asignado.

**Listo cuando:** un usuario de la organización A no ve nada de la B (criterio CA-14).

```text
Voy a escribir las políticas RLS de inmuebles: el admin hace todo en su
organización y el inspector solo ve los inmuebles de sus inspecciones
asignadas. Explícame la diferencia entre USING y WITH CHECK y dame pistas
para la política del inspector. Luego revisa las mías: [pega].
```

### B2.3 Probar la seguridad

- [x] Paso terminado

Prueba con varios usuarios: inspector no asignado, otra organización y cuenta
desactivada.

**Listo cuando:** tienes una lista de pruebas con su resultado esperado y real.

```text
Ayúdame a diseñar una lista de pruebas para mis políticas RLS: qué usuario,
qué intenta hacer y qué debería pasar. No las ejecutes por mí; dame la
estructura y yo la completo.
```

---

## B3 · Capa del servidor en Next.js

### B3.1 Clientes de Supabase

- [x] Paso terminado

Crea `lib/supabase/server.ts` y `lib/supabase/client.ts` con el paquete `@supabase/ssr`.

**Listo cuando:** un Server Component lee datos respetando la sesión.

```text
Explícame por qué Next.js necesita dos clientes de Supabase distintos
(servidor y navegador), cómo viajan las cookies de sesión y qué es el
middleware que refresca la sesión.
```

### B3.2 Identidad y permisos

- [x] Paso terminado

Crea `requireRole()`: obtiene el usuario de la sesión, lee su perfil, bloquea las
cuentas inactivas y comprueba el rol.

**Listo cuando:** una ruta de administrador responde 403 a un inspector.

```text
Quiero escribir una función requireRole('ADMIN') para mis Route Handlers.
Explícame qué pasos debe seguir y por qué NUNCA debo confiar en un rol o un
organizacionId que venga del body. Dame pseudocódigo, no el código final.
```

### B3.3 Errores uniformes

- [x] Paso terminado

Crea `toProblem()`, que convierte cualquier error (de Zod, de negocio o
inesperado) en una respuesta `problem+json` con el código HTTP correcto.

**Listo cuando:** todos tus errores tienen la misma forma.

```text
Explícame el formato problem+json (RFC 9457) y cómo diseñar clases de error
propias (NotFoundError, ConflictError) para mapearlas a 404 y 409. Dame un
ejemplo con un caso distinto al mío, por ejemplo una biblioteca.
```

### B3.4 Esquemas compartidos

- [x] Paso terminado

Crea la carpeta `schemas/` con los esquemas Zod de cada entidad y sus tipos (`z.infer`).

**Listo cuando:** el mismo esquema valida la API y el formulario.

```text
Explícame cómo usar un mismo esquema Zod en el frontend (React Hook Form) y
en el backend (Route Handler), qué hace .strict() y por qué es importante
rechazar campos extra.
```

---

## B4 · Módulos de gestión

### B4.1 Propietarios (tu primer CRUD completo)

- [x] Paso terminado

Crea `GET` y `POST /api/v1/propietarios`, y `GET` y `PATCH` por id. Sigue el
camino: handler → servicio → repositorio.

**Listo cuando:** lo pruebas en Postman con éxito y también con errores.

```text
Voy a hacer mi primer CRUD: propietarios. Explícame la separación en
route handler → servicio → repositorio, qué va en cada uno y por qué. Luego
revisa mi código del POST: [pega].
```

### B4.2 Inmuebles con búsqueda y paginación

- [x] Paso terminado

Construye el listado con `search`, `activo`, `page` y `pageSize`, más crear,
editar y desactivar.

**Listo cuando:** el código duplicado responde 409 (CA-05) y desactivar conserva
el historial (CA-13).

```text
Explícame cómo implementar paginación y búsqueda con Supabase (range, ilike,
count) y cómo validar los parámetros de la URL con Zod. ¿Por qué no debo
meter el parámetro sort directamente en la consulta?
```

### B4.3 Inventario

- [x] Paso terminado

Construye los endpoints de espacios y elementos.

**Listo cuando:** agregar un elemento no cambia las inspecciones ya creadas.

```text
Voy a hacer los endpoints de espacios y elementos. Explícame cómo validar
que un espacio pertenece a un inmueble de MI organización antes de agregarle
elementos, y revisa mi servicio: [pega].
```

### B4.4 Invitar inspectores

- [ ] Paso terminado

Usa la API de administración de Supabase (`inviteUserByEmail`) **solo en el
servidor** y crea el perfil con la organización del administrador.

**Listo cuando:** el invitado recibe el correo y entra como inspector.

```text
Explícame cómo funciona invitar usuarios con la API admin de Supabase, por qué
esto obliga a usar la service_role y cómo aislarla para que nunca llegue al
navegador.
```

---

## B5 · Flujo de inspecciones

### B5.1 Crear inspección con snapshot (transacción)

- [ ] Paso terminado

Escribe una función SQL (RPC) que cree la inspección y copie el inventario en
una sola transacción.

**Listo cuando:** si falla la copia, no queda una inspección a medias.

```text
Explícame qué es una transacción con un ejemplo de transferencia bancaria y
por qué crear la inspección y copiar los detalles debe hacerse en una sola
función SQL (RPC) y no en varias llamadas desde Next.js.
```

### B5.2 Iniciar y guardar detalles con versión

- [ ] Paso terminado

Programa la transición Pendiente → En proceso y el `PATCH` de cada detalle con `version`.

**Listo cuando:** una versión vieja responde 409 VERSION_CONFLICT.

```text
Explícame el control de concurrencia optimista con la columna version: qué
problema evita cuando dos pestañas editan lo mismo y cómo se escribe el
UPDATE para detectarlo.
```

### B5.3 Finalizar, cancelar y reasignar

- [ ] Paso terminado

Crea RPC transaccionales que validen los obligatorios, bloqueen la fila, cambien
el estado y registren la auditoría.

**Listo cuando:** no se puede finalizar incompleta (CA-08) ni modificar una
cerrada (CA-10).

```text
Explícame SELECT ... FOR UPDATE, cómo validar dentro de una función SQL que
no queden obligatorios sin evaluar, y cómo devolver un error que mi API
traduzca a 409. Revisa mi función: [pega].
```

---

## B6 · Fotos privadas

### B6.1 Bucket privado y subida validada

- [ ] Paso terminado

Crea el bucket privado con sus políticas. En el endpoint, valida el tipo real,
el tamaño y la cantidad; genera el nombre del archivo y guarda los metadatos.
Si falla guardar los metadatos, borra el archivo.

**Listo cuando:** una foto de más de 10 MB responde 413 y no queda ningún
archivo huérfano.

```text
Explícame cómo funciona Supabase Storage con buckets privados, qué son las
URLs firmadas y por qué debo generar yo el nombre del archivo. ¿Qué es una
"compensación" si falla el insert después de subir la foto?
```

---

## B7 · Comparación, PDF y dashboard

### B7.1 Comparación

- [ ] Paso terminado

Relaciona los detalles de entrada y salida por `elemento_id` y clasifica cada
uno: sin cambio, cambio o no comparable.

**Listo cuando:** comparar inmuebles distintos responde 409.

```text
Explícame cómo comparar dos listas de detalles por elemento_id para obtener
"sin cambio", "cambio" y "no comparable". Dame pseudocódigo y un ejemplo con
datos pequeños, no el código de mi servicio.
```

### B7.2 Informe PDF

- [ ] Paso terminado

Genera el PDF con `@react-pdf/renderer` a partir de los datos copiados en el
snapshot, guárdalo en privado y registra la versión.

**Listo cuando:** si falla el PDF, la inspección sigue finalizada.

```text
Explícame cómo generar un PDF en un Route Handler con @react-pdf/renderer y
por qué el PDF debe construirse desde los snapshots y no desde el inventario
actual.
```

### B7.3 Dashboard

- [ ] Paso terminado

Crea las consultas de conteo filtradas por organización.

**Listo cuando:** los números coinciden con los datos de prueba.

```text
Explícame cómo contar inspecciones por estado en Supabase para una sola
organización y un rango de fechas, y cómo evitar hacer una consulta por
cada número del dashboard.
```

---

## B8 · Pruebas y documentación

### B8.1 Colección de Postman

- [ ] Paso terminado

Arma la colección con los casos API-01 a API-24 de tu documento técnico.

**Listo cuando:** puedes ejecutar la colección completa y ver los resultados.

```text
Explícame cómo organizar una colección de Postman con variables (baseUrl,
ids), cómo conservar la cookie de sesión y cómo escribir un test simple que
verifique el código HTTP de la respuesta.
```

### B8.2 Pruebas unitarias con Vitest

- [ ] Paso terminado

Cubre los esquemas Zod, el cálculo de progreso y la comparación.

**Listo cuando:** `npm test` pasa y cubre esos tres temas.

```text
Explícame qué conviene probar con pruebas unitarias y qué con Postman o E2E
en mi proyecto. Enséñame la estructura de una prueba con Vitest usando un
ejemplo distinto al mío.
```
