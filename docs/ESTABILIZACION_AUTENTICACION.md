# Estabilizacion de autenticacion - fase 3.1

## Objetivo y estado inicial

La fase 3.1 valida integralmente la autenticacion backend sin iniciar control de acceso por roles ni gestion de usuarios. Al comenzar, `gradia` y `gradia_test` tenian tres migraciones y 22 tablas funcionales. La suite aprobaba 84 pruebas backend y 9 frontend, pero omitia cuatro verificaciones PostgreSQL.

## Entorno de pruebas

`backend/.env.test` es local y esta ignorado por Git. Debe definir `NODE_ENV=test` y `DATABASE_URL_TEST`; no se admite `DATABASE_URL` como respaldo. `vitest.integration.config.ts` carga el archivo mediante `dotenv`, valida la URL y solo entonces asigna la conexion al proceso de Prisma. El entorno unitario utiliza valores tecnicos ficticios y no conecta con PostgreSQL.

La funcion `exigirUrlBasePruebas` usa `new URL()`, exige PostgreSQL y acepta exclusivamente el nombre `gradia_test`. Rechaza `gradia`, `postgres`, `template0`, `template1`, variables ausentes, URL invalidas y cualquier otro nombre sin reproducir credenciales.

## Separacion de pruebas

- `npm run test:unit`: backend aislado y frontend; no requiere PostgreSQL.
- `npm run test:integration`: PostgreSQL real, exclusivamente mediante `DATABASE_URL_TEST`.
- `npm run test`: ejecuta ambos grupos en ese orden.

Las cuatro verificaciones antes omitidas ahora se ejecutan realmente. Comprueban tablas principales; catalogos idempotentes y codigos de rol; campos de seguridad y ausencia de sesiones residuales; claves foraneas e indices de sesiones. Antes dependian de `EJECUTAR_PRUEBAS_DB=true`; ahora forman parte obligatoria de la configuracion de integracion.

El resultado final fue de 92 pruebas unitarias backend, 9 pruebas frontend y 13 pruebas de integracion: 114 pruebas aprobadas, sin casos omitidos ni pendientes.

## Datos ficticios y limpieza

La factory crea cinco cuentas ficticias: administrador activo, administrador con cambio obligatorio, usuario inactivo, usuario para bloqueo y segundo usuario para aislamiento. Las claves se generan aleatoriamente en memoria, se procesan con bcrypt real y no se registran ni documentan.

Antes y despues de cada escenario se valida primero la URL y despues `current_database()`. La limpieza solo selecciona documentos con el prefijo tecnico `IT-AUTH-`, elimina sus sesiones y auditorias respetando claves foraneas, y finalmente elimina esos usuarios. No borra tablas, migraciones ni catalogos y no usa `migrate reset`.

## Flujos HTTP verificados

| Flujo | Resultado real |
| --- | --- |
| Inicio de sesion | HTTP 200, usuario seguro, rol, indicador de cambio, access token y cookie; sesion y auditoria persistidas. |
| `/yo` | HTTP 200 con token vigente; HTTP 401 sin token, mal formado, firma invalida o vencido. |
| Renovacion | HTTP 200, nueva sesion y cookie; anterior revocada, enlazada y con ultimo uso. Casos invalidos: HTTP 401 y borrado de cookie. |
| Reutilizacion | HTTP 401; revoca la cadena, invalida el token rotado, audita el incidente y mantiene aislada otra cuenta. |
| Cerrar sesion | HTTP 200 e idempotente; revoca la actual. Reutilizar despues esa cookie activa la defensa de reutilizacion. |
| Cerrar todas | HTTP 200; revoca todas las sesiones del usuario, conserva las de otra cuenta y borra la cookie. |
| Cambiar contrasena | 401 sin autenticacion o clave actual incorrecta; 400 ante confirmacion/politica invalida; 409 al reutilizar; 200 al cambiar correctamente. |
| Bloqueo | Credenciales invalidas devuelven el mismo 401; se registran intentos, bloqueo y fecha; bloqueo vigente devuelve 409 y el vencido se limpia al autenticar. |
| Rate limiting | Al superar el limite configurado responde 429 sin revelar existencia de cuentas. |

El cambio correcto genera un hash nuevo, actualiza `contrasena_actualizada_en`, desactiva `debe_cambiar_contrasena`, revoca sesiones y exige un nuevo login. La clave anterior deja de funcionar y la nueva permite autenticacion.

## Cookies y auditoria

La cookie refresh fue comprobada como `HttpOnly`, `SameSite=Lax`, limitada a `/api/autenticacion` y sin `Secure` en pruebas; la prueba unitaria confirma `Secure` en produccion. El refresh token solo se conserva como SHA-256 en PostgreSQL y nunca aparece en la respuesta JSON.

La auditoria conserva accion, usuario, IP, agente, fecha, resultado y motivo sanitizado. El filtro elimina variantes de contrasenas, hashes, access/refresh tokens, cookies, `Authorization`, secretos JWT y URL de bases. El logger redacta `Authorization`, `Cookie`, `DATABASE_URL`, `DATABASE_URL_TEST` y `JWT_SECRET`.

## Hallazgos corregidos

- El login propagaba campos adicionales de Prisma mediante un `spread`; podia incluir `contrasenaHash`. Se reemplazo por un mapeo explicito del contrato seguro.
- Cada instancia de aplicacion reutilizaba un Router global y el mismo almacen del rate limiter. Ahora cada aplicacion crea sus rutas y limitador de forma aislada.
- Los intentos fallidos y el bloqueo ahora se auditan dentro de la misma transaccion que actualiza el usuario.
- Se amplio la sanitizacion de auditoria y logs para todas las claves sensibles requeridas.

## Auditoria npm

Estado inicial y posterior: 9 alertas totales (`5 moderate`, `2 high`, `2 critical`) y 4 dentro del arbol marcado como produccion (`2 moderate`, `1 high`, `1 critical`). `npm audit fix --dry-run` no propuso cambios compatibles. No se uso `--force` y no se actualizaron paquetes.

| Paquete | Tipo y alcance | Riesgo en Gradia | Correccion y decision |
| --- | --- | --- | --- |
| `react-router-dom` / `react-router` | Directa/transitiva, frontend de produccion, moderada | El open redirect puede alcanzar navegacion cliente; la variante SSR no aplica porque Gradia no usa SSR. | La rama corregida disponible es 7.x. Cambio mayor aplazado; limitar destinos de navegacion a rutas internas. |
| `tar` / `@mapbox/node-pre-gyp` | Transitiva de bcrypt, produccion segun npm, critica/alta | Se usa durante instalacion de binarios, no en endpoints ni para procesar archivos de usuarios en runtime. | La correccion sale del contrato 6.x y conduce a bcrypt 6. Mantener lockfile y registros confiables; migrar con pruebas en una fase dedicada. |
| `vite` / `esbuild` | Directa/transitiva, desarrollo, alta/moderada | Afecta el servidor de desarrollo; Vite no se publica como servidor de produccion. | npm exige Vite 8, cambio mayor. Usar dev server solo en localhost y actualizar en una fase dedicada. |
| `vitest` / `vite-node` / `@vitest/mocker` | Directa/transitivas, desarrollo, critica/moderadas | Solo ejecutan pruebas con fuentes controladas; no forman parte del artefacto backend/frontend. | npm exige Vitest 4, cambio mayor. Mantener CI aislado y planificar migracion conjunta. |

No queda una vulnerabilidad critica de runtime alcanzable con correccion compatible disponible. Permanecen alertas de instalacion/desarrollo y una migracion mayor pendiente; deben revisarse de nuevo antes de despliegue publico.

## Prisma 7

Gradia usa Prisma `6.19.3`. La propiedad `prisma.seed` de `backend/package.json` genera una advertencia porque Prisma 7 trasladara esta configuracion a `prisma.config.ts`. Es deuda tecnica no bloqueante: no se migro ahora para evitar alterar seeders y migraciones. La futura actualizacion debe crear la configuracion oficial, probar generate/migrate/seed y actualizar Prisma de manera controlada.

## Comandos reproducibles

```bash
npm install
npm ls
npm run db:status
npm run test:unit
npm run test:integration
npm run lint
npm run test
npm run build
npm audit
npm audit --omit=dev
```

## Aislamiento, limitaciones y siguiente fase

`gradia` no participa en pruebas y conserva estructura, datos, usuarios y sesiones. `gradia_test` queda sin usuarios, sesiones ni auditorias ficticias al finalizar y puede prepararse de nuevo de forma segura. No se implementaron autorizacion global, gestion de usuarios ni frontend de autenticacion.

La siguiente fase es control de acceso: middleware de autenticacion reutilizable, autorizacion por `roles.codigo` y politica de cambio obligatorio, despues de aprobar su diseno independiente.
