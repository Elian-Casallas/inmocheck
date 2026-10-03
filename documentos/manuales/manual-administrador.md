# InmoCheck — Manual del administrador

Guía para quien administra la inmobiliaria: registra inmuebles, invita
inspectores, programa las inspecciones y consulta los informes.

## 1. Entrar a la aplicación

1. Abre la dirección de InmoCheck en el navegador.
2. Escribe tu correo y tu contraseña y pulsa **Ingresar**.
3. Llegas al **Resumen**.

Si olvidaste la contraseña, pulsa **¿Olvidaste tu contraseña?**, escribe tu
correo y abre el enlace que te llega (revisa también el correo no deseado).
La contraseña debe tener mínimo 8 caracteres, con al menos una letra y un número.

Para salir, usa **Cerrar sesión**, debajo de tu nombre en el menú.

## 2. El menú

| Opción | Para qué sirve |
|---|---|
| Resumen | Indicadores, próximas inspecciones e informes recientes |
| Inmuebles | Registrar y consultar propiedades y su inventario |
| Inspecciones | Programar visitas y seguir su estado |
| Propietarios | Datos de contacto de los dueños |
| Inspectores | Invitar y administrar a quienes inspeccionan |
| Informes | Actas en PDF de las inspecciones finalizadas |
| Configuración | Tu perfil y el cambio de contraseña |

En el celular, las tres primeras opciones están abajo y el resto en **Más**.

## 3. Registrar un propietario

Antes de registrar un inmueble debe existir su propietario.

1. Ve a **Propietarios** y pulsa **Registrar propietario**.
2. Escribe el nombre. El correo y el teléfono son opcionales.
3. Pulsa **Guardar propietario**.

Para editarlo, haz clic en su fila. Los propietarios no tienen acceso a la
aplicación. Cambiar sus datos no modifica las actas ya finalizadas.

## 4. Registrar un inmueble y su inventario

1. Ve a **Inmuebles** y pulsa **Registrar inmueble**.
2. Completa los datos. El **código interno** debe ser único en tu inmobiliaria
   (por ejemplo, `APT-302`).
3. Elige el propietario y pulsa **Guardar inmueble**.
4. La aplicación te lleva al **Inventario**. Ahí defines qué se va a revisar:
   - **Agregar espacio:** Cocina, Baño, Habitación 1…
   - En cada espacio, **Agregar** elementos: Paredes, Piso, Grifería…
   - El interruptor **Obligatorio** indica que ese elemento debe evaluarse
     para poder finalizar una inspección.

Un inmueble sin inventario no se puede inspeccionar.

**Importante:** los cambios en el inventario solo aplican a las inspecciones
que programes desde ese momento. Las que ya existen conservan su propia copia.
Por eso los elementos no se borran: se **desactivan**.

### Editar o desactivar un inmueble

En la ficha del inmueble pulsa **Editar**. Desde ahí también puedes
**Desactivar inmueble**: deja de aparecer para programar inspecciones, pero su
historial se conserva. No se puede desactivar si tiene inspecciones pendientes
o en proceso.

La ficha tiene tres pestañas: **Resumen**, **Inventario** e **Historial** (todas
las inspecciones de esa propiedad).

## 5. Invitar un inspector

1. Ve a **Inspectores** y pulsa **Invitar inspector**.
2. Escribe su nombre y su correo y pulsa **Enviar invitación**.
3. La persona recibe un correo con un enlace para crear su contraseña.

Si no le llegó o el enlace venció, abre su fila y pulsa **Reenviar enlace**.

Para quitarle el acceso pulsa **Desactivar cuenta**. Sus inspecciones pasadas
se conservan. Si tiene inspecciones abiertas, primero reasígnalas.

## 6. Programar una inspección

1. Ve a **Inspecciones** y pulsa **Programar inspección** (también hay un
   botón en la ficha del inmueble).
2. Elige el inmueble.
3. Elige el tipo:
   - **Entrada:** al entregar el inmueble.
   - **Salida:** al recibirlo de vuelta. Se podrá comparar con la entrada.
   - **Seguimiento:** revisión periódica.
4. Indica fecha, hora e inspector responsable. La nota es opcional.
5. Pulsa **Programar inspección**.

La inspección queda **Pendiente** y aparece en la agenda del inspector.

## 7. Seguir una inspección

En **Inspecciones** puedes filtrar por estado:

| Estado | Significado |
|---|---|
| Pendiente | Programada; el inspector aún no la inicia |
| En proceso | El inspector la está realizando |
| Finalizada | Cerrada. Ya no se puede modificar |
| Cancelada | Anulada con un motivo. No se puede reabrir |

Al abrir una inspección ves el inventario a revisar, el avance, los datos de la
visita y la **Actividad**: quién hizo qué y cuándo.

Mientras esté pendiente o en proceso puedes:

- **Reasignar:** pasarla a otro inspector. Si ya está en proceso, el motivo es obligatorio.
- **Cancelar inspección:** el motivo es obligatorio. No se borra: queda como cancelada.

El administrador no evalúa elementos ni finaliza inspecciones; eso lo hace el
inspector asignado.

## 8. Informes en PDF

Cuando una inspección está finalizada:

1. Ábrela y pulsa **Ver informe**.
2. Pulsa **Generar informe PDF** (la primera vez) o **Descargar PDF**.

Cada vez que generas el informe se guarda una **versión** nueva; las anteriores
se conservan. Todos los informes están en el menú **Informes**.

El PDF es privado: solo lo descargan usuarios autorizados de tu inmobiliaria.

## 9. Comparar entrada y salida

1. Abre el informe de una inspección de **salida** finalizada.
2. Pulsa **Comparar con la entrada**.
3. Si hay varias entradas, elige con cuál comparar.

Cada elemento muestra uno de estos resultados:

| Resultado | Significado |
|---|---|
| Sin cambio | El estado es el mismo en la entrada y en la salida |
| Cambio de estado registrado | El estado es distinto |
| No comparable | El elemento solo existe en una de las dos inspecciones |

Puedes filtrar por **Con cambios** o **No comparables**. La comparación describe
diferencias; **no determina quién es responsable** de un daño.

## 10. Preguntas frecuentes

**No puedo desactivar un inmueble o un inspector.** Tiene inspecciones
pendientes o en proceso. Cancélalas, reasígnalas o espera a que finalicen.

**Aparece "Ya existe un inmueble con ese código".** El código interno no se
puede repetir dentro de tu inmobiliaria.

**Aparece "Alguien más modificó estos datos".** Otra persona cambió esa
inspección mientras la tenías abierta. Recarga la página y repite la acción.

**¿Puedo corregir una inspección finalizada?** No. Queda cerrada para proteger
el acta. Si hace falta, programa una inspección de seguimiento.
