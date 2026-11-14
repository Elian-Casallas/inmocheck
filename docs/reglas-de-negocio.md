# Reglas de negocio y permisos

> Tomado de `documentos/InmoCheck_Especificacion_Proyecto.md` (secciones 3, 5, 9, 11 y 12).
> Las specs de `docs/specs/` citan estas reglas por su código.

## Reglas obligatorias
| Código | Regla |
|---|---|
| RN-01 | Cada inmueble pertenece a una sola organización. |
| RN-02 | Cada inspección pertenece a un inmueble y tiene un inspector responsable. |
| RN-03 | El inspector solo modifica inspecciones asignadas y abiertas. |
| RN-04 | Un inmueble puede tener muchas inspecciones históricas. |
| RN-05 | Una inspección finalizada no se edita. |
| RN-06 | La salida solo se compara con una inspección anterior del mismo inmueble. |
| RN-07 | Todo elemento obligatorio se evalúa antes del cierre. |
| RN-08 | Cada foto se vincula a un detalle de inspección válido. |
| RN-09 | Desactivar inmuebles o inspectores no borra su historial. |
| RN-10 | Usuarios de distintas organizaciones no comparten datos. |
| RN-11 | Cada informe representa una inspección finalizada concreta. |
| RN-12 | Los cambios de estado relevantes quedan auditados. |
| RN-13 | La comparación muestra cambios; no decide quién es responsable. |
| RN-14 | Una operación crítica valida el estado más reciente de la base (`version`). |
| RN-15 | Una inspección se puede iniciar hasta las 7:00 p. m. (hora de Colombia) del día programado; después queda "No realizada". |
| RN-16 | No se programa una inspección cuyo plazo para iniciar ya pasó. |

RN-15 y RN-16 se agregaron durante el desarrollo (2026-10-08).

## Estados de una inspección
| Desde | Hacia | Condición |
|---|---|---|
| Pendiente | En proceso | El inspector asignado la inicia dentro del plazo |
| Pendiente | Cancelada | El administrador escribe el motivo |
| En proceso | Finalizada | No quedan elementos obligatorios sin evaluar |
| En proceso | Cancelada | El administrador escribe el motivo |
| Finalizada / Cancelada | — | Registro cerrado; no se reabre ni con una petición manual |

## Permisos
| Acción | Administrador | Inspector |
|---|---|---|
| Entrar a la aplicación | Sí | Sí |
| Gestionar inmuebles, inventario y propietarios | Sí | No (solo consulta los inmuebles de sus asignaciones) |
| Invitar y desactivar inspectores | Sí | No |
| Programar, reasignar y cancelar inspecciones | Sí | No |
| Ver inspecciones | Todas las de su organización | Solo las asignadas |
| Evaluar, subir fotos y finalizar | No | Solo las asignadas y abiertas |
| Comparar y generar informes | De su organización | De sus inspecciones |
| Dashboard y auditoría | Sí | No |
| Modificar inspecciones cerradas | No | No |

Propietarios y arrendatarios no tienen cuenta en el MVP.

## Lo que cada módulo NO debe hacer
| Módulo | Prohibido |
|---|---|
| Autenticación | Crear administradores o inspectores por registro público |
| Inmuebles | Borrar inspecciones al desactivar una propiedad |
| Inspectores | Dar acceso entre organizaciones |
| Inspecciones | Finalizar con obligatorios sin revisar |
| Inventario | Cambiar datos de inspecciones cerradas (se guarda una copia del nombre) |
| Evidencias | Publicar fotos con enlaces permanentes o borrar fotos de inspecciones cerradas |
| Comparación | Decidir quién causó un daño |
| Informes | Mezclar borradores con actas cerradas |
| Dashboard | Mostrar datos de otra inmobiliaria |
| Auditoría | Editar el registro desde formularios |

## Errores y casos especiales
- **Sin conexión:** se avisa que el cambio no se guardó; nunca se simula éxito.
- **Foto inválida o muy grande:** se rechaza con el motivo, sin perder el resto del formulario.
- **Inspección incompleta:** se señalan los obligatorios pendientes y no se cierra.
- **Cuenta desactivada:** se rechazan nuevas operaciones aunque haya una sesión abierta.
- **Acceso indebido:** `404`, sin revelar datos del recurso.
- **PDF fallido:** la inspección sigue finalizada y se puede reintentar la generación.
- **Ediciones simultáneas:** `409` por versión; no se sobrescribe a ciegas.
- **Elemento retirado del inventario:** su copia histórica se conserva.
