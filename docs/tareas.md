# Tareas

> Reconstruidas a partir del historial de commits (SDD inverso). Las secciones siguen las
> unidades del diplomado. En este proyecto el front y el back se construyeron alternados,
> no en unidades separadas. El plan original paso a paso, con sus casillas, está en
> `documentos/Plan/` (F0–F8 frontend, B0–B8 backend).

**Orden que se siguió** (alternando back y front para ver cada módulo de punta a punta):
B0+F0 → B1+B2 → B3+F1+F2 → B4+F3+F4 → B5+F5+F6 → B6 → B7+F7 → B8+F8.
Si el tiempo apretaba, la prioridad era el flujo central: login → inmueble con inventario → programar → realizar con fotos → finalizar → PDF.

## Front (U3)
- [x] 1.1 Layout base con la identidad visual: Inter, tokens de color, menú lateral y navegación inferior
- [x] 1.2 Componentes UI: Boton, Campo, Tabla, Badge, Aviso, PanelLateral, Paginacion y filtros en la URL
- [x] 1.3 F1 · Login, recuperar contraseña y pantallas de los enlaces del correo
- [x] 1.4 F1 · Botón para ver la contraseña y regla de contraseña segura
- [x] 1.5 F2 · Lista de inmuebles con buscador, filtros y paginación
- [x] 1.6 F2 · Formulario de inmueble (nuevo y editar)
- [x] 1.7 F2 · Detalle del inmueble con pestañas: datos, inventario e historial
- [x] 1.8 F2 · Propietarios e inspectores en panel lateral
- [x] 1.9 F2 · Filtro Con/Sin inmuebles en Propietarios (taller M4U2, ver `BITACORA_IA.md`)
- [x] 1.10 F3 · Programar inspección y lista con filtros por estado y tipo
- [x] 1.11 F3 · Mis inspecciones del inspector y aviso de "No realizada"
- [x] 1.12 F4 · Realizar inspección: tarjetas por elemento, autoguardado y progreso
- [x] 1.13 F4 · Fotos por elemento (reducción en el celular, máximo 8)
- [x] 1.14 F4 · Finalizar con validación de obligatorios
- [x] 1.15 F5 · Comparación entrada/salida
- [x] 1.16 F5 · Informe PDF con selección de fotos en cuadrícula
- [x] 1.17 F5 · Biblioteca de informes con buscador, filtro y paginación
- [x] 1.18 Dashboard de resumen para el administrador
- [x] 1.19 Ajustes para celular: tablas como lista y filtros
- [x] 1.20 Títulos por pantalla, ícono propio y carga visible

## Back (U4)
- [x] 2.1 Proyecto Next.js, esqueleto de rutas y clientes de Supabase
- [x] 2.2 Esquema de base de datos (11 tablas) y migraciones versionadas
- [x] 2.3 Políticas RLS por organización y rol
- [x] 2.4 Datos de prueba (`seed.sql`) con dos inmobiliarias
- [x] 2.5 Capa de servidor: sesión, `requireRole`, errores problem+json y respuestas
- [x] 2.6 Auth: login, logout, `me`, recuperar y cambiar contraseña
- [x] 2.7 Propietarios e inspectores (invitación y reenvío de acceso)
- [x] 2.8 Inmuebles: CRUD, filtros, paginación y desactivación
- [x] 2.9 Inventario: espacios y elementos
- [x] 2.10 Inspecciones: crear, iniciar, reasignar, cancelar y finalizar con funciones SQL
- [x] 2.11 Detalles con guardado incremental y control de versión
- [x] 2.12 Evidencias: subida a bucket privado y enlace firmado
- [x] 2.13 Comparación entrada/salida
- [x] 2.14 Informes PDF versionados y descarga firmada
- [x] 2.15 Dashboard (resumen) y auditoría automática
- [x] 2.16 Plazo para iniciar y bloqueo de fechas pasadas

## Pruebas (U5)
- [x] 3.1 Pruebas SQL de RLS entre organizaciones y roles (`supabase/tests/rls.sql`)
- [x] 3.2 Pruebas unitarias con Vitest (esquemas, progreso, comparación, filtro de propietarios)
- [x] 3.3 Colección de Postman ejecutada completa
- [ ] 3.4 Recorrer en el navegador los criterios de aceptación de F1–F5 y marcarlos

## Nube y entrega (U6)
- [x] 4.1 Despliegue en Vercel con variables de entorno (https://inmocheck.vercel.app)
- [x] 4.2 Redirect URLs de Supabase para los enlaces del correo
- [x] 4.3 Manuales del administrador y del inspector
- [x] 4.4 Planos SDD en `docs/` (M4U3)

## Backend propio en Spring Boot + AWS
> Pedido del docente (2026-11-20). Opción A: Spring Boot reemplaza el BFF y Supabase se queda como
> base, Auth y Storage. Diseño: `docs/arquitectura.md`. Decisiones: `docs/decisiones.md`.
> Regla: un módulo a la vez. Un módulo está "hecho" cuando su carpeta de Postman pasa contra Spring
> y el proxy ya lo manda a Spring.

**Base**
- [x] 5.1 Confirmar con el docente que Supabase puede seguir como base de datos (aprobado el 2026-11-20). Firma de los JWT revisada: ES256 con JWKS
- [x] 5.2 Crear `backend/` con Spring Boot 4.1, Java 21 y Maven Wrapper (Web MVC, Actuator, Validation); `GET /actuator/health` responde `UP`
- [x] 5.3 Agregar Security y OAuth2 Resource Server; validar el JWT de Supabase (firma ES256, vencimiento, emisor y audiencia) y responder 401/403 en `problem+json`
- [x] 5.4 Agregar JDBC y el driver de PostgreSQL; armar `Actor` desde `perfiles` (403 `CUENTA_INACTIVA` con la cuenta desactivada); `EjecutorRls`: transacción con `role authenticated` y `request.jwt.claims`; prueba de que un admin de otra organización no ve los datos
- [x] 5.5 `ManejadorErrores` en `problem+json` (400, 401, 403, 404, 405, 409, 413, 415, 422, 500) y `Pagina<T>` con `data` y `meta`
- [x] 5.6 `GET /api/v1/auth/me` en Spring

**Puente con el front**
- [x] 5.7 Proxy `app/api/v1/[...ruta]/route.ts` con una lista de módulos migrados y `BACKEND_URL` (primer módulo: `auth/me`)
- [ ] 5.8 `lib/api/servidor.ts` para que los Server Components lean de Spring

**Módulos** (en cada uno: endpoints, Bean Validation con los mensajes de Zod, pruebas MockMvc, páginas pasadas a `lib/api/servidor.ts`, módulo agregado al proxy y carpeta de Postman pasando)
- [ ] 5.9 Propietarios
- [ ] 5.10 Inmuebles
- [ ] 5.11 Inventario (espacios y elementos)
- [ ] 5.12 Inspectores (invitación y reenvío con Auth Admin)
- [ ] 5.13 Inspecciones (crear, reprogramar, iniciar, reasignar, cancelar)
- [ ] 5.14 Detalles y finalización
- [ ] 5.15 Evidencias (subida multipart a Storage, enlace de 60 s, retiro)
- [ ] 5.16 Comparación entrada/salida
- [ ] 5.17 Informes PDF con OpenPDF y descarga firmada
- [ ] 5.18 Dashboard y auditoría

**Nube y cierre**
- [ ] 5.19 Desplegar en AWS Elastic Beanstalk (Java 21) con HTTPS y variables de entorno
- [ ] 5.20 Configurar `BACKEND_URL` en Vercel y probar en producción el flujo central (login → inmueble → programar → realizar con fotos → finalizar → PDF)
- [ ] 5.21 Borrar el BFF viejo (`server/services`, `server/repositories`, `server/pdf`, `lib/supabase/admin.ts`, rutas migradas) y quitar `SUPABASE_SERVICE_ROLE_KEY` de Vercel
- [ ] 5.22 Actualizar los manuales, el README y `docs/contratos/api.md` (base y autenticación)
