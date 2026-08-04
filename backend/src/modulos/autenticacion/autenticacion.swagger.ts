/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Access token JWT. El backend vuelve a validar usuario, sesion y rol vigente en PostgreSQL.
 *     refreshCookie:
 *       type: apiKey
 *       in: cookie
 *       name: gradia_refresh_token
 *       description: Cookie HttpOnly de refresh token opaco. El nombre real proviene de REFRESH_TOKEN_COOKIE.
 *   schemas:
 *     RespuestaExitosa:
 *       type: object
 *       required: [exito, mensaje]
 *       properties:
 *         exito: { type: boolean, example: true }
 *         mensaje: { type: string, example: Operacion completada }
 *         datos: { type: object, nullable: true }
 *     ErrorApi:
 *       type: object
 *       required: [exito, mensaje, errores]
 *       properties:
 *         exito: { type: boolean, example: false }
 *         mensaje: { type: string, example: Autenticacion requerida }
 *         codigo:
 *           type: string
 *           enum:
 *             - AUTENTICACION_REQUERIDA
 *             - TOKEN_INVALIDO
 *             - TOKEN_VENCIDO
 *             - SESION_INVALIDA
 *             - USUARIO_INACTIVO
 *             - CREDENCIALES_DESACTUALIZADAS
 *             - ROL_NO_AUTORIZADO
 *             - CAMBIO_CONTRASENA_REQUERIDO
 *             - VALIDACION
 *             - CONFLICTO
 *             - LIMITE_SOLICITUDES
 *             - ERROR_INTERNO
 *             - SERVICIO_NO_DISPONIBLE
 *         errores:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               campo: { type: string, example: correo }
 *               mensaje: { type: string, example: El correo no es valido }
 *     RolAutenticado:
 *       type: object
 *       required: [codigo, nombre]
 *       properties:
 *         codigo: { type: string, enum: [ADMINISTRADOR, DOCENTE, ESTUDIANTE], example: ADMINISTRADOR }
 *         nombre: { type: string, example: Administrador }
 *     UsuarioAutenticacion:
 *       type: object
 *       required: [id, nombres, apellidos, correo, estado, debeCambiarContrasena, rol]
 *       properties:
 *         id: { type: string, example: '1', description: Identificador BIGINT serializado como string. }
 *         nombres: { type: string, example: Ana }
 *         apellidos: { type: string, example: Administradora }
 *         correo: { type: string, format: email, example: ana.admin@example.test }
 *         estado: { type: boolean, example: true }
 *         debeCambiarContrasena: { type: boolean, example: false }
 *         rol: { $ref: '#/components/schemas/RolAutenticado' }
 *         docente: { type: object, nullable: true, example: null }
 *         estudiante: { type: object, nullable: true, example: null }
 *     InicioSesion:
 *       type: object
 *       additionalProperties: false
 *       required: [correo, contrasena]
 *       properties:
 *         correo: { type: string, format: email, maxLength: 150, example: ana.admin@example.test }
 *         contrasena: { type: string, format: password, minLength: 1, maxLength: 72, writeOnly: true, example: Ficticia-Segura-2026! }
 *     CambioContrasena:
 *       type: object
 *       additionalProperties: false
 *       required: [contrasenaActual, contrasenaNueva, confirmacionContrasena]
 *       properties:
 *         contrasenaActual: { type: string, format: password, minLength: 1, maxLength: 72, writeOnly: true, example: Ficticia-Anterior-2026! }
 *         contrasenaNueva: { type: string, format: password, minLength: 1, maxLength: 72, writeOnly: true, example: Ficticia-Nueva-2026! }
 *         confirmacionContrasena: { type: string, format: password, minLength: 1, maxLength: 72, writeOnly: true, example: Ficticia-Nueva-2026! }
 *     RespuestaInicioSesion:
 *       allOf:
 *         - { $ref: '#/components/schemas/RespuestaExitosa' }
 *         - type: object
 *           properties:
 *             datos:
 *               type: object
 *               required: [tokenAcceso, usuario]
 *               properties:
 *                 tokenAcceso:
 *                   type: string
 *                   description: JWT de acceso. Ejemplo abreviado; no usar tokens reales en documentacion.
 *                   example: eyJhbGciOiJIUzI1NiJ9.ejemplo.firma
 *                 usuario: { $ref: '#/components/schemas/UsuarioAutenticacion' }
 *     RespuestaRenovacion:
 *       allOf:
 *         - { $ref: '#/components/schemas/RespuestaExitosa' }
 *         - type: object
 *           properties:
 *             datos:
 *               type: object
 *               required: [tokenAcceso]
 *               properties:
 *                 tokenAcceso:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiJ9.ejemplo.firma
 *     RespuestaYo:
 *       allOf:
 *         - { $ref: '#/components/schemas/RespuestaExitosa' }
 *         - type: object
 *           properties:
 *             datos:
 *               type: object
 *               required: [usuario]
 *               properties:
 *                 usuario: { $ref: '#/components/schemas/UsuarioAutenticacion' }
 *   responses:
 *     EntradaInvalida:
 *       description: Cuerpo, parametros o reglas de validacion invalidas.
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ErrorApi' }
 *     AutenticacionRequerida:
 *       description: Token ausente, invalido, vencido, sesion no vigente, usuario inactivo o credenciales desactualizadas.
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ErrorApi' }
 *           examples:
 *             requerida:
 *               value: { exito: false, mensaje: Autenticacion requerida, codigo: AUTENTICACION_REQUERIDA, errores: [] }
 *             tokenVencido:
 *               value: { exito: false, mensaje: Token vencido, codigo: TOKEN_VENCIDO, errores: [] }
 *             sesionInvalida:
 *               value: { exito: false, mensaje: La sesion no es valida, codigo: SESION_INVALIDA, errores: [] }
 *     RolNoAutorizado:
 *       description: Identidad valida, pero el rol vigente no permite acceder al recurso.
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ErrorApi' }
 *           examples:
 *             rol:
 *               value: { exito: false, mensaje: No tiene permisos para realizar esta accion, codigo: ROL_NO_AUTORIZADO, errores: [] }
 *     CambioContrasenaRequerido:
 *       description: La cuenta debe cambiar su contrasena antes de acceder a rutas protegidas generales.
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ErrorApi' }
 *           examples:
 *             cambio:
 *               value: { exito: false, mensaje: Debe cambiar la contrasena antes de continuar, codigo: CAMBIO_CONTRASENA_REQUERIDO, errores: [] }
 *     Conflicto:
 *       description: La operacion entra en conflicto con el estado actual.
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ErrorApi' }
 *     LimiteSolicitudes:
 *       description: Limite de solicitudes o intentos superado.
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ErrorApi' }
 *     ErrorInterno:
 *       description: Error interno no controlado. La respuesta no expone stack, SQL ni secretos.
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ErrorApi' }
 *     ServicioNoDisponible:
 *       description: Servicio de datos temporalmente no disponible.
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ErrorApi' }
 *
 * /api/autenticacion/iniciar-sesion:
 *   post:
 *     tags: [Autenticacion]
 *     summary: Inicia una sesion y establece la cookie HttpOnly de renovacion.
 *     description: Publico respecto del Bearer JWT. Usa mensajes genericos para no enumerar usuarios.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/InicioSesion' }
 *     responses:
 *       '200':
 *         description: Inicio de sesion correcto. Devuelve access token y usuario seguro; la cookie refresh viaja en Set-Cookie.
 *         headers:
 *           Set-Cookie:
 *             schema: { type: string }
 *             description: Cookie HttpOnly, SameSite=Lax y Secure en produccion.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RespuestaInicioSesion' }
 *       '400': { $ref: '#/components/responses/EntradaInvalida' }
 *       '401': { description: Credenciales invalidas, usuario inactivo o bloqueo vigente sin enumerar cuentas. }
 *       '429': { $ref: '#/components/responses/LimiteSolicitudes' }
 *       '500': { $ref: '#/components/responses/ErrorInterno' }
 *       '503': { $ref: '#/components/responses/ServicioNoDisponible' }
 *
 * /api/autenticacion/renovar:
 *   post:
 *     tags: [Autenticacion]
 *     summary: Rota el refresh token opaco y entrega un access token nuevo.
 *     description: Usa solo la cookie HttpOnly. Si detecta reutilizacion, revoca la cadena del usuario.
 *     security: [{ refreshCookie: [] }]
 *     responses:
 *       '200':
 *         description: Sesion renovada. La cookie refresh se reemplaza.
 *         headers:
 *           Set-Cookie:
 *             schema: { type: string }
 *             description: Nueva cookie HttpOnly de refresh token opaco.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RespuestaRenovacion' }
 *       '401': { $ref: '#/components/responses/AutenticacionRequerida' }
 *       '500': { $ref: '#/components/responses/ErrorInterno' }
 *       '503': { $ref: '#/components/responses/ServicioNoDisponible' }
 *
 * /api/autenticacion/yo:
 *   get:
 *     tags: [Autenticacion]
 *     summary: Obtiene el usuario asociado al access token.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '200':
 *         description: Usuario autenticado con rol y perfil seguro.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RespuestaYo' }
 *       '401': { $ref: '#/components/responses/AutenticacionRequerida' }
 *       '500': { $ref: '#/components/responses/ErrorInterno' }
 *       '503': { $ref: '#/components/responses/ServicioNoDisponible' }
 *
 * /api/autenticacion/cerrar-sesion:
 *   post:
 *     tags: [Autenticacion]
 *     summary: Revoca la sesion actual de forma idempotente.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '200': { description: Sesion cerrada y cookie refresh borrada. }
 *       '401': { $ref: '#/components/responses/AutenticacionRequerida' }
 *       '500': { $ref: '#/components/responses/ErrorInterno' }
 *       '503': { $ref: '#/components/responses/ServicioNoDisponible' }
 *
 * /api/autenticacion/cerrar-todas:
 *   post:
 *     tags: [Autenticacion]
 *     summary: Revoca todas las sesiones del usuario autenticado.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '200': { description: Todas las sesiones del usuario fueron cerradas y la cookie refresh fue borrada. }
 *       '401': { $ref: '#/components/responses/AutenticacionRequerida' }
 *       '500': { $ref: '#/components/responses/ErrorInterno' }
 *       '503': { $ref: '#/components/responses/ServicioNoDisponible' }
 *
 * /api/autenticacion/cambiar-contrasena:
 *   patch:
 *     tags: [Autenticacion]
 *     summary: Cambia la contrasena, revoca todas las sesiones y exige nuevo login.
 *     description: Permanece disponible cuando CAMBIO_CONTRASENA_REQUERIDO esta activo.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CambioContrasena' }
 *     responses:
 *       '200': { description: Contrasena actualizada; sesiones revocadas y cookie borrada. }
 *       '400': { $ref: '#/components/responses/EntradaInvalida' }
 *       '401': { $ref: '#/components/responses/AutenticacionRequerida' }
 *       '409': { $ref: '#/components/responses/Conflicto' }
 *       '500': { $ref: '#/components/responses/ErrorInterno' }
 *       '503': { $ref: '#/components/responses/ServicioNoDisponible' }
 */
export const autenticacionDocumentada = true;
