# Decisiones

| Fecha | Decisión | Por qué |
|---|---|---|
| 2026-10-03 | Next.js con API BFF en `app/api/v1`, sin backend aparte | Un solo proyecto y un solo despliegue; la API valida sesión y rol antes de tocar la base |
| 2026-10-03 | Supabase (PostgreSQL, Auth, Storage) en vez de Spring Boot + MySQL | Auth, RLS y archivos privados listos; permite terminar el MVP en el tiempo del diplomado |
| 2026-10-03 | Capas ruta → servicio → repositorio | La ruta solo valida y responde, el servicio aplica reglas y el repositorio solo consulta |
| 2026-10-03 | RLS en todas las tablas por organización y rol | La base es la última barrera: aunque falle el código, nadie ve datos de otra inmobiliaria |
| 2026-10-03 | Cambios de estado de inspección solo con funciones SQL y campo `version` | Evita saltarse transiciones y que dos personas sobrescriban el mismo dato |
| 2026-10-03 | Borrado lógico (`activo = false`) | Desactivar un inmueble o inspector no borra el historial |
| 2026-10-03 | Detalles con copia del nombre del espacio y del elemento | El acta y la comparación no cambian si luego se edita el inventario |
| 2026-10-03 | Zod compartido entre formulario y API | Una sola fuente de validación y mensajes en español |
| 2026-10-03 | Filtros y paneles en la URL (`?search=`, `?ver=ID`) | Se pueden recargar, compartir por enlace y el botón "atrás" funciona |
| 2026-10-03 | Fotos en buckets privados con enlaces firmados de 60 s | Las evidencias nunca quedan con un enlace público permanente |
| 2026-10-03 | Errores en formato `application/problem+json` | Respuesta uniforme que el front traduce a mensajes claros |
| 2026-10-03 | `organizacion_id` y RLS desde el inicio, aunque la demo use pocas inmobiliarias | Permite demostrar el aislamiento y evita rediseñar la seguridad después |
| 2026-10-03 | Invitación de inspectores con la API Admin de Supabase | El correo con el enlace lo envía Supabase y no hay registro público |
| 2026-10-03 | PDF con `@react-pdf/renderer` en Node, generado al pedirlo | Compatible con Vercel; si llega a tardar, se pasaría a un proceso en segundo plano |
| 2026-10-03 | Comparación calculada al momento, sin tabla propia | Los detalles con copia del nombre ya tienen todo lo necesario |
| 2026-10-03 | Modo sin conexión y firmas fuera del MVP | Que se use en el celular no implica que funcione sin internet, y las firmas requieren revisión jurídica |
| 2026-10-08 | Fotos reducidas a 1600 px en el celular antes de subirlas | Ahorra datos y tiempo en la visita |
| 2026-10-08 | Plazo para iniciar: hasta las 7:00 p. m. del día programado | Una visita no hecha a tiempo queda "No realizada" y el admin la reprograma |
| 2026-10-08 | No programar en fechas cuyo plazo ya pasó | Evita crear inspecciones que nacen vencidas |
| 2026-11-14 | Los commits del proyecto son por etapa, no por tarea; desde ahora, un commit por tarea | El código se escribió antes de conocer el ciclo SDD (tarea → probar → commit → marcar [x]); la "regla de oro" aplica a todo cambio nuevo |
| 2026-11-14 | No se hicieron variantes `/prototipo/a, b, c`; el prototipo HTML cumplió ese papel | Las 22 pantallas se diseñaron y revisaron con las 5 reglas antes de programarlas (`docs/diseno/pantallas.md`) |
| 2026-11-14 | Front y back construidos juntos, sin fase de datos mock | El BFF y Supabase existieron desde el inicio, así que el front consumió datos reales |
| 2026-11-14 | Integrar `documentos/` al SDD resumiendo y enlazando, sin copiarlo entero | Los documentos originales siguen siendo la fuente ampliada; `docs/` es el índice que lee el agente |
| 2026-11-14 | **Supuesto:** las fechas de esta tabla salen del historial de git | Los docs SDD se escribieron después del código (SDD inverso) |
| 2026-10-03 | Prototipo HTML de 22 pantallas antes del código, con 5 reglas de diseño | Validar el flujo y el estilo sin backend; cumple el papel de las "variantes" de la guía |
| 2026-10-03 | Pasar los tokens del prototipo (`styles.css`) a `@theme` de Tailwind | Mismos colores y medidas en el prototipo y en la app |
| 2026-11-14 | **Supuesto:** la pantalla de referencia es Realizar inspección (y, para el admin, Inmuebles) | Es el núcleo del MVP y la única pantalla funcional del prototipo |
| 2026-11-14 | **Supuesto:** las métricas de "Cómo sabremos que funciona" son objetivos razonables | El código no define métricas de uso |
| 2026-11-14 | **Supuesto:** la tipografía es Inter, no una de las propuestas de la guía | Es la que carga `app/layout.tsx` |
| 2026-11-14 | **Supuesto:** los criterios de las specs se dedujeron del código, la especificación y el README, sin recorrerlos en el navegador | La regla de la sesión fue no ejecutar la app; se marcan al verificarlos |
| 2026-11-14 | **Supuesto:** las tareas se agruparon por unidad del diplomado (Front U3, Back U4, Pruebas U5, Nube U6) según los commits | El proyecto se hizo por etapas, no tarea por tarea |
