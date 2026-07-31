# Gradia

Gradia: Sistema Web de Gestion Academica y Registro de Calificaciones.

## Requisitos

- Node.js 20.19 o superior.
- npm 10 o superior.
- PostgreSQL 16 o superior.

En este equipo se detecto Node.js `v24.14.1`, npm `11.11.0`, Git `2.53.0.windows.2` y un servicio PostgreSQL activo llamado `postgresql-x64-18`.

## Configuracion inicial

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Copiar variables de entorno:

   ```bash
   copy backend\.env.example backend\.env
   copy frontend\.env.example frontend\.env
   ```

3. Editar `backend/.env` con credenciales reales de PostgreSQL. No use contrasenas de ejemplo en ambientes reales.

4. Crear la base de datos `gradia` si no existe:

   ```bash
   createdb -U postgres gradia
   ```

   Tambien puede crearla desde pgAdmin.

5. Ejecutar Prisma:

   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   npm run db:status
   ```

6. Ejecutar la aplicacion:

   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev`: inicia frontend y backend.
- `npm run dev:frontend`: inicia Vite.
- `npm run dev:backend`: inicia Express con `tsx`.
- `npm run lint`: valida estilo de codigo.
- `npm run test`: ejecuta pruebas minimas.
- `npm run build`: compila backend y frontend.
- `npm run db:generate`: genera Prisma Client.
- `npm run db:migrate`: aplica migraciones.
- `npm run db:seed`: ejecuta datos iniciales idempotentes.
- `npm run db:studio`: abre Prisma Studio.
- `npm run db:status`: muestra estado de migraciones.

## Estructura

```text
gradia/
  frontend/
  backend/
  docs/
  package.json
  README.md
```

El archivo `GRADIA.docx` no estaba presente al iniciar esta fase. Si se agrega luego, debe conservarse como documentacion del proyecto.
