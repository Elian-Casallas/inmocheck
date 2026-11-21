# Contrato de la API · `/api/v1`

> Endpoints tomados de los `route.ts` reales (43 en total). Los cuerpos JSON detallados y
> los ejemplos están en `documentos/InmoCheck_Diseno_Tecnico_REGENERADO.md` (secciones 5 a 7),
> y la colección ejecutable en `documentos/api/postman_collection.json`.

## Convenciones
- **Base:** mismo dominio que el front (`http://localhost:3000/api/v1` en desarrollo). La sesión va en cookies httpOnly de Supabase.
- **Backend (desde 2026-11-20):** el proxy de Next.js reenvía estas rutas a Spring Boot (`BACKEND_URL/api/v1/...`) con `Authorization: Bearer <JWT de Supabase>`. Spring responde exactamente este contrato. `login`, `logout`, `recuperar-contrasena` y `contrasena` se quedan en Next.js porque manejan las cookies.
- **Formato:** JSON. Las fotos se suben como `multipart/form-data`.
- **Métodos:**
  - `GET` lee, `POST` crea o ejecuta una acción, `PATCH` actualiza parcialmente.
  - `DELETE` desactiva (borrado lógico) o retira una foto de un borrador.
  - Las transiciones de estado son acciones `POST` (`/inicio`, `/finalizacion`, `/cancelacion`).
- **Listas:** `?page=1&pageSize=20&search=…` (máximo 100 por página) responden `{ data: [...], meta: { page, pageSize, total, totalPages } }`. Una lista vacía responde `200` con `data: []`, no `404`.
- **Creación:** `201 Created` con cabecera `Location`.
- **Concurrencia:** los cambios de una inspección envían `version`. Si otra persona la cambió antes, responde `409`.
- **Seguridad:**
  - El rol y la organización salen de la sesión.
  - Un recurso de otra organización responde `404`, nunca `403`, para no revelar que existe.

## Errores (`application/problem+json`, RFC 9457)
```json
{ "title": "La inspección está incompleta", "status": 409,
  "detail": "Hay 2 elementos obligatorios sin evaluar.", "code": "INSPECCION_INCOMPLETA",
  "errors": [{ "field": "estado", "message": "Selecciona un estado." }] }
```
| HTTP | Cuándo |
|---|---|
| 400 | JSON, UUID o parámetro mal formado |
| 401 | Sin sesión o sesión vencida |
| 403 | Con sesión, pero el rol no tiene permiso |
| 404 | No existe o es de otra organización |
| 409 | Código duplicado, transición no permitida, conflicto de versión, inspección incompleta |
| 413 / 415 | Foto demasiado grande o de un tipo no permitido |
| 422 | El JSON no cumple el esquema Zod (`errors` por campo) |
| 500 / 503 | Error inesperado o servicio no disponible (sin SQL ni stack trace) |

## Endpoints
A = administrador · I = inspector asignado · A/I = ambos, cada uno en su ámbito.

### Autenticación y cuenta
| Método | Ruta | Actor | Qué hace |
|---|---|---|---|
| POST | `/auth/login` | Público | `{email,password}` inicia sesión en cookies |
| POST | `/auth/logout` | A/I | Cierra la sesión |
| GET | `/auth/me` | A/I | Perfil, rol y organización actuales |
| POST | `/auth/recuperar-contrasena` | Público | `{email}` envía el enlace; siempre responde lo mismo |
| PUT | `/auth/contrasena` | A/I | Cambia la contraseña (también desde el enlace del correo) |

### Personal y propietarios
| Método | Ruta | Actor | Qué hace |
|---|---|---|---|
| GET | `/inspectores` | A | Lista paginada con búsqueda |
| POST | `/inspectores/invitaciones` | A | `{nombre,email}` invita por correo |
| PATCH | `/inspectores/{id}` | A | `{nombre?,activo?}` edita o desactiva |
| POST | `/inspectores/{id}/acceso` | A | Reenvía el enlace de acceso |
| GET / POST | `/propietarios` | A | Lista (`?search=&inmuebles=con\|sin`) / crea |
| GET / PATCH | `/propietarios/{id}` | A | Consulta / edita |

### Inmuebles e inventario
| Método | Ruta | Actor | Qué hace |
|---|---|---|---|
| GET / POST | `/inmuebles` | A/I · A | Lista con `search, tipo, activo, sort` / crea |
| GET / PATCH / DELETE | `/inmuebles/{id}` | A/I · A · A | Consulta / edita / desactiva (`204`) |
| GET | `/inmuebles/{id}/historial` | A/I | Inspecciones del inmueble |
| GET / POST | `/inmuebles/{id}/espacios` | A/I · A | Espacios con sus elementos / crea un espacio |
| PATCH | `/espacios/{id}` | A | `{nombre?,orden?,activo?}` |
| POST | `/espacios/{id}/elementos` | A | `{nombre,obligatorio,orden?}` |
| PATCH | `/elementos/{id}` | A | `{nombre?,obligatorio?,activo?,orden?}` |

### Inspecciones
| Método | Ruta | Actor | Qué hace |
|---|---|---|---|
| GET / POST | `/inspecciones` | A/I · A | Lista (`estado, tipo, inmuebleId, inspectorId, desde, hasta, page`) / programa `{inmuebleId,inspectorId,tipo,programadaPara,nota?}` |
| GET / PATCH | `/inspecciones/{id}` | A/I · A | Cabecera y progreso / reprograma (solo pendiente, con `version`) |
| POST | `/inspecciones/{id}/reasignaciones` | A | `{inspectorId,motivo?,version}` |
| POST | `/inspecciones/{id}/inicio` | I | `{version}` pasa a EN_PROCESO (solo dentro del plazo) |
| GET | `/inspecciones/{id}/detalles` | A/I | Elementos a evaluar |
| PATCH | `/inspecciones/{id}/detalles/{detalleId}` | I | `{estado,observacion?,version}` guarda un elemento |
| POST | `/inspecciones/{id}/finalizacion` | I | `{version}` cierra si no hay obligatorios pendientes |
| POST | `/inspecciones/{id}/cancelacion` | A | `{motivo,version}` |

### Fotos, comparación, informes y panel
| Método | Ruta | Actor | Qué hace |
|---|---|---|---|
| POST | `/inspecciones/{id}/detalles/{detalleId}/evidencias` | I | Sube una foto (JPG, PNG o WEBP, ≤ 10 MB, máx. 8 por elemento) |
| GET | `/evidencias/{id}/acceso` | A/I | Enlace firmado de 60 s |
| DELETE | `/evidencias/{id}` | I | Retira una foto mientras la inspección está abierta |
| GET | `/inspecciones/{id}/comparacion?contra={entradaId}` | A/I | Diferencias entrada/salida, calculadas al momento |
| GET / POST | `/inspecciones/{id}/informes` | A/I | Versiones del acta / genera un PDF nuevo |
| GET | `/informes/{id}/descarga` | A/I | Enlace firmado del PDF |
| GET | `/dashboard/resumen` | A | Indicadores de la organización |
| GET | `/auditoria` | A | Eventos de auditoría paginados |

## Filtros de `GET /inspecciones` (desde 2026-11-21)
- `estado` acepta uno o varios valores separados por coma: `?estado=FINALIZADA,CANCELADA`. Si todos son cerrados (finalizada o cancelada), la lista va de la más reciente a la más antigua; si no, de la más próxima a la más lejana.
- `inspectorId` (opcional) filtra por inspector. RLS sigue mandando: el inspector solo ve las suyas aunque mande otro id.
- `desde` y `hasta` (`AAAA-MM-DD`) limitan por fecha programada.
- Se agregaron para que las páginas dejen de leer la base directamente ("Mis inspecciones" cerradas y el panel de Inspectores). Son opcionales: lo que ya funcionaba sigue igual.

## Diferencias con el diseño técnico
- Se agregaron `PUT /auth/contrasena` y `POST /inspectores/{id}/acceso` (reenviar la invitación).
- `GET /propietarios` acepta además `?inmuebles=con|sin` (taller M4U2).
