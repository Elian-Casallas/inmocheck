# F5 · Comparación entrada/salida e informe PDF

## Historia
Como administrador, quiero comparar la inspección de salida con la de entrada y generar el acta en PDF para mostrar qué cambió en el inmueble.

## Comportamiento
1. Desde una inspección de salida finalizada, el administrador abre `/comparar` y elige la entrada anterior del mismo inmueble.
2. Ve, elemento por elemento, el estado de entrada contra el de salida, con los cambios resaltados.
3. En `/informe` elige qué fotos incluir y genera el PDF. Si genera de nuevo, se crea una versión nueva.
4. Los informes de la organización se consultan en `/dashboard/informes`, con buscador, filtro por tipo y paginación.

## Criterios de aceptación
- [ ] La comparación solo ofrece inspecciones de entrada del mismo inmueble.
- [ ] Un elemento que pasó de "Bueno" a "Dañado" aparece resaltado como cambio.
- [ ] La comparación muestra cambios, sin texto que asigne responsabilidad por daños.
- [ ] "Generar informe PDF" crea el acta y luego aparece "Descargar PDF".
- [ ] Con un informe ya generado, el botón dice "Generar nueva versión".
- [ ] El PDF incluye solo las fotos seleccionadas.
- [ ] El enlace de descarga deja de funcionar a los 60 segundos, porque es un enlace firmado.
- [ ] Una inspección no finalizada no permite generar el informe.

## Casos especiales
- Si falla la generación del PDF, la inspección sigue finalizada y se puede reintentar.
- Un elemento retirado del inventario conserva su copia histórica en la comparación.

## Trazabilidad
- MVP: CA-11, CA-12 · Reglas: RN-06, RN-11, RN-13
- API: `/inspecciones/{id}/comparacion?contra=`, `/inspecciones/{id}/informes`, `/informes/{id}/descarga`, `/evidencias/{id}/acceso`
- Prototipo: `1-administrador/inspeccion-comparar.html`, `inspeccion-informe.html`, `informes.html`
- Manuales: administrador §8–9, inspector §7

## Fuera de alcance
Firmas digitales, envío del acta por correo y cálculo de costos de reparación.
