# F4 · Realizar una inspección

## Historia
Como inspector, quiero evaluar cada elemento del inmueble desde el celular, con observaciones y fotos, para dejar constancia de su estado sin papel.

## Comportamiento
1. El inspector inicia la inspección y la abre en `/dashboard/inspecciones/[id]/realizar`.
2. Los elementos aparecen agrupados por espacio, con una barra de progreso.
3. Por cada elemento elige un estado (Excelente, Bueno, Regular, Dañado, No aplica), escribe una observación y adjunta fotos.
4. Cada elemento se guarda solo y muestra "Cambios sin guardar" o "Guardado".
5. Con todos los elementos obligatorios evaluados, pulsa "Finalizar inspección" y ya no se puede editar.

## Criterios de aceptación
- [ ] Al elegir un estado, la tarjeta pasa a "Guardado" solo después de que el servidor responde.
- [ ] Al recargar la página, los estados y observaciones guardados siguen ahí.
- [ ] Si intenta cerrar la pestaña con cambios sin guardar, el navegador avisa.
- [ ] Una foto JPG, PNG o WEBP se sube y se ve en miniatura. Un PDF se rechaza.
- [ ] Un elemento no admite más de 8 fotos.
- [ ] Con un elemento obligatorio sin evaluar, "Finalizar inspección" muestra el error y la inspección no se cierra.
- [ ] Una inspección finalizada se ve en solo lectura y su etiqueta cambia a "Finalizada" en verde.
- [ ] A 390 px el botón de finalizar y las tarjetas se usan sin hacer zoom.

## Casos especiales
- Sin conexión o con error del servidor, la tarjeta no pasa a "Guardado" (CA-15).
- Una foto inválida o de más de 10 MB se rechaza con el motivo y no se pierde lo demás.
- Las fotos se reducen a 1600 px en el celular antes de subirse.
- Ante un conflicto de versión, se recarga el dato actual en lugar de reintentar a ciegas.

## Trazabilidad
- MVP: CA-07, CA-08, CA-09, CA-10, CA-15 · Reglas: RN-03, RN-05, RN-07, RN-08
- API: `/inspecciones/{id}/detalles`, `PATCH …/detalles/{detalleId}`, `POST …/evidencias`, `DELETE /evidencias/{id}`, `/finalizacion`
- Prototipo: `2-inspector/inspeccion-realizar.html`, `inspeccion-detalle.html`
- Manual del inspector §3–6

## Fuera de alcance
Modo sin conexión, firmas y edición después de finalizar.
