# Gradia

Gradia: Sistema Web de Gestion Academica y Registro de Calificaciones.

## Requisitos

- Node.js 20.19 o superior.
- npm 10 o superior.
- PostgreSQL 16 o superior.

En este equipo se verifico Node.js `v22.20.0`, npm `10.9.3` y un servicio PostgreSQL activo llamado `postgresql-x64-18`.

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

## Produccion local

```bash
npm run build
npm run start --workspace=backend
```

El backend limpia `backend/dist`, compila solo `backend/src` y arranca desde `backend/dist/servidor.js`. Pruebas, seeders y migraciones no forman parte del artefacto de produccion. SIGINT y SIGTERM cierran HTTP y Prisma de forma controlada.

## Scripts

- `npm run dev`: inicia frontend y backend.
- `npm run dev:frontend`: inicia Vite.
- `npm run dev:backend`: inicia Express con `tsx`.
- `npm run lint`: valida estilo de codigo.
- `npm run test`: ejecuta pruebas unitarias, frontend e integracion PostgreSQL.
- `npm run test:unit`: ejecuta backend aislado y pruebas frontend sin PostgreSQL real.
- `npm run test:integration`: ejecuta integracion backend exclusivamente sobre `gradia_test`.
- `npm run build`: compila backend y frontend.
- `npm run start --workspace=backend`: inicia el backend compilado.
- `npm run db:generate`: genera Prisma Client.
- `npm run db:migrate`: aplica migraciones.
- `npm run db:seed`: ejecuta datos iniciales idempotentes.
- `npm run db:studio`: abre Prisma Studio.
- `npm run db:status`: muestra estado de migraciones.

## Contrato de API y salud

- `BigInt` y `Decimal` se entregan como string; las fechas se entregan en ISO 8601.
- Los errores usan `{ exito, mensaje, errores, codigo? }` y no exponen detalles internos.
- `/api/salud` devuelve 200 con todos los servicios disponibles y 503 si la API responde pero PostgreSQL esta desconectado.
- El frontend reserva “API no disponible” para errores de red, timeout o ausencia de respuesta.

Las variables `ADMIN_INICIAL_CORREO` y `ADMIN_INICIAL_CONTRASENA` son opcionales como conjunto. Si se configura una, debe configurarse la otra; la contrasena debe tener al menos 12 caracteres y no usar marcadores inseguros en produccion.

Las pruebas de integracion requieren un archivo local `backend/.env.test` con `NODE_ENV=test` y `DATABASE_URL_TEST` apuntando exactamente a `gradia_test`. El archivo esta ignorado por Git. La suite falla antes de modificar datos si falta la variable o el nombre no coincide; nunca reutiliza silenciosamente la base `gradia`.

Variables de autenticacion:

```env
JWT_SECRET=reemplazar_por_un_secreto_seguro
JWT_ACCESS_EXPIRACION=15m
REFRESH_TOKEN_DIAS=7
REFRESH_TOKEN_COOKIE=gradia_refresh_token
MAX_INTENTOS_LOGIN=5
MINUTOS_BLOQUEO_LOGIN=15
BCRYPT_COSTO=12
```

Los roles usan codigos estables (`ADMINISTRADOR`, `DOCENTE`, `ESTUDIANTE`). Los refresh tokens nunca se guardan en texto plano: `sesiones_autenticacion` almacena unicamente `token_hash` y metadatos de expiracion, revocacion y rotacion.

## API de autenticacion

- `POST /api/autenticacion/iniciar-sesion`: valida credenciales, devuelve access token y establece cookie HttpOnly.
- `POST /api/autenticacion/renovar`: rota la cookie refresh y devuelve un access token nuevo.
- `GET /api/autenticacion/yo`: devuelve usuario, rol y perfil asociado.
- `POST /api/autenticacion/cerrar-sesion`: revoca la sesion actual.
- `POST /api/autenticacion/cerrar-todas`: revoca todas las sesiones del usuario.
- `PATCH /api/autenticacion/cambiar-contrasena`: actualiza la clave, revoca sesiones y exige un nuevo login.

Las rutas protegidas reciben `Authorization: Bearer <access-token>`. CORS admite credenciales solo desde `ORIGEN_FRONTEND`. El contrato completo se encuentra en `docs/AUTENTICACION.md` y en Swagger bajo `/api/docs`.

## Comprobacion

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:status
npm run lint
npm run test
npm run build
```

La arquitectura contiene autenticacion y validaciones reutilizables de coherencia academica. Todavia no implementa autorización global por roles, gestion administrativa de usuarios ni CRUD academicos.

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
