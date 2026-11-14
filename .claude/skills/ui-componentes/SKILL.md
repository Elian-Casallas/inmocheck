---
name: ui-componentes
description: Crear o modificar pantallas y componentes de InmoCheck respetando su identidad visual y sus convenciones (Next.js App Router, Tailwind 4 con tokens propios, filtros en la URL, paneles laterales). Úsala cada vez que la tarea toque la UI.
---

# Cómo construimos UI en InmoCheck

1. **Lee primero:**
   - `docs/diseno/identidad-visual.md`
   - `docs/diseno/sistema-de-diseno.md` (las 5 reglas y la equivalencia prototipo → componente)
   - la fila de la pantalla en `docs/diseno/pantallas.md`
   - la spec en `docs/specs/`

   Si la pantalla existe en `documentos/inmocheck-prototipo/`, ábrela y respétala.
   - **Un solo botón primario por pantalla.** El color siempre va con texto. Espaciado en múltiplos de 4.
2. **Colores solo con tokens** de `app/globals.css`: `bg-primario`, `text-texto-principal`, `bg-fondo`, `bg-tarjeta`, `border-borde`, `text-error`, `bg-inspeccion-finalizada-fondo`… Nunca HEX sueltos ni colores por defecto de Tailwind como `blue-600`.
3. **Tipografía con la escala propia**: `text-titulo-pantalla`, `text-titulo-seccion`, `text-cuerpo`, `text-cuerpo-sm`, `text-pequeno`, `text-boton`. La fuente es Inter (`font-sans`).
4. **Reusa antes de crear.** Revisa `components/ui/`: `Boton` (`clasesBoton()` para enlaces), `Campo`, `CampoSeleccion`, `CampoContrasena`, `Tabla` (`CeldaPrincipal`, `CeldaFlecha`), `Badge`, `Aviso`, `Tarjeta`, `PanelLateral`, `Paginacion`, `FiltroBusqueda`, `FiltroSeleccion`, `ChipsFiltro`, `Icono`.
5. **Dónde va cada cosa:**
   - Genérico → `components/ui/`. Estructura → `components/layout/`.
   - Propio de un módulo → `features/<modulo>/components/`.
   - Un componente por archivo, en PascalCase, con props tipadas. Nombres y textos en español.
6. **Páginas como Server Components.** Validan el rol con `exigirRol` y leen datos del servicio en `server/services`. `"use client"` solo para la parte interactiva.
7. **El estado de la pantalla va en la URL:** filtros (`?search=`, `?tipo=`), página (`?page=`) y paneles (`?nuevo=1`, `?ver=ID`). Construye los enlaces con `urlCon` de `lib/url.ts`. Valida los parámetros con el schema Zod usando `.catch()`.
8. **Formularios** con React Hook Form y el schema de `schemas/`, que es el mismo que usa la API. Los errores van bajo cada campo.
9. **Mobile first:**
   - Diseña para 390 px. Por debajo de 760 px las tablas pasan a lista (`solo-escritorio` oculta columnas).
   - En el celular hay barra inferior con 3 accesos.
10. **Accesibilidad:** cada input con `label` (o `etiqueta`), botones con texto claro, y estados con texto además de color.
11. **Estados siempre visibles:** cargando (`loading.tsx` y `cargando` en `Boton`), vacío (prop `vacio` de `Tabla`, con un mensaje distinto si hay filtros) y error (`Aviso tipo="error"`, `error.tsx`).
12. **Al terminar:** di qué archivos cambiaste, cómo probarlo en el navegador a 390 px y a 1280 px, y qué criterio de la spec cubre.
