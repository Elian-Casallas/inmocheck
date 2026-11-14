# Sistema de diseño · InmoCheck

> Nació en el prototipo HTML (`documentos/inmocheck-prototipo/assets/styles.css` y
> `3-sistema-y-compartidas/sistema-de-diseno.html`) y se trasladó a la app como tokens de
> Tailwind 4 (`app/globals.css`) y componentes React (`components/ui/`).
> Colores y tipografía: `docs/diseno/identidad-visual.md`.

## Las cinco reglas
| Regla | Qué significa | Cómo se comprueba |
|---|---|---|
| **Jerarquía** | Un título y **un solo botón primario** por pantalla | Contar botones azules rellenos: máximo uno |
| **Contraste** | El color solo comunica estado y siempre va con texto | Ninguna etiqueta es un punto de color sin palabra |
| **Alineación** | Márgenes de 16 / 24 / 40 px y espaciado en múltiplos de 4 | Clases de Tailwind `p-4`, `p-6`, `p-10`, `gap-3`, `gap-4`… |
| **Proximidad** | Fotos y observaciones van dentro de la tarjeta de su elemento | En Realizar, nada del elemento queda fuera de su tarjeta |
| **Consistencia** | Mismo menú, botones, estados y textos en todas las pantallas | Se usan los componentes de `components/ui`, no estilos sueltos |

## Medidas
| Token | Prototipo | App |
|---|---|---|
| Radio pequeño / botón | 8 px | `rounded-boton` = 10 px |
| Radio de tarjeta | 12–16 px | `rounded-xl` / `rounded-2xl` |
| Sombra de tarjeta | `0 8px 24px rgba(15,23,42,.06)` | `shadow-tarjeta` (igual) |
| Fuente | Inter + fuentes del sistema | Inter con `next/font` (`font-sans`) |

**Puntos de quiebre:** 520, 640, 760, 900 y 1100 px. En la app, los dos que cambian el layout son:
- **< 760 px:** las tablas pasan a lista y se ocultan las columnas `solo-escritorio`.
- **< 900 px:** el menú lateral se cambia por la barra inferior, y en Realizar el botón Finalizar baja al final.

**Movimiento:** se respeta `prefers-reduced-motion` (sin animaciones si el usuario lo pide).

## Componentes: del prototipo a React
| Prototipo (clase CSS) | App (componente) | Uso |
|---|---|---|
| `.btn-primary` / `.btn-secondary` / `.btn-text` / `.btn-danger` | `Boton variante="primario" \| "secundario" \| "texto" \| "peligro"` (y `clasesBoton()` para enlaces) | Acción principal, alternativas, acciones menores y acciones delicadas (desactivar, cancelar) |
| `.btn-sm`, `.btn-block` | `tamano="pequeno"`, `bloque` | Paginación y botones a todo el ancho en el celular |
| `.field` `.label` `.input` `.hint` | `Campo`, `CampoSeleccion`, `CampoContrasena` | Etiqueta siempre visible y error debajo del campo |
| `.badge-pendiente` … `.badge-cancelada`, `.badge-activo` | `Badge`, `BadgeEstadoInspeccion` | Estado con color y texto |
| `.notice` `.notice-error` `.notice-ok` | `Aviso tipo="error" \| …` | Mensajes de la pantalla o del formulario |
| `.card` `.card-head` `.card-body` | `Tarjeta` | Agrupar contenido |
| `.table` `.table-card` `.cell-main` `.cell-sub` | `Tabla`, `CeldaPrincipal`, `CeldaFlecha` | Listados que pasan a lista en el celular |
| `.drawer` `.backdrop` | `PanelLateral` | Registrar o editar sin salir del listado (`?nuevo=1`, `?ver=ID`) |
| `.search` `.select` `.fchips` | `FiltroBusqueda`, `FiltroSeleccion`, `ChipsFiltro` | Filtros guardados en la URL |
| `.pagination` | `Paginacion` | Listas largas |
| `.tabs` `.tab` | `Pestanas` | Detalle del inmueble: datos, inventario e historial |
| `.sidebar` `.nav-item` / `.mobile-top` | `MenuLateral`, `NavegacionInferior` | Menú según el rol |
| `.kpis` `.kpi` | Tarjetas del dashboard | Indicadores del Resumen |
| `.state-options` `.state-opt` | `SelectorEstado` | Excelente, Bueno, Regular, Dañado, No aplica |
| `.thumbs` `.thumb` `.thumb-add` | `FotosElemento`, `SelectorFotosInforme` | Fotos por elemento y selección para el PDF |
| `.progress` | `BarraProgreso`, `ProgresoInspeccion` | Evaluados / total |
| `.dl` | `ListaDatos` | Datos de un registro (etiqueta y valor) |
| `.auth-card` | `TarjetaAcceso` | Login y contraseñas |

## Estados de un elemento al inspeccionar
Excelente · Bueno · Regular · Dañado · No aplica · **Sin evaluar**. "Sin evaluar" es el estado inicial y no se puede finalizar si un obligatorio sigue así.

## Textos de la interfaz
- Botones con verbo y objeto: "Guardar inmueble", "Programar inspección", "Enviar invitación", "Finalizar inspección".
- Errores que dicen qué hacer: "Ya existe un inmueble con este código.", "Escribe la dirección completa.".
- Siempre en segunda persona y sin jerga técnica.
