# Arquitectura de Gradia

Gradia utiliza una arquitectura cliente-servidor.

```text
Frontend React + TypeScript + Vite
        |
        | HTTP / JSON con Axios
        v
Backend Node.js + Express + TypeScript
        |
        | Prisma ORM
        v
PostgreSQL
```

## Frontend

El frontend se ubica en `frontend/` y contiene rutas publicas e iniciales para perfiles de administrador, docente y estudiante. Usa React Router, TanStack Query, Axios, Tailwind CSS y Sonner.

La pagina inicial consulta `GET /api/salud` mediante Axios. No simula datos academicos.

## Backend

El backend se ubica en `backend/` y separa responsabilidades asi:

```text
Solicitud HTTP
        |
Rutas
        |
Middlewares
        |
Controladores
        |
Servicios
        |
Prisma ORM
        |
PostgreSQL
```

Los controladores no consultan Prisma directamente. La verificacion de base de datos vive en el servicio de salud.

Los controladores asincronos se envuelven con `manejadorAsincrono`, que propaga rechazos al middleware central. Los servicios y validaciones de dominio lanzan errores tipados y no dependen de Express.

Las rutas protegidas usan `autenticar`, `exigirContrasenaActualizada` y `autorizarRoles` antes del controlador. `autenticar` valida JWT, usuario y sesion, y construye una identidad minima tipada en `req.usuarioAutenticado`. PostgreSQL es la fuente de verdad para estado, sesion y rol; los controladores no reinterpretan el access token.

## Respuestas y errores

Las respuestas exitosas usan una utilidad central. Antes de enviarlas, los datos se transforman recursivamente: `BigInt` y `Prisma.Decimal` son strings, `Date` usa ISO 8601 y los arreglos y objetos anidados mantienen la misma estructura. Esto evita perdida de precision y no modifica globalmente `BigInt.prototype`.

Los errores operacionales usan los codigos 400, 401, 403, 404, 409 y 503. Los errores desconocidos son 500, se registran con Pino y no exponen stack, SQL, credenciales ni detalles internos en la respuesta.

```json
{ "exito": false, "mensaje": "Descripcion comprensible", "errores": [], "codigo": "CODIGO_OPCIONAL" }
```

## Ejecucion y cierre

`npm run build` limpia `backend/dist` y compila unicamente `backend/src`. El artefacto de entrada es `backend/dist/servidor.js` y se ejecuta con `npm run start --workspace=backend`.

El proceso maneja SIGINT, SIGTERM, errores HTTP, rechazos no controlados y excepciones no capturadas. Deja de aceptar solicitudes, cierra HTTP, desconecta Prisma y cuenta con un timeout de 10 segundos antes de forzar la salida.

## API inicial

- `GET /api/salud`: devuelve 200 cuando API y PostgreSQL funcionan, o 503 cuando Express funciona pero PostgreSQL no. La ausencia de respuesta HTTP representa una API inaccesible.
- `GET /api/docs`: documentacion OpenAPI inicial.

Los endpoints actuales de consulta y cierre de autenticacion usan el middleware definitivo. Login y renovacion permanecen publicos respecto del access token. Los routers usados para probar roles se construyen solo dentro de las pruebas y no forman parte de la API normal.

## Variables de entorno

El backend valida variables obligatorias con Zod. `ADMIN_INICIAL_CORREO` y `ADMIN_INICIAL_CONTRASENA` son opcionales como conjunto: ambas deben existir o ambas deben estar ausentes. En produccion se rechazan marcadores inseguros.

## Validaciones relacionales

`compartido/validaciones/validaciones-coherencia-academica.ts` concentra reglas que requieren consultas: rol/perfil, area/asignatura, grupo/plan, asignaciones, actividades, calificaciones y matricula activa anual. Reciben Prisma o un cliente transaccional, diferencian ausencia y conflicto, y no crean registros.
