# Identidad visual · InmoCheck

> Valores tomados de `app/globals.css` (`@theme`) y `app/layout.tsx`.

## Tono
Profesional, claro y tranquilo. Frases cortas en español y en segunda persona ("Escribe la dirección completa."). Los errores dicen qué hacer, no culpan al usuario. Sin jerga técnica.

## Paleta
| Uso | Token | HEX |
|---|---|---|
| Primario (botones, enlaces, menú activo) | `primario` | #1D4ED8 |
| Primario al pasar el mouse | `primario-hover` | #1E40AF |
| Primario suave (fondos de selección) | `primario-suave` | #EFF4FF |
| Texto principal | `texto-principal` | #0F172A |
| Texto secundario | `texto-secundario` | #475569 |
| Texto tenue | `texto-tenue` | #64748B |
| Fondo de la app | `fondo` | #F6F8FB |
| Tarjetas | `tarjeta` | #FFFFFF |
| Fondo sutil (encabezados de tabla) | `sutil` | #F1F5F9 |
| Bordes | `borde` / `borde-fuerte` | #E2E8F0 / #CBD5E1 |
| Error | `error` / `error-fondo` | #B91C1C / #FEF2F2 |
| Éxito | `exito` / `exito-fondo` | #15803D / #DCFCE7 |

**Estados de inspección** (texto / fondo de la etiqueta):
Pendiente #B45309 / #FEF3C7 · En proceso #0369A1 / #E0F2FE · Finalizada #15803D / #DCFCE7 · Cancelada #475569 / #F1F5F9.

**Estados de elemento:** Excelente #15803D · Bueno #4D7C0F · Regular #B45309 · Dañado #B91C1C · No aplica #64748B.

Contraste: el texto principal sobre el fondo da ≈ 17:1 y el texto blanco sobre el primario ≈ 6.7:1. Ambos cumplen WCAG AA.

## Tipografía
**Inter** (Google Fonts, cargada con `next/font`), con escala propia:
- Título de pantalla 28/36 (20/28 en móvil), título de sección 17/24
- Cuerpo 16/24, cuerpo pequeño 14/20, texto pequeño 12/16, botón 15/20

## Estilo
- Tarjetas blancas con sombra suave (`0 8px 24px rgb(15 23 42 / 6%)`) y bordes de 1 px.
- Botones con radio de 10 px. Primario relleno, secundario con borde.
- Íconos lineales propios (`components/ui/Icono.tsx`).
- Mobile first: menú lateral en escritorio y barra inferior con 3 accesos en el celular. Por debajo de 760 px, las tablas se convierten en lista.
- Formularios de alta y edición en panel lateral (`PanelLateral`), que se abre desde la URL.
- Etiquetas de estado (`Badge`) con texto y color, nunca solo color.

## Estados de la UI
Toda vista que consume la API muestra cuatro estados: **cargando, con datos, vacío y error**. Los formularios muestran además "cambios sin guardar", "guardando" y "guardado". La subida de fotos muestra el progreso y el error de cada archivo. Nunca se marca algo como guardado solo cambiando el estado de React.

Mientras se espera al servidor (navegar, filtrar, abrir o cerrar un panel, refrescar después de guardar) aparece una **barra de carga** fina en el borde superior (`BarraCarga`, color primario, con un pequeño retraso para no parpadear y texto "Cargando…" para lectores de pantalla).

## Referencia
- Reglas, medidas y catálogo de componentes: `docs/diseno/sistema-de-diseno.md`
- Las 22 pantallas con su ruta, rol, spec y botón principal: `docs/diseno/pantallas.md`
- Capturas: `docs/diseno/referencias/`
- Prototipo navegable: `documentos/inmocheck-prototipo/index.html`, organizado en administrador, inspector y pantallas compartidas.
- Sistema de diseño del prototipo: `documentos/inmocheck-prototipo/3-sistema-y-compartidas/sistema-de-diseno.html`.
- Detalle de UX por pantalla: `documentos/InmoCheck_Diseno_Tecnico_REGENERADO.md` §8.2.
