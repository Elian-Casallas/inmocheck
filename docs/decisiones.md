# Decisiones

| Fecha | Decisión | Por qué |
|---|---|---|
| 2026-10-03 | ~~Next.js con API BFF en `app/api/v1`, sin backend aparte~~ (reemplazada el 2026-11-20) | Un solo proyecto y un solo despliegue; la API valida sesión y rol antes de tocar la base |
| 2026-10-03 | Supabase (PostgreSQL, Auth, Storage) en vez de Spring Boot + MySQL (sigue vigente para los datos; el back pasa a Spring Boot el 2026-11-20) | Auth, RLS y archivos privados listos; permite terminar el MVP en el tiempo del diplomado |
| 2026-10-03 | Capas ruta → servicio → repositorio | La ruta solo valida y responde, el servicio aplica reglas y el repositorio solo consulta |
| 2026-10-03 | RLS en todas las tablas por organización y rol | La base es la última barrera: aunque falle el código, nadie ve datos de otra inmobiliaria |
| 2026-10-03 | Cambios de estado de inspección solo con funciones SQL y campo `version` | Evita saltarse transiciones y que dos personas sobrescriban el mismo dato |
| 2026-10-03 | Borrado lógico (`activo = false`) | Desactivar un inmueble o inspector no borra el historial |
| 2026-10-03 | Detalles con copia del nombre del espacio y del elemento | El acta y la comparación no cambian si luego se edita el inventario |
| 2026-10-03 | Zod compartido entre formulario y API | Una sola fuente de validación y mensajes en español |
| 2026-10-03 | Filtros y paneles en la URL (`?search=`, `?ver=ID`) | Se pueden recargar, compartir por enlace y el botón "atrás" funciona |
| 2026-10-03 | Fotos en buckets privados con enlaces firmados de 60 s | Las evidencias nunca quedan con un enlace público permanente |
| 2026-10-03 | Errores en formato `application/problem+json` | Respuesta uniforme que el front traduce a mensajes claros |
| 2026-10-03 | `organizacion_id` y RLS desde el inicio, aunque la demo use pocas inmobiliarias | Permite demostrar el aislamiento y evita rediseñar la seguridad después |
| 2026-10-03 | Invitación de inspectores con la API Admin de Supabase | El correo con el enlace lo envía Supabase y no hay registro público |
| 2026-10-03 | PDF con `@react-pdf/renderer` en Node, generado al pedirlo | Compatible con Vercel; si llega a tardar, se pasaría a un proceso en segundo plano |
| 2026-10-03 | Comparación calculada al momento, sin tabla propia | Los detalles con copia del nombre ya tienen todo lo necesario |
| 2026-10-03 | Modo sin conexión y firmas fuera del MVP | Que se use en el celular no implica que funcione sin internet, y las firmas requieren revisión jurídica |
| 2026-10-08 | Fotos reducidas a 1600 px en el celular antes de subirlas | Ahorra datos y tiempo en la visita |
| 2026-10-08 | Plazo para iniciar: hasta las 7:00 p. m. del día programado | Una visita no hecha a tiempo queda "No realizada" y el admin la reprograma |
| 2026-10-08 | No programar en fechas cuyo plazo ya pasó | Evita crear inspecciones que nacen vencidas |
| 2026-11-14 | Los commits del proyecto son por etapa, no por tarea; desde ahora, un commit por tarea | El código se escribió antes de conocer el ciclo SDD (tarea → probar → commit → marcar [x]); la "regla de oro" aplica a todo cambio nuevo |
| 2026-11-14 | No se hicieron variantes `/prototipo/a, b, c`; el prototipo HTML cumplió ese papel | Las 22 pantallas se diseñaron y revisaron con las 5 reglas antes de programarlas (`docs/diseno/pantallas.md`) |
| 2026-11-14 | Front y back construidos juntos, sin fase de datos mock | El BFF y Supabase existieron desde el inicio, así que el front consumió datos reales |
| 2026-11-14 | Integrar `documentos/` al SDD resumiendo y enlazando, sin copiarlo entero | Los documentos originales siguen siendo la fuente ampliada; `docs/` es el índice que lee el agente |
| 2026-11-14 | **Supuesto:** las fechas de esta tabla salen del historial de git | Los docs SDD se escribieron después del código (SDD inverso) |
| 2026-10-03 | Prototipo HTML de 22 pantallas antes del código, con 5 reglas de diseño | Validar el flujo y el estilo sin backend; cumple el papel de las "variantes" de la guía |
| 2026-10-03 | Pasar los tokens del prototipo (`styles.css`) a `@theme` de Tailwind | Mismos colores y medidas en el prototipo y en la app |
| 2026-11-14 | **Supuesto:** la pantalla de referencia es Realizar inspección (y, para el admin, Inmuebles) | Es el núcleo del MVP y la única pantalla funcional del prototipo |
| 2026-11-14 | **Supuesto:** las métricas de "Cómo sabremos que funciona" son objetivos razonables | El código no define métricas de uso |
| 2026-11-14 | **Supuesto:** la tipografía es Inter, no una de las propuestas de la guía | Es la que carga `app/layout.tsx` |
| 2026-11-14 | **Supuesto:** los criterios de las specs se dedujeron del código, la especificación y el README, sin recorrerlos en el navegador | La regla de la sesión fue no ejecutar la app; se marcan al verificarlos |
| 2026-11-14 | **Supuesto:** las tareas se agruparon por unidad del diplomado (Front U3, Back U4, Pruebas U5, Nube U6) según los commits | El proyecto se hizo por etapas, no tarea por tarea |

## Backend propio en AWS (2026-11-20)
El docente pidió que el proyecto tenga un **backend propio desplegado en AWS**. Se eligió la **opción A**: Spring Boot reemplaza el BFF de Next.js y Supabase se queda como base de datos, Auth y Storage.

| Fecha | Decisión | Por qué |
|---|---|---|
| 2026-11-20 | Backend en **Spring Boot 4.1 + Java 21**, en la carpeta `backend/` del mismo repositorio | Es el stack del diplomado y cumple el pedido de un backend propio; un solo repositorio mantiene juntos el SDD, el front y el back. Se usa la 4.1 y no la 3 porque la 3.5 ya no tiene soporte y es la misma versión de los otros proyectos del curso |
| 2026-11-20 | Las dependencias entran con la tarea que las usa: Security y OAuth2 en la 5.3, JDBC y el driver de PostgreSQL en la 5.4 | Con Security sin configurar, la salud respondería 401; con JDBC sin base, la app no arrancaría |
| 2026-11-20 | Supabase se mantiene: PostgreSQL (con RLS y funciones SQL), Auth y Storage | No se rehacen el esquema, la seguridad ni las funciones de estado que ya están probadas (`supabase/tests/rls.sql`) |
| 2026-11-20 | Spring respeta **el mismo contrato** `docs/contratos/api.md` (rutas, cuerpos, códigos y `problem+json`) | El front casi no cambia y la colección de Postman sirve para comprobar que Spring hace lo mismo que el BFF |
| 2026-11-20 | Next.js **reenvía** `/api/v1/*` a Spring con un proxy (`app/api/v1/[...ruta]/route.ts`) que agrega `Authorization: Bearer <token de la sesión>` | El navegador sigue llamando a su propio dominio: sin CORS, y las cookies de sesión no salen de Vercel |
| 2026-11-20 | Spring valida el **JWT de Supabase Auth** como OAuth2 Resource Server (llaves públicas JWKS del proyecto) | No se duplican usuarios ni contraseñas; el rol y la organización siguen saliendo de `perfiles`, nunca del cuerpo |
| 2026-11-20 | Login, logout, recuperar y cambiar contraseña **se quedan en Next.js** | Esas rutas crean y borran las cookies de la sesión, que viven en el dominio del front; `GET /auth/me` sí pasa a Spring |
| 2026-11-20 | Acceso a datos con **JDBC (`JdbcClient`)**, no JPA. Cada petición abre una transacción que hace `set local role authenticated` y fija `request.jwt.claims` con el token del usuario | Así **RLS y `auth.uid()` siguen funcionando** y las funciones SQL se llaman igual que hoy. Con JPA y un usuario de base con todos los permisos, RLS dejaría de proteger |
| 2026-11-20 | Conexión a la base por el **pooler de sesión de Supabase** (IPv4, puerto 5432) | La conexión directa de Supabase es solo IPv6 y AWS usa IPv4 por defecto; el modo sesión permite `set local` y sentencias preparadas sin trucos |
| 2026-11-20 | Fotos, PDF e invitaciones con las **API REST de Supabase** (Storage y Auth Admin) usando `SUPABASE_SERVICE_ROLE_KEY`, siempre después de autorizar | Igual que hoy; la llave vive solo en las variables de entorno de AWS |
| 2026-11-20 | PDF del acta con **OpenPDF** en Java | `@react-pdf/renderer` es de Node y no corre en la JVM |
| 2026-11-20 | Validación con **Bean Validation** y errores con `ProblemDetail` de Spring (RFC 9457) más `code` y `errors` | Mismo formato de error; Zod queda solo en los formularios del front, con los mismos mensajes en español |
| 2026-11-20 | Las páginas (Server Components) leen de Spring con un cliente de servidor (`lib/api/servidor.ts`) en vez de importar `server/services` | Si no, el front seguiría saltándose el backend con su propio acceso a Supabase |
| 2026-11-20 | Despliegue en **AWS Elastic Beanstalk** (plataforma Java 21, una instancia) con HTTPS; el front sigue en Vercel | Es la forma más simple de subir un `.jar` a AWS y cabe en la capa gratuita; el HTTPS es obligatorio porque viaja el token |
| 2026-11-20 | Migración **por módulos**: el proxy manda a Spring solo los módulos ya migrados y el resto sigue en el BFF hasta que se borre | La app nunca queda rota y cada módulo se prueba de punta a punta antes de seguir |
| 2026-11-20 | El proyecto de Supabase firma los JWT de usuario con una llave asimétrica **ES256**, publicada en `/auth/v1/.well-known/jwks.json` | Verificado en la tarea 5.1. Spring valida con JWKS y no necesita guardar ningún secreto de JWT |
| 2026-11-20 | "Backend propio" permite seguir usando Supabase como base de datos | El docente aprobó la opción A el 2026-11-20 |
| 2026-11-20 | Armar el `Actor` desde `perfiles` pasa de la 5.3 a la 5.4 | Leer `perfiles` necesita la base y la transacción con RLS, que llegan en la 5.4 |
| 2026-11-20 | Los errores usan un `record Problema` propio en vez del `ProblemDetail` de Spring | Así el JSON tiene exactamente los campos del BFF (`type, title, status, detail, instance, code, traceId, errors`) y el front no nota el cambio |
| 2026-11-20 | El token debe tener firma ES256 válida, `exp` vigente, `iss` = `SUPABASE_URL/auth/v1` y `aud` = `authenticated` | Rechaza tokens vencidos, de otro proyecto de Supabase o la llave anónima; si falta `SUPABASE_URL`, la app no arranca |
| 2026-11-20 | En local, Spring lee las variables de `backend/.env` (plantilla en `backend/.env.example`) | Mismo patrón que `.env.local` del front; en AWS se usan las variables del entorno |
| 2026-11-20 | El `Actor` llega a los controllers como parámetro (`ActorResolver`) y el rol se exige con `actor.exigirRol(...)`, no con una anotación | Es explícito, se prueba fácil y equivale a `requireRole` del BFF |
| 2026-11-20 | La consulta del perfil usa `left join` con `organizaciones` | A un usuario desactivado RLS le oculta su organización; con `join` normal respondería 401 en vez de `403 CUENTA_INACTIVA` |
| 2026-11-20 | La base no cuenta para `/actuator/health` | Si Supabase falla, reiniciar el servidor en AWS no lo arregla; la salud solo dice si la app está viva |
| 2026-11-20 | Pool de 5 conexiones | El pooler del plan gratuito de Supabase admite pocas conexiones |
| 2026-11-20 | Las pruebas sin base usan el perfil `test`; la prueba de aislamiento usa la base real y se salta si `backend/.env` no tiene `SUPABASE_DB_URL` | La seguridad de los datos se prueba contra el RLS real, sin simularlo |
| 2026-11-20 | Un id de la ruta que no es UUID responde `404`; un parámetro de búsqueda mal escrito, `400` | Igual que `validarId()` del BFF: un id inválido no puede existir y no se revela nada |
| 2026-11-20 | Se agrega `405 METHOD_NOT_ALLOWED`, que el BFF no tenía | Spring distingue el método equivocado de la ruta inexistente; antes ambos caían en 404 o 500 |
| 2026-11-20 | Idioma fijo en español (`spring.web.locale: es`) | Los mensajes de validación sin texto propio salen en español también en AWS, cuyo sistema está en inglés |
| 2026-11-20 | Los límites (página 20/100, foto 10 MB) van en `comun/Limites.java` | Equivale a `lib/constantes.ts`; nada de números mágicos. El tamaño máximo de subida de Spring se configura en la 5.15 |
| 2026-11-20 | Las respuestas usan DTOs (`PerfilActual`), nunca el `Actor` directo; un recurso suelto va en `{ data }` (`Datos<T>`) | El `Actor` guarda el token del usuario y no debe salir en ninguna respuesta |
| 2026-11-20 | La protección CSRF (chequeo de `Origin`) vive en el proxy de Next.js | El navegador manda las cookies solo; Spring recibe un token y no puede saber que la petición nació con cookies de otro sitio |
| 2026-11-20 | El proxy rechaza los segmentos `.` y `..` | Una petición armada a mano como `/auth/me/../../actuator` saldría de `/api/v1` al llegar a Spring |
| 2026-11-20 | Migrar un módulo = agregarlo a `MODULOS_EN_SPRING` y borrar sus `route.ts` del BFF | En Next.js una ruta específica le gana al catch-all; la lista evita reenviar a ciegas lo que aún no existe en Spring |
| 2026-11-20 | El proxy lee el token con `getSession()` y no con `getUser()` | `proxy.ts` ya valida y refresca la sesión en cada petición, y Spring verifica la firma del token; evita una llamada extra a Supabase Auth |
| 2026-11-20 | Las páginas obtienen el actor de Spring (`exigirActor()` → `GET /auth/me`); `requireActor()` de las rutas del BFF sigue leyendo de Supabase hasta la 5.21 | Es el único módulo que ya existe en Spring y lo usan todas las páginas; las rutas del BFF desaparecen con su módulo |
| 2026-11-20 | `leerDeSpring()` va directo a Spring desde el servidor de Next.js, sin pasar por el proxy | El proxy existe para el navegador (cookies y CSRF); en el servidor ya se tiene el token |
| 2026-11-20 | `app/error.tsx` con `retry()` para errores del layout protegido | `dashboard/error.tsx` no envuelve el layout que está encima; sin Spring se veía la pantalla genérica de Next.js en inglés |
| 2026-11-20 | Los PATCH leen el cuerpo como JSON crudo con `CuerpoParcial` | En Jackson 3 un campo ausente y un `null` explícito llegan igual a un record; en un PATCH hay que distinguir "no tocar" de "borrar" |
| 2026-11-20 | Un campo desconocido en el JSON responde `422` (`fail-on-unknown-properties`) | Igual que `.strict()` de Zod: nadie cuela `organizacionId` ni otros datos que el servidor no espera |
| 2026-11-20 | La búsqueda escapa `%`, `_` y `\` en `ILIKE` | Buscar "50%" encuentra "50%" y no todo; el BFF quitaba algunos de esos caracteres en vez de escaparlos |
| 2026-11-20 | Las pruebas de integración usan la base real con `@Transactional` (se deshacen al terminar) y no la colección de Postman por módulo | Postman es un recorrido que crea datos de verdad en el mismo Supabase de producción; se corre completo en la 5.20 |
| 2026-11-20 | Hikari reintenta la primera conexión (`initialization-fail-timeout: -1`) y Java no recuerda búsquedas de DNS fallidas (`networkaddress.cache.negative.ttl=0`) | La primera conexión de un Spring recién arrancado a veces fallaba por DNS en la red local y rompía la petición; ahora se reintenta sola |
| 2026-11-20 | Las opciones de propietario del formulario de inmueble siguen en el BFF hasta la 5.10 | No hay endpoint de opciones en el contrato; se decide junto con Inmuebles |
| 2026-11-20 | Las opciones de los `<select>` (propietarios del inmueble, inmuebles al programar) se arman leyendo TODAS las páginas del listado (`leerTodasLasPaginas`) | El contrato no tiene endpoints de opciones y no se agregan; así tampoco se cortan en 100, como pasaba con los inmuebles en el BFF |
| 2026-11-20 | El conteo de "inmuebles activos" del encabezado sale de `GET /inmuebles?activo=true&pageSize=1` (`meta.total`) | No hace falta un endpoint de conteo |
| 2026-11-20 | Los errores de la base se traducen buscando el SQLSTATE (`ErroresSql`): `23505` → `CODIGO_INMUEBLE_DUPLICADO`, `23503` → `PROPIETARIO_INVALIDO` | Igual que el BFF; la base garantiza la regla y el servicio solo traduce. Un propietario de otra inmobiliaria también cae en `23503` por la llave compuesta |
| 2026-11-20 | Un valor del tipo equivocado dentro del JSON (texto donde va número, enum que no existe, `2.5` habitaciones) responde `422` con el campo | Igual que Zod; antes Spring lo trataba como JSON roto (`400`) |
| 2026-11-21 | En los PATCH de espacios y elementos un `null` explícito es un error (`422`) | Igual que Zod: esos campos son opcionales pero no se pueden borrar; un espacio sin nombre u orden no tiene sentido |
| 2026-11-21 | El inventario reutiliza `InmueblesRepository.buscar` para comprobar que el inmueble es visible antes de listar o crear | Igual que el BFF: si RLS oculta el inmueble, se responde `404` sin revelar que existe |
| 2026-11-21 | Los errores por campo repetidos (mismo campo y mensaje) se envían una sola vez | Un texto vacío falla dos reglas con el mismo mensaje (`@NotBlank` y `@Size`); el formulario no debe mostrarlo dos veces |
