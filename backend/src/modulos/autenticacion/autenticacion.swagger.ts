/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Access token JWT. La identidad, sesion y rol se validan nuevamente en PostgreSQL.
 *   responses:
 *     AutenticacionRequerida:
 *       description: Token ausente, invalido, vencido o asociado a una sesion no vigente.
 *     RolNoAutorizado:
 *       description: El rol vigente en PostgreSQL no permite acceder al recurso.
 *     CambioContrasenaRequerido:
 *       description: Debe actualizarse la contrasena antes de acceder a rutas protegidas generales.
 *   schemas:
 *     InicioSesion:
 *       type: object
 *       required: [correo, contrasena]
 *       properties:
 *         correo: { type: string, format: email }
 *         contrasena: { type: string, format: password }
 *     CambioContrasena:
 *       type: object
 *       required: [contrasenaActual, contrasenaNueva, confirmacionContrasena]
 *       properties:
 *         contrasenaActual: { type: string, format: password }
 *         contrasenaNueva: { type: string, format: password }
 *         confirmacionContrasena: { type: string, format: password }
 * /api/autenticacion/iniciar-sesion:
 *   post:
 *     summary: Inicia una sesion y establece la cookie HttpOnly de renovacion.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/InicioSesion' }
 *     responses:
 *       '200': { description: Inicio de sesion correcto }
 *       '401': { description: Credenciales invalidas }
 *       '429': { description: Limite de intentos por IP }
 * /api/autenticacion/renovar:
 *   post:
 *     summary: Rota el refresh token opaco y entrega un access token nuevo.
 *     responses:
 *       '200': { description: Sesion renovada }
 *       '401': { description: Refresh token invalido, vencido o reutilizado }
 * /api/autenticacion/yo:
 *   get:
 *     summary: Obtiene el usuario asociado al access token.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '200': { description: Usuario autenticado }
 *       '401': { $ref: '#/components/responses/AutenticacionRequerida' }
 * /api/autenticacion/cerrar-sesion:
 *   post:
 *     summary: Revoca la sesion actual de forma idempotente.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '200': { description: Sesion cerrada }
 *       '401': { $ref: '#/components/responses/AutenticacionRequerida' }
 * /api/autenticacion/cerrar-todas:
 *   post:
 *     summary: Revoca todas las sesiones del usuario.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '200': { description: Sesiones cerradas }
 *       '401': { $ref: '#/components/responses/AutenticacionRequerida' }
 * /api/autenticacion/cambiar-contrasena:
 *   patch:
 *     summary: Cambia la contrasena, revoca todas las sesiones y exige nuevo login.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CambioContrasena' }
 *     responses:
 *       '200': { description: Contrasena actualizada }
 *       '400': { description: Entrada invalida }
 *       '401': { $ref: '#/components/responses/AutenticacionRequerida' }
 *       '409': { description: Reutilizacion de contrasena }
 */
export const autenticacionDocumentada = true;
