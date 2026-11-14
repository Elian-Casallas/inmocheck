# F3 · Programar y asignar inspecciones

## Historia
Como administrador, quiero programar una inspección de entrada, salida o seguimiento y asignarla a un inspector para que sepa qué visita le toca y cuándo.

## Comportamiento
1. En `/dashboard/inspecciones/nueva` el administrador elige inmueble, tipo, inspector y fecha y hora.
2. La inspección queda **Pendiente** con la lista de elementos del inventario de ese momento.
3. El inspector la ve en Mis inspecciones y la puede iniciar hasta las 7:00 p. m. del día programado.
4. Si nadie la inicia a tiempo, aparece como **No realizada** y el administrador la reprograma, la reasigna o la cancela con motivo.

## Criterios de aceptación
- [ ] Sin inspector elegido aparece "Selecciona un inspector.".
- [ ] Una fecha pasada muestra "Esa fecha ya pasó. Elige hoy antes de las 7:00 p. m. o un día posterior." y no deja guardar.
- [ ] La inspección nueva aparece en la lista con la etiqueta "Pendiente" en color ámbar.
- [ ] La inspección aparece en Mis inspecciones del inspector asignado y no en la de otro inspector.
- [ ] Al cancelar una inspección en proceso sin escribir motivo, el formulario lo exige.
- [ ] La lista se puede filtrar por estado y por tipo.
- [ ] Una inspección finalizada no muestra las acciones de cancelar ni de reasignar.

## Casos especiales
- Si dos personas cambian la misma inspección, la segunda recibe un conflicto de versión (409) y no sobrescribe.
- Iniciar la inspección es una acción explícita del inspector; abrir la ficha no la inicia.

## Trazabilidad
- MVP: CA-06 · Reglas: RN-02, RN-03, RN-14, RN-15, RN-16 y la tabla de estados
- API: `POST /inspecciones`, `PATCH /inspecciones/{id}`, `/reasignaciones`, `/cancelacion`, `/inicio`
- Prototipo: `1-administrador/inspeccion-nueva.html`, `inspecciones.html`, `2-inspector/mis-inspecciones.html`
- Manuales: administrador §6–7, inspector §2–3

## Fuera de alcance
Calendario visual, recordatorios por correo y asignación automática.
