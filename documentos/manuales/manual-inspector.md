# InmoCheck — Manual del inspector

Guía para quien realiza las inspecciones en campo. La aplicación está pensada
para usarse desde el celular.

## 1. Tu primera entrada

1. El administrador de tu inmobiliaria te invita con tu correo.
2. Recibes un correo con un enlace. Si no lo ves, revisa el correo no deseado.
3. Al abrirlo, crea tu contraseña: mínimo 8 caracteres, con al menos una letra
   y un número.

Las siguientes veces entra con tu correo y tu contraseña. Si la olvidas, pulsa
**¿Olvidaste tu contraseña?** en la pantalla de ingreso. Si el enlace del correo
venció, pide al administrador que te lo reenvíe.

## 2. Mis inspecciones

Es tu pantalla de inicio.

- **En curso:** la inspección que ya iniciaste, con su avance y el botón
  **Continuar inspección**.
- **Asignadas:**
  - **Próximas:** las que tienes pendientes.
  - **Finalizadas:** las que ya cerraste o fueron canceladas.

Solo ves las inspecciones que te asignaron y los inmuebles de esas inspecciones.

## 3. Iniciar una inspección

1. En **Próximas**, abre la inspección.
2. Revisa qué vas a evaluar, la fecha y la nota del administrador.
3. Cuando estés en el inmueble, pulsa **Iniciar inspección**.

La inspección pasa a **En proceso**. Abrir la ficha no la inicia: solo el botón.

## 4. Evaluar los elementos

La pantalla muestra arriba tu avance y los **espacios** del inmueble (Cocina,
Baño…). Toca un espacio para ver sus elementos.

Para cada elemento:

1. Tócalo para abrirlo.
2. Elige el **estado**:

   | Estado | Cuándo usarlo |
   |---|---|
   | Excelente | Como nuevo |
   | Bueno | Funciona, con desgaste normal |
   | Regular | Funciona, pero tiene un defecto visible |
   | Dañado | No funciona o está roto |
   | No aplica | No se puede evaluar en esta visita |

3. Escribe una **observación** si hace falta. Describe lo que ves, sin opinar
   quién lo causó.
4. Agrega **fotos** con el botón **Foto**. Puedes tomar hasta 8 por elemento.
5. Pulsa **Guardar**.

### Cómo saber si quedó guardado

Debajo de cada elemento aparece su estado de guardado:

| Mensaje | Qué significa |
|---|---|
| Sin evaluar | Aún no has elegido un estado |
| Cambios sin guardar | Cambiaste algo y falta pulsar **Guardar** |
| Guardando… | Se está enviando |
| **Guardado** | El servidor confirmó que quedó registrado |
| No hay conexión. Los cambios no se guardaron | Vuelve a pulsar **Guardar** cuando tengas señal |

Solo confía en **Guardado**. Si cierras la página con cambios sin guardar, el
navegador te avisa.

### Elementos obligatorios

Los marcados como **Obligatorio** deben quedar evaluados para poder finalizar.
Si marcas **No aplica** en un obligatorio, tienes que explicar por qué en la
observación.

### Fotos

- Formatos admitidos: JPG, PNG o WebP, de máximo 10 MB cada una.
- La foto se sube de inmediato; la miniatura aparece cuando el servidor la recibió.
- Para quitar una, toca la **×** de la miniatura.
- No fotografíes documentos ni personas: solo el estado del inmueble.

## 5. Guardar y continuar después

No tienes que terminar de una vez. Lo que ya dice **Guardado** queda registrado.
Para retomar, entra a **Mis inspecciones** y pulsa **Continuar inspección**.

La aplicación necesita internet para guardar. No funciona sin conexión.

## 6. Finalizar

1. Cuando termines, pulsa **Finalizar inspección**.
2. Si falta algo, aparece la lista de elementos pendientes (obligatorios sin
   evaluar o cambios sin guardar). Toca cada uno para ir directo a él.
3. Si todo está completo, la inspección queda **Finalizada** y pasas al informe.

**Una inspección finalizada no se puede modificar**, ni sus fotos. Revisa bien
antes de finalizar.

## 7. Informe

En la pantalla del informe puedes:

- Ver la vista previa con todos los elementos evaluados.
- Pulsar **Generar informe PDF** y luego **Descargar PDF**.

Tus informes también están en el menú **Informes**.

Si la inspección es de **salida**, el botón **Comparar con la entrada** muestra
las diferencias con la inspección de entrada del mismo inmueble.

## 8. Preguntas frecuentes

**No veo una inspección que me dijeron que tenía.** Puede que la hayan
reasignado o cancelado. Consulta con el administrador.

**Aparece "Este elemento cambió en otra sesión".** Abriste la inspección en
dos pestañas o dispositivos y se guardó desde el otro. La pantalla muestra el
valor que quedó guardado; revísalo y vuelve a guardar si hace falta.

**La foto no sube.** Revisa la señal. Si dice que el archivo no es admitido,
toma la foto de nuevo desde la cámara.

**Me equivoqué en una inspección ya finalizada.** No se puede editar. Avisa al
administrador para que programe una inspección de seguimiento.
