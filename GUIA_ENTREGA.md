# Guía de pantallazos · Entrega M4U3 (SDD de InmoCheck)

10 pantallazos ordenados según los bloques de la guía del profe. Cada uno indica qué abrir, cómo encuadrarlo y el texto que va debajo en el documento.

---

## Antes de empezar (5 min)

- **VS Code:** abre la carpeta `inmocheck`. Cierra las pestañas que no uses. Usa el tema claro si el documento será impreso.
- **Vista previa de Markdown:** abre el `.md` y pulsa `Ctrl + Shift + V`. Se ve más limpio que el texto plano.
- **Navegador:** usa Chrome. Para la vista de celular: `F12` → ícono de celular (`Ctrl + Shift + M`) → ancho **390**.
- **Recorte:** usa `Win + Shift + S` para capturar solo la zona que necesitas.
- **Nombres de archivo:** `01-estructura.png`, `02-claude-md.png`… Así no se desordenan.
- **Nunca captures** `.env.local`, contraseñas ni la clave `service_role`. Usa las cuentas de demostración (`admin@pinos.test`, `laura@pinos.test`).

---

## Bloque 2 · Caja de herramientas

### 1. Estructura de los planos
- **Abrir:** VS Code, panel del explorador, con `docs/`, `docs/specs/`, `docs/diseno/`, `docs/contratos/` y `.claude/skills/` desplegadas.
- **Encuadre:** solo el árbol de carpetas, de `.claude` hasta `README.md`.
- **Texto para el documento:**
  > Estructura SDD del proyecto. `docs/` reúne los planos: producto (qué y para quién), arquitectura (con qué se construye), diseño (cómo se ve), specs (funcionalidades verificables), contratos de API, reglas de negocio, decisiones y tareas. La skill de UI vive en `.claude/skills/`.

### 2. CLAUDE.md
- **Abrir:** `CLAUDE.md` en vista previa.
- **Encuadre:** de "Proyecto: InmoCheck" hasta "Reglas de trabajo".
- **Texto:**
  > `CLAUDE.md` son las instrucciones permanentes que el agente lee en cada sesión: el stack, el índice de documentos y las reglas de trabajo, como una tarea a la vez, no agregar nada fuera de las specs y no escribir llaves en el código.

---

## Bloque 4 · Los planos

### 3. Producto
- **Abrir:** `docs/producto.md` en vista previa.
- **Encuadre:** de "Problema" hasta "Fuera del MVP".
- **Texto:**
  > La necesidad del cliente: las inspecciones en papel y fotos sueltas hacen que se pierdan evidencias. El MVP permite que el inspector registre la visita desde el celular y que el administrador obtenga el acta PDF. La sección "Fuera del MVP" limita el alcance para que el agente no invente funcionalidades.

### 4. Una spec con criterios de aceptación
- **Abrir:** `docs/specs/F4-realizar-inspeccion.md` en vista previa.
- **Encuadre:** Historia, Comportamiento y Criterios de aceptación.
- **Texto:**
  > Cada funcionalidad tiene su spec: una historia de usuario, el comportamiento paso a paso y criterios que se comprueban en el navegador con un sí o un no. Por ejemplo: "con un elemento obligatorio sin evaluar, la inspección no se puede finalizar".

### 5. Arquitectura
- **Abrir:** `docs/arquitectura.md` en vista previa.
- **Encuadre:** el diagrama de "Visión general" y la tabla de capas de la sección Back.
- **Texto:**
  > Los planos técnicos: una app Next.js con front y back (API en `/api/v1`) y Supabase como base de datos, autenticación y archivos. Cada capa tiene una responsabilidad: la ruta valida, el servicio aplica reglas, el repositorio consulta y la base de datos protege con RLS.

---

## Bloque 5 · El render

### 6. Identidad visual y sistema de diseño
- **Abrir:** `docs/diseno/identidad-visual.md` (tabla de paleta) y, al lado, `documentos/inmocheck-prototipo/3-sistema-y-compartidas/sistema-de-diseno.html` en Chrome.
- **Encuadre:** pantalla dividida, con la tabla de colores a la izquierda y el sistema de diseño a la derecha.
- **Texto:**
  > La identidad visual: tono profesional y claro, primario azul #1D4ED8, tipografía Inter y colores de estado que siempre van con texto. Los códigos HEX salen de los tokens reales de la app, y el sistema de diseño del prototipo muestra las mismas piezas.

### 7. Pantalla de referencia: prototipo y app
- **Abrir:**
  - En Chrome a 390 px: `documentos/inmocheck-prototipo/2-inspector/inspeccion-realizar.html`.
  - En otra pestaña, también a 390 px: la app con `laura@pinos.test` → una inspección en curso → Realizar.
- **Encuadre:** las dos capturas, una al lado de la otra. Guárdalas también en `docs/diseno/referencias/`.
- **Texto:**
  > El render: antes de programar se hizo un prototipo HTML de 22 pantallas con 5 reglas de diseño. "Realizar inspección" es la pantalla de referencia. A la izquierda está el prototipo y a la derecha la app construida, con el mismo diseño mobile first.

### 8. Skill de UI
- **Abrir:** `.claude/skills/ui-componentes/SKILL.md` en vista previa.
- **Encuadre:** el encabezado (`name`, `description`) y los pasos 1 a 6.
- **Texto:**
  > La skill `ui-componentes` empaqueta cómo se construye la interfaz en este proyecto: usar solo los tokens de color, reutilizar los componentes existentes, guardar los filtros en la URL y respetar mobile first. El agente la carga solo cuando la tarea toca la UI.

---

## Bloque 6 y 7 · El cronograma y la obra

### 9. Tareas y commits
- **Abrir:** `docs/tareas.md` en vista previa y, debajo, la terminal integrada con `git log --oneline -15`.
- **Encuadre:** las secciones "Front (U3)" y "Back (U4)" con sus casillas, y el log de commits.
- **Texto:**
  > El cronograma: las tareas del front y del back en orden de dependencia, marcadas al terminar, y el historial de git que respalda cada etapa. La única tarea abierta es verificar en el navegador los criterios de aceptación.

---

## Bloque 8 · Entrega de la fachada

### 10. App publicada
- **Abrir:** https://inmocheck.vercel.app con la sesión de `admin@pinos.test`, en la pantalla Resumen, a 1280 px.
- **Encuadre:** la ventana completa con la barra de direcciones visible (que se lea la URL).
- **Texto:**
  > La fachada publicada: la app está desplegada en Vercel con despliegue continuo desde la rama principal. Cada `git push` publica una versión nueva.

---

## Estructura sugerida del documento

1. **Portada:** nombre, diplomado, módulo 4 · unidad 3, fecha.
2. **Introducción (3–4 líneas):** qué es InmoCheck y qué es SDD. Aclara que se aplicó en modo inverso: el proyecto ya existía y se documentó como si los planos se hubieran hecho antes.
3. **Pantallazos 1–10** con su título y su texto, agrupados por bloque como en esta guía.
4. **Bitácora (opcional):** pantallazo o tabla de `BITACORA_IA.md` con los prompts clave.
5. **Conclusión (3–4 líneas):** qué aportan los planos. El agente deja de adivinar, cada cambio nuevo empieza por el documento y la trazabilidad conecta spec → API → pantalla → tarea.

Antes de exportar a PDF, revisa que ninguna captura muestre contraseñas, llaves o el archivo `.env.local`.
