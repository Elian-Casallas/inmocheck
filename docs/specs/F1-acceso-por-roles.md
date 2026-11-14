# F1 · Acceso por roles

## Historia
Como administrador o inspector, quiero entrar con mi correo y contraseña para ver solo lo que me corresponde según mi rol y mi inmobiliaria.

## Comportamiento
1. El usuario abre `/login`, escribe correo y contraseña y entra.
2. El administrador llega a `/dashboard` (Resumen). El inspector llega a `/dashboard/mis-inspecciones`.
3. El menú muestra solo las opciones de su rol. En el celular se ve una barra inferior.
4. Si olvidó la contraseña, pide un enlace en `/recuperar-contrasena` y define una nueva.
5. El administrador invita inspectores desde `/dashboard/inspectores`, y ellos crean su contraseña con el enlace del correo.

## Criterios de aceptación
- [ ] Sin sesión, entrar a cualquier ruta de `/dashboard` lleva a `/login`.
- [ ] Con el correo vacío o mal escrito aparece "Escribe un correo válido." bajo el campo.
- [ ] El botón del ojo muestra y oculta la contraseña.
- [ ] Con `admin@pinos.test` el menú muestra Resumen, Inmuebles, Inspecciones, Propietarios, Inspectores e Informes.
- [ ] Con `laura@pinos.test` el menú muestra solo Mis inspecciones, Inmuebles e Informes.
- [ ] Un inspector que escribe `/dashboard/propietarios` en la barra no ve la pantalla de propietarios (página 403).
- [ ] Una contraseña nueva sin números muestra "Incluye al menos un número.".
- [ ] El administrador de Los Pinos no ve inmuebles de Andes.
- [ ] "Cerrar sesión" vuelve a `/login`, y el botón atrás no muestra el dashboard.

## Casos especiales
- Una cuenta desactivada no puede operar, aunque tenga una sesión abierta.
- Recuperar contraseña responde igual exista o no el correo, para no revelar cuentas.

## Trazabilidad
- MVP: CA-01, CA-02, CA-03, CA-14 · Reglas: RN-10 y la matriz de permisos
- API: `/auth/*`, `/inspectores/invitaciones`, `/inspectores/{id}/acceso`
- Prototipo: `3-sistema-y-compartidas/login.html`, `recuperar-contrasena.html`, `nueva-contrasena.html`
- Manuales: administrador §1–2, inspector §1

## Fuera de alcance
Registro público, inicio de sesión con Google y acceso para propietarios.
