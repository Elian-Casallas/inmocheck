# InmoCheck — Prototipo de pantallas (HTML)

Prototipo navegable de las 22 pantallas del MVP. No necesita instalar nada:
abre `index.html` en el navegador.

## Carpetas

| Carpeta | Contenido |
|---|---|
| `1-administrador/` | 15 pantallas de gestión (dashboard, inmuebles, inspecciones, personas, informes, configuración) |
| `2-inspector/` | 3 pantallas del trabajo en campo (mis inspecciones, detalle, realizar inspección) |
| `3-sistema-y-compartidas/` | Sistema de diseño, inicio de sesión, recuperación de contraseña y errores 403/404 |
| `assets/` | `styles.css` (tokens y componentes) y `app.js` (menú, roles, paneles y filtros) |

## Cómo usarlo

- Cada pantalla muestra abajo a la derecha su ruta en Next.js (clic para ocultarla).
- Todas son adaptables: reduce el ancho de la ventana o ábrelas en el celular.
- En el login, un correo que empiece por `laura` entra como inspectora; cualquier otro, como administrador.
- `?rol=inspector` o `?rol=admin` al final de la URL muestra la vista de cada rol
  (por ejemplo, `2-inspector/inspeccion-detalle.html?rol=admin`).
- **Realizar inspección** es funcional: cambia estados, agrega fotos, guarda y
  valida los obligatorios antes de finalizar.

## Las cinco reglas de diseño

1. **Jerarquía:** un título y un solo botón primario por pantalla.
2. **Contraste:** el color solo comunica estado y siempre va acompañado de texto.
3. **Alineación:** márgenes de 16 / 24 / 40 px y espaciado en múltiplos de 4.
4. **Proximidad:** fotos y observaciones dentro de la tarjeta de su elemento.
5. **Consistencia:** mismo menú, componentes y textos en todas las pantallas.

Los datos son ficticios. La fuente Inter se carga desde Google Fonts; sin internet
se usa la fuente del sistema.
