---
title: "InmoCheck — Especificación funcional y técnica"
subtitle: "Sistema digital de gestión e inspección de inmuebles"
lang: es-CO
date: "26 de septiembre de 2026"
version: "1.0 — Propuesta académica"
---

# InmoCheck

**Documento de especificación funcional y técnica**  
**Proyecto:** Diplomado Full Stack  
**Tecnologías:** Next.js, TypeScript, Supabase y PostgreSQL  
**Versión del documento:** 1.0  
**Estado:** Propuesta para desarrollo académico  

> **Propósito:** establecer con claridad qué debe hacer InmoCheck, qué no debe hacer, sus roles, reglas de negocio, modelo de datos, requisitos de seguridad y criterios para considerar el proyecto terminado. Las decisiones aquí descritas son el alcance propuesto del prototipo; podrán ajustarse durante el análisis con el docente.

# 1. Descripción general

## 1.1. ¿Qué es InmoCheck?

InmoCheck es una aplicación web para administrar y documentar inspecciones de inmuebles residenciales. Permite registrar propiedades y sus espacios, programar visitas, asignar inspectores, evaluar elementos (puertas, paredes, pisos, grifería, etc.), adjuntar fotografías y conservar un historial ordenado. También permite comparar inspecciones de entrada y salida y generar actas PDF.

Está pensada para inmobiliarias y administradores de propiedades. En su primera versión los perfiles que ingresan a la aplicación son **administrador** e **inspector**; propietarios y arrendatarios serán registros relacionados con los inmuebles, pero no tendrán un portal de acceso.

## 1.2. Problema

Los procesos de inspección basados en papel, mensajes, hojas de cálculo y fotografías dispersas dificultan reconstruir el estado de una propiedad. Pueden perderse evidencias, aparecer versiones contradictorias y requerirse tiempo adicional para elaborar actas o comparar una entrega con una devolución. El proyecto centraliza datos, fotografías e informes, estandarizando el registro y conservando su historial.

## 1.3. Objetivo general

Desarrollar una aplicación web Full Stack con Next.js y Supabase que permita gestionar inmuebles y realizar inspecciones digitales con evidencias fotográficas, historial, comparación de revisiones e informes PDF, aplicando controles de acceso según el rol de cada usuario.

## 1.4. Objetivos específicos

1. Implementar autenticación y autorización basada en roles.
2. Crear el módulo de inmuebles, propietarios, espacios y elementos inspeccionables.
3. Permitir programar, asignar, realizar y finalizar inspecciones.
4. Registrar estados, observaciones y evidencias fotográficas por elemento.
5. Preservar los datos de inspecciones finalizadas y la trazabilidad de los cambios.
6. Comparar inspecciones de entrada y salida del mismo inmueble.
7. Generar informes PDF y un panel de indicadores operativos.
8. Aplicar seguridad en base de datos y archivos privados mediante Supabase.

# 2. Alcance y exclusiones

## 2.1. Funcionalidades obligatorias (MVP)

- Inicio y cierre de sesión; recuperación de contraseña.
- Roles de administrador e inspector y cuentas creadas por invitación o por administración autorizada.
- Alta, consulta, modificación y desactivación lógica de inmuebles.
- Gestión básica de propietarios; registro de arrendatarios relacionado con entregas, cuando aplique.
- Inventario personalizable de espacios y elementos por inmueble.
- Programación y asignación de inspecciones de entrada, salida y seguimiento.
- Inspección con estados por elemento, observaciones, fotografías y guardado de borradores.
- Validación de elementos obligatorios antes de finalizar.
- Consulta del historial y comparación de entrada/salida.
- Informes PDF, panel administrativo y auditoría mínima.
- Restricciones de acceso a datos y archivos por usuario y organización.

## 2.2. Exclusiones de la primera versión: qué NO debe hacer

InmoCheck **no** será un portal para anunciar, comprar o vender inmuebles; tampoco administrará pagos, cánones, depósitos, contabilidad ni contratos de arrendamiento. No determinará automáticamente quién debe responder por un daño ni calculará indemnizaciones. Tampoco incluirá diagnóstico de desperfectos por inteligencia artificial, recorridos 3D, sensores IoT, aplicaciones móviles nativas o trabajo completo sin conexión a internet.

La primera versión **no** permitirá que propietarios y arrendatarios inicien sesión. Sus posibles portales, las firmas en pantalla, los correos automatizados y el modo sin conexión quedarán para una fase posterior. La adaptación a pantallas móviles **sí** forma parte del MVP.

## 2.3. Límites funcionales importantes

- No permitir inscripciones públicas que otorguen el rol de administrador o inspector.
- No exponer fotografías de inspecciones mediante enlaces públicos permanentes.
- No editar silenciosamente una inspección finalizada ni sobrescribir sus evidencias.
- No eliminar en cascada el historial al desactivar un inmueble o inspector.
- No equiparar diferencias registradas con responsabilidad contractual o legal.
- No presentar una operación fallida como guardada o finalizada.

# 3. Usuarios y permisos

## 3.1. Administrador

**Debe poder:** gestionar inmuebles, propietarios e inspectores de su organización; crear y asignar inspecciones; consultar el historial completo de su organización; generar informes; revisar el dashboard; desactivar registros sin borrar el historial; registrar una justificación al cancelar o reasignar una inspección en curso.

**No debe poder:** acceder a otras organizaciones, conocer contraseñas, atribuir una inspección a una persona distinta de su autor real, modificar directamente una inspección cerrada o editar el registro de auditoría desde la interfaz normal.

## 3.2. Inspector

**Debe poder:** ver las inspecciones asignadas y los inmuebles necesarios; iniciar inspecciones; evaluar elementos; adjuntar fotografías; guardar borradores; finalizar revisiones completas; consultar el historial autorizado y descargar sus informes.

**No debe poder:** crear administradores, administrar usuarios, consultar inmuebles ajenos a sus asignaciones, asignarse tareas arbitrariamente, editar inspecciones finalizadas, eliminar el historial o acceder a indicadores reservados al administrador.

## 3.3. Propietarios y arrendatarios

Durante el MVP son personas registradas en los datos de inmuebles o entregas, **no cuentas autenticadas**. Una futura versión podrá darles acceso de lectura a las actas y habilitar observaciones o constancias de recepción, siempre mediante permisos específicos.

## 3.4. Matriz resumida de permisos

| Acción | Administrador | Inspector | Propietario/arrendatario (MVP) |
|---|---|---|---|
| Acceder a la aplicación | Sí | Sí | No |
| Gestionar inmuebles | Sí | No | No |
| Crear y asignar inspecciones | Sí | No | No |
| Ver inspecciones de su ámbito | Todas las de su organización | Solo las autorizadas/asignadas | No |
| Editar inspecciones abiertas | Según flujo autorizado | Solo las asignadas | No |
| Finalizar inspecciones | Si está autorizado por la regla de negocio | Solo las asignadas | No |
| Descargar informes | De su organización | Autorizados | No |
| Gestionar usuarios | Sí | No | No |
| Modificar inspecciones cerradas | No | No | No |

# 4. Requisitos funcionales

## RF-01. Autenticación

El sistema debe autenticar usuarios con Supabase Auth mediante correo y contraseña, permitir recuperar la contraseña, cerrar sesión y proteger páginas y acciones. El rol y la organización deberán resolverse desde datos de confianza del servidor o la base de datos, nunca exclusivamente desde un campo enviado por el navegador. Una cuenta desactivada no podrá ejecutar nuevas operaciones protegidas aunque conserve una sesión anterior.

## RF-02. Gestión de inmuebles

El administrador debe crear, consultar, editar y desactivar inmuebles. Los campos mínimos serán ID UUID, organización, código interno, tipo (casa, apartamento u otro), dirección, ciudad, departamento, número de habitaciones, número de baños, propietario, estado y fecha de registro. Barrio, área y descripción serán opcionales. El código interno será único **dentro de la misma organización**. Los inmuebles con historial se desactivarán lógicamente en lugar de eliminarse mediante la interfaz ordinaria.

## RF-03. Personas relacionadas

El administrador debe registrar datos de contacto mínimos del propietario y, cuando corresponda, del arrendatario vinculado a una entrega. Se evitará recopilar datos personales innecesarios. Cambiar el contacto de un propietario no debe reescribir las actas finalizadas que ya contienen datos históricos.

## RF-04. Inspectores

El administrador debe invitar o crear inspectores, consultar su estado, desactivarlos y revisar sus asignaciones. La desactivación no eliminará sus inspecciones históricas. Las invitaciones deberán vincular al usuario a la organización correcta con un rol controlado desde el servidor.

## RF-05. Programación y asignación

Cada inspección se creará con inmueble, tipo (**entrada**, **salida**, **seguimiento**), fecha programada, inspector responsable, estado inicial y observaciones generales opcionales. El inspector deberá existir, estar activo y pertenecer a la misma organización. La inspección aparecerá en su panel personal. Una inspección en proceso solo podrá reasignarse por un administrador con justificación y registro de auditoría.

## RF-06. Inventario de espacios y elementos

Cada inmueble debe tener espacios (cocina, baños, habitaciones, sala, balcón, etc.) y elementos inspeccionables (paredes, enchufes, puertas, pisos, grifería, gabinetes, etc.). El inventario podrá adaptarse por propiedad; los nombres y características usados en una inspección cerrada deberán mantenerse en una **instantánea histórica** para que cambios futuros no alteren el acta anterior.

## RF-07. Realización de inspección

El inspector asignado podrá pasar la inspección a **en proceso**, evaluar cada elemento como **excelente, bueno, regular, dañado o no aplica**, escribir observaciones y guardar avances. La interfaz deberá identificar elementos pendientes, errores de validación y estado de guardado. Antes de finalizar, se comprobará que todos los elementos obligatorios estén evaluados o marcados justificadamente como no aplicables.

## RF-08. Evidencias fotográficas

Por cada detalle de inspección podrán adjuntarse varias fotografías. Se admitirán JPEG, PNG y WebP, con un límite inicial propuesto de **10 MB por archivo** y **10 imágenes por elemento**; estos valores deberán configurarse y validarse también en el servidor. Los archivos residirán en un bucket privado de Supabase Storage; PostgreSQL almacenará rutas, metadatos y relaciones. No se permitirán modificaciones ordinarias de fotografías de inspecciones finalizadas.

## RF-09. Borradores y finalización

Guardar un borrador no implica cerrar la inspección. Finalizar deberá ejecutar una operación consistente que compruebe permisos, estado vigente y completitud; registre la fecha de cierre; preserve los detalles y evite nuevas ediciones ordinarias. Una respuesta de error no debe mostrar confirmación de finalización. Si falla la generación posterior del PDF, la inspección finalizada permanecerá intacta.

## RF-10. Historial

El sistema deberá listar inspecciones por inmueble, con tipo, fechas, estado, inspector y enlaces a sus informes. Las inspecciones cerradas no podrán reabrirse desde un botón o una petición manual. Las correcciones posteriores se registrarán como anotaciones o versiones complementarias que conserven el dato original.

## RF-11. Comparación

El administrador o inspector autorizado podrá comparar una inspección de salida con una entrada anterior **del mismo inmueble**. El sistema relacionará elementos mediante identificadores estables y mostrará estado previo, estado actual, observaciones, fotografías y diferencias. Los elementos incorporados o retirados entre visitas aparecerán como **no comparables**. Una diferencia constituye una observación, no un dictamen automático de culpa.

## RF-12. Informes PDF

El informe deberá contener identificación del inmueble, tipo y fechas de revisión, inspector, espacios y elementos revisados, estado de cada uno, observaciones, evidencias seleccionadas, resumen de diferencias cuando aplique e identificador único. Deberá generarse a partir de una inspección finalizada. Los informes almacenados serán privados y accesibles únicamente para usuarios autorizados.

## RF-13. Dashboard

El administrador visualizará el total de inmuebles activos, inspectores activos, inspecciones pendientes, en proceso y finalizadas, próximas visitas y accesos a informes. Las métricas se calcularán solo con datos de su organización. Los listados deberán incluir paginación y filtros por inmueble, inspector, tipo, fecha y estado cuando corresponda.

## RF-14. Auditoría

El sistema registrará usuario, fecha, operación y registro afectado para creación o modificación de inmuebles, asignación y reasignación de inspecciones, cambios de estado, cancelación, finalización y correcciones. Los usuarios no podrán editar el registro de auditoría desde los formularios convencionales.

# 5. Reglas de negocio

| Código | Regla obligatoria |
|---|---|
| RN-01 | Cada inmueble pertenece a una sola organización. |
| RN-02 | Cada inspección pertenece a un inmueble y tiene un inspector responsable. |
| RN-03 | El inspector solo modifica inspecciones asignadas y abiertas. |
| RN-04 | Un inmueble puede registrar numerosas inspecciones históricas. |
| RN-05 | Toda inspección finalizada conserva su contenido sin edición ordinaria. |
| RN-06 | La salida solo se compara con una inspección anterior del mismo inmueble. |
| RN-07 | Cada elemento obligatorio debe evaluarse antes del cierre. |
| RN-08 | Cada fotografía se vincula a un detalle de inspección válido. |
| RN-09 | Desactivar inmuebles o inspectores no borra su historial. |
| RN-10 | Usuarios de distintas organizaciones no comparten acceso por defecto. |
| RN-11 | Cada informe representa datos concretos de una inspección finalizada. |
| RN-12 | Los cambios de estado relevantes quedan auditados. |
| RN-13 | Una comparación muestra cambios, pero no determina responsabilidad legal. |
| RN-14 | Una operación crítica valida el estado más reciente de la base de datos. |

## 5.1. Estados de inspección y transiciones

| Estado de origen | Destino permitido | Condición |
|---|---|---|
| Pendiente | En proceso | El inspector asignado inicia la revisión. |
| Pendiente | Cancelada | El administrador registra motivo. |
| En proceso | Finalizada | Se validan todos los campos y elementos obligatorios. |
| En proceso | Cancelada | El administrador registra motivo. |
| Finalizada | Ninguno | Registro histórico cerrado. |
| Cancelada | Ninguno | Registro cerrado; se conserva trazabilidad. |

No debe ser posible regresar una inspección finalizada a «en proceso» manipulando una solicitud HTTP. Las correcciones deberán registrarse por una vía expresamente diseñada para ello.

## 5.2. Conservación de registros

La desactivación lógica será la regla operativa normal para usuarios e inmuebles con historial. No implica que los datos personales deban almacenarse indefinidamente: una implementación real requerirá una política de conservación, eliminación y atención de solicitudes de los titulares, conforme a las obligaciones legales aplicables.

# 6. Flujos principales

## 6.1. Registrar inmueble

1. El administrador inicia sesión y abre **Inmuebles → Nuevo inmueble**.
2. Introduce datos obligatorios y selecciona o crea el propietario.
3. Configura espacios y elementos inspeccionables.
4. El sistema valida el formulario y la unicidad del código interno.
5. Si todo es correcto, crea el inmueble dentro de su organización y confirma la operación.
6. Si hay errores, conserva lo escrito cuando sea posible y muestra mensajes concretos.

## 6.2. Crear y asignar inspección

1. El administrador selecciona un inmueble activo.
2. Elige tipo de inspección, fecha e inspector activo de su organización.
3. El sistema comprueba los permisos y guarda la inspección en estado pendiente.
4. La inspección aparece en el panel del inspector asignado.

## 6.3. Ejecutar una inspección

1. El inspector entra a **Mis inspecciones** y selecciona una asignación.
2. Inicia la revisión; su estado cambia a «en proceso».
3. Recorre los espacios, evalúa elementos, agrega observaciones y fotografías.
4. Guarda avances cuando necesite continuar más tarde.
5. Solicita finalizar; el sistema identifica cualquier elemento obligatorio pendiente.
6. Una vez validada, la inspección se cierra y queda disponible para generar PDF.

## 6.4. Comparar entrada y salida

1. El usuario autorizado abre una inspección de salida finalizada.
2. Elige una inspección de entrada anterior del mismo inmueble.
3. El sistema muestra ambas revisiones, identifica diferencias y presenta las fotos de cada fecha.
4. Los elementos que no tengan correspondencia estable quedan señalados como no comparables.
5. El informe comparativo describe los cambios sin adjudicar responsabilidad automática.

## 6.5. Generar informe

1. Un usuario autorizado selecciona **Generar informe** sobre una inspección finalizada.
2. El servidor recupera los datos históricos y las evidencias autorizadas.
3. Genera un PDF con identificador de informe y lo almacena de forma privada si se requiere conservarlo.
4. El sistema ofrece descarga segura. Si la generación falla, se puede reintentar sin modificar la inspección original.

# 7. Modelo de datos propuesto

| Tabla | Campos principales | Función |
|---|---|---|
| `organizaciones` | `id`, `nombre`, `estado` | Inmobiliarias que utilizan el sistema. |
| `perfiles` | `id`, `organizacion_id`, `nombre`, `rol`, `activo` | Perfil y autorización del usuario autenticado. |
| `personas` | `id`, `organizacion_id`, `nombre`, `contacto`, `tipo` | Propietarios y arrendatarios registrados. |
| `inmuebles` | `id`, `organizacion_id`, `codigo`, `direccion`, `tipo`, `propietario_id`, `activo` | Propiedades administradas. |
| `espacios` | `id`, `inmueble_id`, `nombre`, `orden` | Zonas de un inmueble. |
| `elementos` | `id`, `espacio_id`, `nombre`, `obligatorio`, `activo` | Componentes evaluables. |
| `inspecciones` | `id`, `inmueble_id`, `inspector_id`, `tipo`, `estado`, `fecha_programada`, `fecha_finalizada` | Visitas y revisiones. |
| `detalles_inspeccion` | `id`, `inspeccion_id`, `elemento_id`, `estado_elemento`, `observacion`, `nombre_historico` | Evaluaciones y copia histórica del elemento. |
| `evidencias` | `id`, `detalle_id`, `ruta_archivo`, `tipo_mime`, `tamano`, `creada_en` | Fotografías y metadatos. |
| `informes` | `id`, `inspeccion_id`, `version`, `ruta_archivo`, `generado_en` | Documentos generados. |
| `auditoria` | `id`, `organizacion_id`, `usuario_id`, `accion`, `entidad`, `registro_id`, `fecha` | Trazabilidad de acciones relevantes. |

**Relaciones esenciales:** organización 1:N inmuebles y perfiles; inmueble 1:N espacios e inspecciones; espacio 1:N elementos; inspección 1:N detalles; detalle 1:N evidencias. Los identificadores principales serán UUID y las claves foráneas garantizarán integridad. Deberán existir índices en campos de búsqueda habituales, como organización, inmueble, inspector, estado y fecha.

**Preservación histórica:** al cerrar una inspección se guardarán, junto con cada detalle, los datos necesarios para reproducir el nombre del espacio y elemento tal como se revisaron. Cambios posteriores en el inventario no alterarán actas anteriores. Las operaciones de cierre deberán ser transaccionales.

# 8. Arquitectura y tecnologías

| Capa / herramienta | Responsabilidad |
|---|---|
| Next.js (App Router) | Rutas, componentes, vistas, lógica del servidor y generación de respuestas. |
| React + TypeScript | Formularios, interacción y tipado de los datos. |
| Tailwind CSS / shadcn/ui | Interfaz adaptable y componentes accesibles. |
| React Hook Form + Zod | Captura y validación de formularios. |
| Supabase Auth | Inicio de sesión, recuperación y sesiones. |
| Supabase PostgreSQL | Almacenamiento relacional y consultas. |
| Row Level Security (RLS) | Restricciones de acceso a registros por usuario y organización. |
| Supabase Storage | Fotografías y PDF en buckets privados. |
| Server Actions / Route Handlers | Operaciones seguras desde el servidor. |
| Librería de PDF compatible | Construcción de informes descargables. |

## 8.1. Rutas orientativas

```text
/
├── login
├── recuperar-contrasena
└── dashboard
    ├── inmuebles
    │   ├── nuevo
    │   └── [id]
    │       ├── editar
    │       └── historial
    ├── inspecciones
    │   ├── nueva
    │   └── [id]
    │       ├── realizar
    │       ├── comparar
    │       └── informe
    ├── inspectores
    ├── propietarios
    ├── informes
    └── configuracion
```

Los componentes cliente gestionarán la interacción visual; las operaciones privilegiadas se realizarán en el servidor, con validaciones y permisos en la base de datos. Ninguna clave administrativa de Supabase debe enviarse al navegador.

# 9. Seguridad y privacidad

1. **Autenticación:** proteger sesiones, permitir recuperación y bloquear operaciones de cuentas desactivadas.
2. **Autorización:** aplicar RLS y verificar pertenencia a la organización. No confiar en un `organizacion_id` ni en un `rol` enviados por el cliente.
3. **Archivos:** usar buckets privados y enlaces firmados temporales; restringir extensiones, MIME, tamaño, cantidad y rutas autorizadas.
4. **Auditoría:** registrar cambios críticos sin permitir edición ordinaria del historial.
5. **Validación:** comprobar permisos y datos tanto en interfaz como en servidor/base de datos.
6. **Datos personales:** recolectar únicamente los necesarios y evitar fotos de documentos o información privada irrelevante.
7. **Conservación:** documentar respaldo, recuperación, plazo de retención y procedimientos de rectificación o supresión donde correspondan.
8. **Implementación comercial:** revisar obligaciones vigentes de protección de datos de Colombia y elaborar las políticas y autorizaciones correspondientes; este prototipo académico no reemplaza asesoría jurídica.

# 10. Requisitos no funcionales

| Código | Categoría | Criterio |
|---|---|---|
| RNF-01 | Usabilidad | Formularios claros y mensajes de error comprensibles. |
| RNF-02 | Diseño adaptable | Funcionamiento usable en computador, tableta y celular. |
| RNF-03 | Rendimiento | Paginación y filtros para listados extensos; consultas indexadas. |
| RNF-04 | Seguridad | Autenticación y autorización verificadas en operaciones protegidas. |
| RNF-05 | Integridad | Claves foráneas, restricciones y transacciones cuando corresponda. |
| RNF-06 | Confiabilidad | No confirmar operaciones fallidas; indicar estado de guardado. |
| RNF-07 | Mantenibilidad | Código modular, componentes reutilizables y tipado coherente. |
| RNF-08 | Accesibilidad | Etiquetas, navegación con teclado y mensajes accesibles. |
| RNF-09 | Trazabilidad | Registro de operaciones relevantes con usuario y fecha. |
| RNF-10 | Compatibilidad | Soporte para versiones actuales de navegadores principales. |
| RNF-11 | Privacidad | Informes y fotos privados, con controles de acceso. |
| RNF-12 | Recuperación | Procedimiento probado de respaldo y restauración. |

Como meta de prueba del prototipo, se podrá intentar cargar el listado principal en menos de tres segundos en un entorno de evaluación definido; no constituye una garantía para cualquier red o dispositivo.

# 11. Comportamientos prohibidos por módulo

| Módulo | Debe hacer | No debe hacer |
|---|---|---|
| Autenticación | Identificar usuarios y comprobar permisos. | Crear administradores mediante registro público. |
| Inmuebles | Administrar propiedades y conservar su historial. | Eliminar inspecciones al desactivar una propiedad. |
| Inspectores | Gestionar cuentas y asignaciones válidas. | Permitir accesos entre organizaciones. |
| Inspecciones | Evaluar elementos y guardar borradores. | Finalizar con elementos obligatorios sin revisar. |
| Inventario | Personalizar espacios y elementos. | Modificar datos históricos de inspecciones cerradas. |
| Evidencias | Asociar fotografías al detalle correcto. | Publicar imágenes privadas o borrar evidencias históricas sin procedimiento autorizado. |
| Comparaciones | Mostrar cambios y fotos de ambas fechas. | Decidir automáticamente quién causó un daño. |
| Informes | Representar fielmente registros finalizados. | Mezclar borradores no validados con actas cerradas. |
| Dashboard | Mostrar indicadores de la organización. | Exponer datos de inmobiliarias ajenas. |
| Auditoría | Registrar operaciones críticas. | Permitir edición del registro desde formularios comunes. |

# 12. Errores y casos especiales

- **Sin conexión:** comunicar claramente que los cambios no se han guardado; no simular éxito. El modo offline completo no está incluido en el MVP.
- **Archivo inválido o excesivo:** rechazarlo con un mensaje de límite y formato permitido, sin perder el resto del formulario.
- **Inspección incompleta:** señalar los elementos obligatorios pendientes e impedir el cierre.
- **Cuenta desactivada:** rechazar nuevas operaciones protegidas incluso si existe una sesión anterior.
- **Acceso indebido:** denegar solicitudes a inmuebles, fotos o informes no autorizados, sin filtrar metadatos privados.
- **PDF fallido:** conservar la inspección finalizada y permitir reintentar la generación.
- **Ediciones simultáneas:** verificar el estado actual y emplear transacciones o control de concurrencia en cambios críticos.
- **Elementos retirados del inventario:** conservar sus instantáneas históricas y señalarlos como no comparables cuando corresponda.

# 13. Criterios de aceptación del MVP

- [ ] **CA-01:** el administrador inicia sesión y accede a su dashboard.
- [ ] **CA-02:** una persona no autenticada no puede consultar rutas protegidas.
- [ ] **CA-03:** el inspector no puede consultar inmuebles fuera de sus permisos.
- [ ] **CA-04:** el administrador registra un inmueble y aparece en el listado.
- [ ] **CA-05:** el sistema impide códigos internos duplicados dentro de una organización.
- [ ] **CA-06:** una inspección asignada aparece en el panel del inspector correcto.
- [ ] **CA-07:** el inspector guarda una inspección como borrador y puede retomarla.
- [ ] **CA-08:** no puede finalizarse una inspección con elementos obligatorios pendientes.
- [ ] **CA-09:** una fotografía queda relacionada con el detalle inspeccionado correspondiente.
- [ ] **CA-10:** una inspección cerrada no puede modificarse mediante una petición manual.
- [ ] **CA-11:** la comparación detecta cambios entre visitas del mismo inmueble.
- [ ] **CA-12:** el PDF presenta los datos finalizados y las evidencias elegidas.
- [ ] **CA-13:** la desactivación lógica de un inmueble preserva su historial.
- [ ] **CA-14:** las políticas RLS impiden consultar datos de otra organización.
- [ ] **CA-15:** una operación fallida no muestra una confirmación de éxito.
- [ ] **CA-16:** las operaciones relevantes dejan los eventos de auditoría previstos.

# 14. Plan de desarrollo

| Fase | Trabajo principal | Entregable |
|---|---|---|
| 1. Análisis y diseño | Requerimientos, diagramas, prototipos y modelo de datos. | Documento y diseño inicial. |
| 2. Base del proyecto | Next.js, Supabase, Auth, perfiles, roles y RLS. | Inicio de sesión seguro. |
| 3. Gestión | Inmuebles, personas, inventario y cuentas de inspector. | Módulos administrativos. |
| 4. Inspecciones | Agenda, asignaciones, formularios, borradores y fotografías. | Flujo de inspección completo. |
| 5. Historial e informes | Cierre, comparación, dashboard y PDF. | Prototipo funcional integral. |
| 6. Validación y entrega | Pruebas, correcciones, despliegue y documentación. | Aplicación demostrable. |

# 15. Pruebas y calidad

Se realizarán pruebas funcionales de formularios, búsquedas, filtros, asignaciones y generación de PDF; pruebas de integración de Next.js con Supabase Auth, PostgreSQL y Storage; y pruebas de seguridad de permisos, RLS y rutas de archivos. Las reglas críticas, como cierre incompleto, acceso cruzado y preservación del historial, deberían contar con pruebas automatizadas cuando el tiempo del diplomado lo permita.

El despliegue incluirá variables de entorno separadas, gestión responsable de secretos y un conjunto de datos de demostración que no contenga información personal real.

# 16. Entregables académicos

1. Aplicación web desplegada y adaptable a dispositivos móviles.
2. Repositorio documentado con instrucciones de instalación.
3. Diagrama entidad-relación y scripts SQL de tablas, índices, restricciones y RLS.
4. Prototipos o capturas de las pantallas principales.
5. Manual básico del administrador y del inspector.
6. Evidencias de pruebas funcionales y de acceso.
7. Informes PDF de ejemplo generados a partir de datos ficticios.
8. Presentación y demostración del flujo completo.

# 17. Definición de terminado

El MVP estará terminado cuando un administrador pueda registrar un inmueble con su inventario, asignar una inspección y consultar su historial; un inspector pueda abrir la asignación en su celular, evaluar elementos, guardar borradores, adjuntar fotos y finalizar correctamente; y ambos, dentro de sus permisos, puedan consultar diferencias entre entrada y salida y descargar un PDF fiel al registro finalizado.

Además, deberá demostrarse que las políticas de acceso protegen los datos de otras organizaciones y que una inspección cerrada conserva su contenido. Las firmas, portales de propietarios y arrendatarios, notificaciones automáticas, modo sin conexión e IA permanecerán fuera de la entrega obligatoria.

---

**Nota:** documento de alcance propuesto para un proyecto académico. Los requisitos regulatorios de una eventual explotación comercial deberán verificarse antes de utilizar la aplicación con datos reales.
