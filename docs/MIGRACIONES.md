# Migraciones

## Configurar DATABASE_URL

Copie `backend/.env.example` a `backend/.env` y reemplace:

```env
DATABASE_URL=postgresql://usuario:contrasena@localhost:5432/gradia
```

Use credenciales reales de PostgreSQL. No publique el archivo `.env`.

## Crear la base de datos

Desde consola:

```bash
createdb -U postgres gradia
```

Desde pgAdmin, cree una base llamada `gradia`.

## Ejecutar migraciones

```bash
npm run db:generate
npm run db:migrate
npm run db:status
```

La migracion inicial se llama `estructura_inicial_gradia` y contiene SQL adicional para restricciones parciales de PostgreSQL que Prisma no expresa directamente.

Migraciones incrementales actuales:

- `ajustes_arquitectura_pre_autenticacion`: indices relacionales.
- `autenticacion_estructura_sesiones`: codigos estables de rol, estado de seguridad del usuario y sesiones renovables.

La migracion de autenticacion agrega primero `roles.codigo` como nullable, asigna los codigos a los roles existentes y solo despues aplica `NOT NULL` y unicidad. No recrea roles ni usuarios.

## Ejecutar seeders

```bash
npm run db:seed
```

El seeder es idempotente. Inserta roles, niveles educativos, grados, areas academicas y asignaturas iniciales. Solo crea usuario administrador inicial si existen `ADMIN_INICIAL_CORREO` y `ADMIN_INICIAL_CONTRASENA`.

Los roles se actualizan por `codigo`. El administrador inicial queda activo, sin bloqueo, con cero intentos fallidos y obligado a cambiar la contrasena inicial. El seeder nunca registra la contrasena.

En cierre de fase 8 el seeder fue inspeccionado y no se ejecuto sobre `gradia`: aunque es idempotente para catalogos, si `ADMIN_INICIAL_CORREO` y `ADMIN_INICIAL_CONTRASENA` existen, el `upsert` del administrador inicial actualiza correo, hash de contrasena, estado activo, bloqueo e intentos fallidos. Esa conducta es util para inicializacion controlada, pero no debe ejecutarse durante un cierre tecnico que exige conservar usuarios y credenciales existentes.

## Prisma Studio

```bash
npm run db:studio
```

## Verificaciones de base de datos

Las pruebas de integracion actuales usan exclusivamente `backend/.env.test` y `DATABASE_URL_TEST` apuntando exactamente a `gradia_test`:

```bash
npm run test:integration
```

Estas pruebas verifican conexion, 22 tablas funcionales, relaciones, indices, autenticacion, control de acceso y gestion de usuarios. Preparan datos ficticios solo en `gradia_test` y limpian usuarios, sesiones y auditorias tecnicas al finalizar. No reinician ni eliminan datos de `gradia`.

## Futuras migraciones

Modifique `backend/prisma/schema.prisma` y ejecute:

```bash
npm --workspace backend run db:migrate -- --name nombre_de_la_migracion
```

## Comandos destructivos

`prisma migrate reset` elimina datos. No esta configurado como script principal y no debe ejecutarse sin respaldo y autorizacion explicita.
