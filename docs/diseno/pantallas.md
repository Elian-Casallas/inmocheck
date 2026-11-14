# Mapa de pantallas

> Cada pantalla se diseñó primero en el prototipo HTML (`documentos/inmocheck-prototipo/`,
> abre `index.html`) y luego se construyó en Next.js. El prototipo es la **pantalla de
> referencia** del SDD: cuando haya dudas de cómo se ve algo, se compara contra él.
> Tip: `?rol=inspector` o `?rol=admin` en la URL del prototipo muestra la vista de cada rol.

| # | Prototipo | Ruta real | Rol | Spec | Acción principal (único botón primario) |
|---|---|---|---|---|---|
| 1 | `3-sistema-y-compartidas/login.html` | `/login` | Público | F1 | Ingresar |
| 2 | `recuperar-contrasena.html` | `/recuperar-contrasena` | Público | F1 | Enviar enlace |
| 3 | `nueva-contrasena.html` | `/auth/actualizar-contrasena` | Público (con enlace) | F1 | Guardar contraseña |
| 4 | `error.html` | `not-found.tsx`, `/403` | Todos | — | Volver al inicio |
| 5 | `1-administrador/dashboard.html` | `/dashboard` | Admin | — | (solo indicadores) |
| 6 | `inmuebles.html` | `/dashboard/inmuebles` | Admin / Inspector | F2 | Registrar inmueble |
| 7 | `inmueble-nuevo.html` | `/dashboard/inmuebles/nuevo` | Admin | F2 | Guardar inmueble |
| 8 | `inmueble-detalle.html` | `/dashboard/inmuebles/[id]` | Admin / Inspector | F2 | Programar inspección |
| 9 | `inmueble-inventario.html` | `/dashboard/inmuebles/[id]/inventario` | Admin | F2 | Programar inspección |
| 10 | `inmueble-historial.html` | `/dashboard/inmuebles/[id]/historial` | Admin / Inspector | F2 | Programar inspección |
| 11 | `inmueble-editar.html` | `/dashboard/inmuebles/[id]/editar` | Admin | F2 | Guardar cambios |
| 12 | `propietarios.html` | `/dashboard/propietarios` | Admin | F2 | Guardar propietario (panel) |
| 13 | `inspectores.html` | `/dashboard/inspectores` | Admin | F1 | Enviar invitación (panel) |
| 14 | `inspecciones.html` | `/dashboard/inspecciones` | Admin | F3 | Programar inspección |
| 15 | `inspeccion-nueva.html` | `/dashboard/inspecciones/nueva` | Admin | F3 | Programar inspección |
| 16 | `2-inspector/mis-inspecciones.html` | `/dashboard/mis-inspecciones` | Inspector | F3 | Continuar inspección |
| 17 | `2-inspector/inspeccion-detalle.html` | `/dashboard/inspecciones/[id]` | Inspector / Admin | F3 | Iniciar inspección |
| 18 | `2-inspector/inspeccion-realizar.html` | `/dashboard/inspecciones/[id]/realizar` | Inspector | F4 | Finalizar inspección |
| 19 | `1-administrador/inspeccion-comparar.html` | `/dashboard/inspecciones/[id]/comparar` | Admin | F5 | Ver informe de salida |
| 20 | `inspeccion-informe.html` | `/dashboard/inspecciones/[id]/informe` | Admin / Inspector | F5 | Generar informe PDF |
| 21 | `informes.html` | `/dashboard/informes` | Admin / Inspector | F5 | (biblioteca: descargar) |
| 22 | `configuracion.html` | `/dashboard/configuracion` | Ambos | F1 | Guardar cambios |

Más el `sistema-de-diseno.html`, que no es una pantalla de la app (ver `docs/diseno/sistema-de-diseno.md`).

## Pantalla de referencia principal
**Realizar inspección** (#18) es la pantalla clave del MVP y la única funcional del prototipo: se pueden cambiar estados, agregar fotos, guardar y validar los obligatorios antes de finalizar. Para el administrador, la referencia es **Inmuebles** (#6).

## Diferencias entre el prototipo y la app
- El prototipo es HTML estático con datos ficticios en `assets/app.js`. La app lee los datos reales de Supabase.
- Lo que se agregó en la app después del prototipo:
  - el aviso "No realizada" por el plazo de las 7 p. m.,
  - la selección de fotos del informe en cuadrícula,
  - el botón para ver la contraseña,
  - el filtro Con/Sin inmuebles en Propietarios.
- La app no tiene una pantalla `/dashboard/auditoria` propia. La auditoría se consulta por la API.
