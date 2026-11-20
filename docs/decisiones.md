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
| 2026-11-20 | **Supuesto:** el proyecto de Supabase firma los JWT con llaves asimétricas (JWKS). Si usa el secreto HS256 antiguo, Spring valida con `SUPABASE_JWT_SECRET` | Se confirma en la tarea 5.1 |
| 2026-11-20 | **Supuesto:** "backend propio" permite seguir usando Supabase como base de datos | Se eligió la opción A; falta confirmarlo con el docente |
