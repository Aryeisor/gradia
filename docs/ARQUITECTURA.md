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

## API inicial

- `GET /api/salud`: verifica API y conexion real con PostgreSQL.
- `GET /api/docs`: documentacion OpenAPI inicial.

## Variables de entorno

El backend valida variables obligatorias con Zod. Si falta `DATABASE_URL`, `JWT_SECRET` u otro valor requerido, la aplicacion no inicia.
