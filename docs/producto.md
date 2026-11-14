# Producto · InmoCheck

> Documento de SDD reconstruido a partir del producto terminado (SDD inverso).
> Fuente ampliada: `documentos/InmoCheck_Especificacion_Proyecto.md`.

## Problema
Las inspecciones de inmuebles se hacen con papel, mensajes, hojas de cálculo y fotos sueltas en el celular. Las evidencias se pierden, aparecen versiones contradictorias y comparar cómo se entregó un inmueble con cómo se devolvió toma horas.

## Usuario
- **Administrador** de una inmobiliaria pequeña o mediana: registra inmuebles, programa visitas, asigna inspectores y genera actas.
- **Inspector**: hace la visita en el inmueble desde el celular, evalúa cada elemento y toma fotos.
- Propietarios y arrendatarios son **datos**, no usuarios: no inician sesión.

## Objetivo del MVP
Que un inspector registre en el celular una inspección completa, con estado y fotos por elemento, y que el administrador obtenga el acta PDF y la comparación entrada/salida sin pasar nada a mano.

## Funcionalidades (ver `docs/specs/`)
- F1 · Acceso por roles (login, recuperar contraseña, invitación de inspectores)
- F2 · Inmuebles e inventario de espacios y elementos
- F3 · Programar y asignar inspecciones
- F4 · Realizar una inspección (estados, observaciones, fotos, borrador y cierre)
- F5 · Comparación entrada/salida e informe PDF

Apoyo (sin spec propia): gestión de propietarios, gestión de inspectores, historial por inmueble, dashboard con indicadores, biblioteca de informes y auditoría automática.

## Fuera del MVP
Portal para propietarios y arrendatarios, firmas en pantalla, correos automáticos de recordatorio, modo sin conexión, app móvil nativa, pagos, cánones y contratos, publicación de inmuebles, diagnóstico de daños con IA y cálculo de responsabilidades por daños.

Reglas, estados y permisos: `docs/reglas-de-negocio.md`.

## Cómo sabremos que funciona
- Un inspector completa una inspección de un apartamento típico (≈ 40 elementos) desde el celular sin perder datos, aunque recargue la página.
- El acta PDF queda lista en menos de 1 minuto después de finalizar la inspección.
- Un usuario de una inmobiliaria nunca ve datos de otra (lo verifica `supabase/tests/rls.sql`).
- El listado principal carga en menos de 3 s en el entorno de prueba (meta, no garantía).

### Definición de terminado del MVP
El administrador registra un inmueble con inventario, asigna una inspección y consulta su historial. El inspector abre la asignación en el celular, evalúa, guarda borradores, adjunta fotos y finaliza. Ambos, dentro de sus permisos, comparan entrada y salida y descargan un PDF fiel al registro. Además, se demuestra que RLS protege los datos de otras organizaciones y que una inspección cerrada conserva su contenido.

### Criterios de aceptación del MVP → spec
| Código | Criterio | Spec |
|---|---|---|
| CA-01 | El administrador inicia sesión y llega a su dashboard | F1 |
| CA-02 | Sin sesión no se consultan rutas protegidas | F1 |
| CA-03 | El inspector no consulta inmuebles fuera de sus permisos | F1 |
| CA-04 | Un inmueble registrado aparece en el listado | F2 |
| CA-05 | No se permiten códigos duplicados en una organización | F2 |
| CA-06 | La inspección asignada aparece al inspector correcto | F3 |
| CA-07 | El inspector guarda un borrador y lo retoma | F4 |
| CA-08 | No se finaliza con obligatorios pendientes | F4 |
| CA-09 | La foto queda en el detalle correcto | F4 |
| CA-10 | Una inspección cerrada no se modifica con una petición manual | F4 |
| CA-11 | La comparación detecta cambios entre visitas del mismo inmueble | F5 |
| CA-12 | El PDF muestra los datos finalizados y las fotos elegidas | F5 |
| CA-13 | Desactivar un inmueble preserva su historial | F2 |
| CA-14 | RLS impide ver datos de otra organización | F1 |
| CA-15 | Una operación fallida no muestra éxito | F4 |
| CA-16 | Las operaciones relevantes quedan en la auditoría | Transversal |

## Requisitos no funcionales
| Código | Requisito |
|---|---|
| RNF-01 | Formularios claros y mensajes de error comprensibles |
| RNF-02 | Usable en computador, tableta y celular |
| RNF-03 | Paginación y filtros en listados; consultas con índices |
| RNF-04 | Autenticación y autorización en cada operación protegida |
| RNF-05 | Llaves foráneas, restricciones y transacciones |
| RNF-06 | No confirmar operaciones fallidas; indicar el estado de guardado |
| RNF-07 | Código modular, componentes reutilizables y tipado estricto |
| RNF-08 | Etiquetas, navegación con teclado y mensajes accesibles |
| RNF-09 | Registro de operaciones relevantes con usuario y fecha |
| RNF-10 | Navegadores actuales |
| RNF-11 | Informes y fotos privados |
| RNF-12 | Procedimiento de respaldo y restauración (el de Supabase) |

## Material de apoyo
- Manuales de uso: `documentos/manuales/manual-administrador.md` y `manual-inspector.md`
- Prototipo navegable: `documentos/inmocheck-prototipo/index.html`
- Especificación completa: `documentos/InmoCheck_Especificacion_Proyecto.md`
