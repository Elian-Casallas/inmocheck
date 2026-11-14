# F2 · Inmuebles e inventario

## Historia
Como administrador, quiero registrar cada inmueble con su propietario y su inventario de espacios y elementos para poder inspeccionarlo siempre con la misma lista.

## Comportamiento
1. En `/dashboard/inmuebles` el administrador ve la lista con buscador, filtro por tipo, filtro por estado y paginación.
2. Con "Registrar inmueble" llena código, tipo, dirección, ciudad, departamento, habitaciones, baños, área y propietario.
3. En la pestaña Inventario del inmueble agrega espacios (Sala, Cocina…) y, dentro de cada uno, elementos (Puerta, Piso…), y marca los obligatorios.
4. Puede editar el inmueble o desactivarlo. Desactivarlo no borra su historial.
5. Los propietarios se registran en `/dashboard/propietarios`, que tiene buscador y filtro Con/Sin inmuebles.

## Criterios de aceptación
- [ ] Con la dirección de menos de 5 caracteres aparece "Escribe la dirección completa.".
- [ ] Sin propietario seleccionado aparece "Selecciona un propietario.".
- [ ] Habitaciones con un número negativo muestra "No puede ser negativo.".
- [ ] Un código repetido en la misma inmobiliaria no se guarda y se avisa al usuario.
- [ ] Buscar "APT" filtra la lista, y la búsqueda se conserva al recargar (está en la URL).
- [ ] Un elemento nuevo aparece dentro de su espacio en la pestaña Inventario.
- [ ] Un inmueble desactivado sale con el filtro "Inactivos" y su historial sigue visible.
- [ ] A 390 px de ancho la lista se lee sin scroll horizontal.

## Casos especiales
- Cambiar o desactivar un elemento no altera las inspecciones ya creadas, porque guardan una copia del nombre.
- El inspector solo consulta los inmuebles de sus asignaciones y no edita el inventario.

## Trazabilidad
- MVP: CA-04, CA-05, CA-13 · Reglas: RN-01, RN-04, RN-09
- API: `/inmuebles`, `/inmuebles/{id}`, `/inmuebles/{id}/espacios`, `/espacios/{id}`, `/espacios/{id}/elementos`, `/elementos/{id}`, `/propietarios`
- Prototipo: `1-administrador/inmuebles.html`, `inmueble-nuevo.html`, `inmueble-detalle.html`, `inmueble-inventario.html`, `inmueble-historial.html`, `propietarios.html`
- Manual del administrador §3–4

## Fuera de alcance
Fotos del inmueble, mapa, importar desde Excel y arrendatarios como entidad propia.
