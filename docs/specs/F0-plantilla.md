# F0 · Plantilla de spec

> Copia este archivo como `Fn-nombre-corto.md` para cada funcionalidad nueva.
> Primero se escribe la spec; después se piden las tareas y luego el código.

# Fn · Nombre de la funcionalidad

## Historia
Como [administrador | inspector], quiero [acción] para [beneficio].

## Comportamiento
1. Dónde empieza el usuario (ruta) y qué ve.
2. Qué hace, paso a paso.
3. Qué resultado ve al terminar.

## Criterios de aceptación
Cada criterio debe poder comprobarse en el navegador con un sí o un no.
- [ ] Con [dato inválido] aparece "[mensaje exacto]" bajo el campo.
- [ ] Al [acción] el registro aparece en [lista o pantalla].
- [ ] Un [rol sin permiso] que entra a [ruta] no ve [la pantalla o el dato].
- [ ] A 390 px de ancho la pantalla se usa sin hacer zoom ni scroll horizontal.

## Casos especiales
- Qué pasa sin conexión, con un dato duplicado o si dos personas editan a la vez.

## Trazabilidad
- MVP: CA-xx · Reglas: RN-xx (`docs/reglas-de-negocio.md`)
- API: endpoints de `docs/contratos/api.md`
- Pantalla: fila de `docs/diseno/pantallas.md`

## Fuera de alcance
Lo que se parece pero NO entra en esta funcionalidad.
