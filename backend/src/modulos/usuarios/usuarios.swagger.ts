/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     UsuarioAdministrado:
 *       type: object
 *       properties:
 *         id: { type: string, example: '15' }
 *         nombres: { type: string }
 *         apellidos: { type: string }
 *         tipoDocumento: { type: string }
 *         numeroDocumento: { type: string }
 *         correo: { type: string, format: email }
 *         estado: { type: boolean }
 *         debeCambiarContrasena: { type: boolean }
 *         ultimoAcceso: { type: string, format: date-time, nullable: true }
 *         rol:
 *           type: object
 *           properties:
 *             codigo: { type: string, enum: [ADMINISTRADOR, DOCENTE, ESTUDIANTE] }
 *             nombre: { type: string }
 *         docente: { type: object, nullable: true }
 *         estudiante: { type: object, nullable: true }
 *     ErrorUsuarios:
 *       type: object
 *       properties:
 *         exito: { type: boolean, example: false }
 *         mensaje: { type: string }
 *         codigo: { type: string }
 *         errores: { type: array, items: { type: object } }
 *
 * /api/usuarios:
 *   get:
 *     tags: [Usuarios]
 *     summary: Lista usuarios con paginacion y filtros.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: pagina, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limite, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *       - { in: query, name: buscar, schema: { type: string } }
 *       - { in: query, name: rol, schema: { type: string, enum: [ADMINISTRADOR, DOCENTE, ESTUDIANTE] } }
 *       - { in: query, name: estado, schema: { type: boolean } }
 *     responses:
 *       200: { description: Pagina de usuarios. }
 *       400: { description: Parametros invalidos. }
 *       401: { description: Autenticacion requerida. }
 *       403: { description: Rol no autorizado o cambio de contrasena requerido. }
 *   post:
 *     tags: [Usuarios]
 *     summary: Crea un usuario y su perfil compatible dentro de una transaccion.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombres, apellidos, tipoDocumento, numeroDocumento, correo, contrasenaTemporal, rol]
 *             properties:
 *               nombres: { type: string }
 *               apellidos: { type: string }
 *               tipoDocumento: { type: string }
 *               numeroDocumento: { type: string }
 *               correo: { type: string, format: email }
 *               contrasenaTemporal: { type: string, format: password, writeOnly: true }
 *               rol: { type: string, enum: [ADMINISTRADOR, DOCENTE, ESTUDIANTE] }
 *               perfil: { type: object }
 *     responses:
 *       201: { description: Usuario creado. }
 *       400: { description: Entrada o perfil incompatible. }
 *       401: { description: Autenticacion requerida. }
 *       403: { description: Operacion no autorizada. }
 *       409: { description: Correo, documento o codigo duplicado. }
 *
 * /api/usuarios/{id}:
 *   parameters:
 *     - { in: path, name: id, required: true, schema: { type: string } }
 *   get:
 *     tags: [Usuarios]
 *     summary: Consulta el detalle seguro de un usuario.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Detalle del usuario. }
 *       401: { description: Autenticacion requerida. }
 *       403: { description: Operacion no autorizada. }
 *       404: { description: Usuario no encontrado. }
 *   patch:
 *     tags: [Usuarios]
 *     summary: Actualiza datos generales y del perfil sin cambiar el rol.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: Usuario actualizado. }
 *       400: { description: Entrada invalida o intento de cambiar el rol. }
 *       401: { description: Autenticacion requerida. }
 *       403: { description: Operacion no autorizada. }
 *       404: { description: Usuario no encontrado. }
 *       409: { description: Dato unico duplicado. }
 *
 * /api/usuarios/{id}/estado:
 *   patch:
 *     tags: [Usuarios]
 *     summary: Activa o desactiva un usuario sin eliminarlo.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estado, motivo]
 *             properties:
 *               estado: { type: boolean }
 *               motivo: { type: string }
 *     responses:
 *       200: { description: Estado actualizado; al desactivar se revocan las sesiones. }
 *       401: { description: Autenticacion requerida. }
 *       403: { description: Operacion no autorizada. }
 *       404: { description: Usuario no encontrado. }
 *       409: { description: Autodesactivacion o ultimo administrador protegido. }
 *
 * /api/usuarios/{id}/restablecer-contrasena:
 *   post:
 *     tags: [Usuarios]
 *     summary: Establece una contrasena temporal y revoca todas las sesiones.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contrasenaTemporal, confirmacionContrasena]
 *             properties:
 *               contrasenaTemporal: { type: string, format: password, writeOnly: true }
 *               confirmacionContrasena: { type: string, format: password, writeOnly: true }
 *     responses:
 *       200: { description: Contrasena restablecida sin devolverla. }
 *       400: { description: Politica o confirmacion invalida. }
 *       401: { description: Autenticacion requerida. }
 *       403: { description: Operacion no autorizada. }
 *       404: { description: Usuario no encontrado. }
 */
export {};
