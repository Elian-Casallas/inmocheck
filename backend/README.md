# InmoCheck · Backend (Spring Boot)

API REST de InmoCheck. Diseño y plan: `../docs/arquitectura.md` y la sección 5 de `../docs/tareas.md`.

## Requisitos
- Java 21. No hace falta instalar Maven: el wrapper `mvnw` descarga la versión correcta.

## Configuración
Copia `.env.example` como `.env` y llena los valores (`.env` no se sube a git). Sin `SUPABASE_URL` o sin los datos de la base, la app no arranca.

Las pruebas que no necesitan base corren siempre. `AislamientoRlsTest` usa la base real de Supabase (solo lee) y se salta si `.env` no tiene `SUPABASE_DB_URL`.

## Comandos (desde `backend/`)
| Qué | Windows (PowerShell) |
|---|---|
| Pruebas | `.\mvnw.cmd test` |
| Levantar en local (puerto 8080) | `.\mvnw.cmd spring-boot:run` |
| Generar el `.jar` para AWS | `.\mvnw.cmd package` → `target/inmocheck-backend-0.0.1-SNAPSHOT.jar` |

Comprobar que está vivo: http://localhost:8080/actuator/health → `{"status":"UP"}`.

Todo lo demás exige `Authorization: Bearer <JWT de Supabase>`. Sin token, o con un token inválido, responde `401` en `application/problem+json`.

## Falla intermitente de DNS en local
A veces `AislamientoRlsTest` falla con `UnknownHostException: aws-…pooler.supabase.com` aunque el host sea correcto: el pooler apunta a un balanceador de AWS cuyo nombre rota y la red local no siempre lo resuelve a tiempo. Vuelve a correr las pruebas; si pasa sola, no es un error del código.

## Problema conocido en Windows
Si al arrancar aparece `Unable to establish loopback connection`, Java no logra crear su socket interno en la carpeta temporal del usuario (pasa cuando el nombre de usuario tiene espacios). Se arregla indicándole una carpeta sin espacios:

```powershell
New-Item -ItemType Directory -Force C:\tmp\jdk-sockets
$env:JAVA_TOOL_OPTIONS = "-Djdk.net.unixdomain.tmpdir=C:\tmp\jdk-sockets"
.\mvnw.cmd spring-boot:run
```

En AWS (Linux) no ocurre.
