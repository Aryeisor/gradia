/**
 * @openapi
 * components:
 *   schemas:
 *     PerfilDocente:
 *       type: object
 *       nullable: true
 *       properties:
 *         id: { type: string, example: '20' }
 *         codigoDocente: { type: string, maxLength: 30, example: DOC-2026-01 }
 *         especialidad: { type: string, nullable: true, maxLength: 150, example: Matematicas }
 *         telefono: { type: string, nullable: true, maxLength: 30, example: '+570000000000' }
 *         estado: { type: string, example: ACTIVO }
 *         creadoEn: { type: string, format: date-time }
 *         actualizadoEn: { type: string, format: date-time }
 *     PerfilEstudiante:
 *       type: object
 *       nullable: true
 *       properties:
 *         id: { type: string, example: '30' }
 *         codigoEstudiante: { type: string, maxLength: 30, example: EST-2026-01 }
 *         fechaNacimiento: { type: string, format: date, example: '2012-05-10' }
 *         telefono: { type: string, nullable: true, maxLength: 30, example: '+570000000001' }
 *         direccion: { type: string, nullable: true, maxLength: 200, example: Calle Ficticia 123 }
 *         estado: { type: string, example: ACTIVO }
 *         creadoEn: { type: string, format: date-time }
 *         actualizadoEn: { type: string, format: date-time }
 *     UsuarioAdministrado:
 *       type: object
 *       required: [id, nombres, apellidos, tipoDocumento, numeroDocumento, correo, estado, debeCambiarContrasena, creadoEn, actualizadoEn, rol]
 *       properties:
 *         id: { type: string, example: '15', description: Identificador BIGINT serializado como string. }
 *         nombres: { type: string, example: Diana }
 *         apellidos: { type: string, example: Docente }
 *         tipoDocumento: { type: string, example: CC }
 *         numeroDocumento: { type: string, example: DOC-FICTICIO-15 }
 *         correo: { type: string, format: email, example: diana.docente@example.test }
 *         estado: { type: boolean, example: true }
 *         debeCambiarContrasena: { type: boolean, example: true }
 *         ultimoAcceso: { type: string, format: date-time, nullable: true }
 *         creadoEn: { type: string, format: date-time }
 *         actualizadoEn: { type: string, format: date-time }
 *         rol: { $ref: '#/components/schemas/RolAutenticado' }
 *         docente: { $ref: '#/components/schemas/PerfilDocente' }
 *         estudiante: { $ref: '#/components/schemas/PerfilEstudiante' }
 *     ResultadoUsuarios:
 *       type: object
 *       required: [usuarios, paginacion]
 *       properties:
 *         usuarios:
 *           type: array
 *           items: { $ref: '#/components/schemas/UsuarioAdministrado' }
 *         paginacion:
 *           type: object
 *           required: [pagina, limite, total, totalPaginas]
 *           properties:
 *             pagina: { type: integer, minimum: 1, example: 1 }
 *             limite: { type: integer, minimum: 1, maximum: 100, example: 10 }
 *             total: { type: integer, minimum: 0, example: 2 }
 *             totalPaginas: { type: integer, minimum: 0, example: 1 }
 *     RespuestaListaUsuarios:
 *       allOf:
 *         - { $ref: '#/components/schemas/RespuestaExitosa' }
 *         - type: object
 *           properties:
 *             datos: { $ref: '#/components/schemas/ResultadoUsuarios' }
 *     RespuestaUsuario:
 *       allOf:
 *         - { $ref: '#/components/schemas/RespuestaExitosa' }
 *         - type: object
 *           properties:
 *             datos:
 *               type: object
 *               required: [usuario]
 *               properties:
 *                 usuario: { $ref: '#/components/schemas/UsuarioAdministrado' }
 *     EntradaPerfilDocente:
 *       type: object
 *       additionalProperties: false
 *       required: [codigoDocente]
 *       properties:
 *         codigoDocente: { type: string, maxLength: 30, example: DOC-2026-01 }
 *         especialidad: { type: string, nullable: true, maxLength: 150, example: Ciencias Naturales }
 *         telefono: { type: string, nullable: true, maxLength: 30, example: '+570000000000' }
 *     EntradaPerfilEstudiante:
 *       type: object
 *       additionalProperties: false
 *       required: [codigoEstudiante, fechaNacimiento]
 *       properties:
 *         codigoEstudiante: { type: string, maxLength: 30, example: EST-2026-01 }
 *         fechaNacimiento: { type: string, format: date, example: '2012-05-10' }
 *         telefono: { type: string, nullable: true, maxLength: 30, example: '+570000000001' }
 *         direccion: { type: string, nullable: true, maxLength: 200, example: Calle Ficticia 123 }
 *     EntradaCrearUsuarioBase:
 *       type: object
 *       additionalProperties: false
 *       required: [nombres, apellidos, tipoDocumento, numeroDocumento, correo, contrasenaTemporal]
 *       properties:
 *         nombres: { type: string, maxLength: 100, example: Ana }
 *         apellidos: { type: string, maxLength: 100, example: Administradora }
 *         tipoDocumento: { type: string, maxLength: 30, example: CC }
 *         numeroDocumento: { type: string, maxLength: 30, example: ADM-FICTICIO-01 }
 *         correo: { type: string, format: email, maxLength: 150, example: ana.admin@example.test }
 *         contrasenaTemporal: { type: string, format: password, writeOnly: true, minLength: 1, maxLength: 72, example: Ficticia-Segura-2026! }
 *     EntradaCrearAdministrador:
 *       allOf:
 *         - { $ref: '#/components/schemas/EntradaCrearUsuarioBase' }
 *         - type: object
 *           additionalProperties: false
 *           required: [rol]
 *           properties:
 *             rol: { type: string, enum: [ADMINISTRADOR], example: ADMINISTRADOR }
 *             perfil: { type: object, additionalProperties: false, example: {} }
 *     EntradaCrearDocente:
 *       allOf:
 *         - { $ref: '#/components/schemas/EntradaCrearUsuarioBase' }
 *         - type: object
 *           additionalProperties: false
 *           required: [rol, perfil]
 *           properties:
 *             rol: { type: string, enum: [DOCENTE], example: DOCENTE }
 *             perfil: { $ref: '#/components/schemas/EntradaPerfilDocente' }
 *     EntradaCrearEstudiante:
 *       allOf:
 *         - { $ref: '#/components/schemas/EntradaCrearUsuarioBase' }
 *         - type: object
 *           additionalProperties: false
 *           required: [rol, perfil]
 *           properties:
 *             rol: { type: string, enum: [ESTUDIANTE], example: ESTUDIANTE }
 *             perfil: { $ref: '#/components/schemas/EntradaPerfilEstudiante' }
 *     EntradaCrearUsuario:
 *       oneOf:
 *         - { $ref: '#/components/schemas/EntradaCrearAdministrador' }
 *         - { $ref: '#/components/schemas/EntradaCrearDocente' }
 *         - { $ref: '#/components/schemas/EntradaCrearEstudiante' }
 *       discriminator:
 *         propertyName: rol
 *     EntradaActualizarUsuario:
 *       type: object
 *       additionalProperties: false
 *       description: El rol no forma parte del contrato de edicion general.
 *       properties:
 *         nombres: { type: string, maxLength: 100, example: Diana }
 *         apellidos: { type: string, maxLength: 100, example: Docente }
 *         tipoDocumento: { type: string, maxLength: 30, example: CC }
 *         numeroDocumento: { type: string, maxLength: 30, example: DOC-FICTICIO-15 }
 *         correo: { type: string, format: email, maxLength: 150, example: diana.docente@example.test }
 *         perfil:
 *           type: object
 *           additionalProperties: false
 *           properties:
 *             codigoDocente: { type: string, maxLength: 30, example: DOC-2026-01 }
 *             especialidad: { type: string, nullable: true, maxLength: 150, example: Matematicas }
 *             codigoEstudiante: { type: string, maxLength: 30, example: EST-2026-01 }
 *             fechaNacimiento: { type: string, format: date, example: '2012-05-10' }
 *             telefono: { type: string, nullable: true, maxLength: 30, example: '+570000000000' }
 *             direccion: { type: string, nullable: true, maxLength: 200, example: Calle Ficticia 123 }
 *     EntradaEstadoUsuario:
 *       type: object
 *       additionalProperties: false
 *       required: [estado, motivo]
 *       properties:
 *         estado: { type: boolean, example: false }
 *         motivo: { type: string, maxLength: 500, example: Retiro temporal documentado }
 *     EntradaRestablecerContrasena:
 *       type: object
 *       additionalProperties: false
 *       required: [contrasenaTemporal, confirmacionContrasena]
 *       properties:
 *         contrasenaTemporal: { type: string, format: password, writeOnly: true, minLength: 1, maxLength: 72, example: Ficticia-Temporal-2026! }
 *         confirmacionContrasena: { type: string, format: password, writeOnly: true, minLength: 1, maxLength: 72, example: Ficticia-Temporal-2026! }
 *
 * /api/usuarios:
 *   get:
 *     tags: [Usuarios]
 *     summary: Lista usuarios con paginacion y filtros.
 *     description: Exclusivo para ADMINISTRADOR. Busca por nombre, correo, documento, codigo docente o codigo estudiantil.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: pagina, schema: { type: integer, minimum: 1, maximum: 1000000, default: 1 }, example: 1 }
 *       - { in: query, name: limite, schema: { type: integer, minimum: 1, maximum: 100, default: 20 }, example: 10 }
 *       - { in: query, name: buscar, schema: { type: string, maxLength: 150 }, example: diana }
 *       - { in: query, name: rol, schema: { type: string, enum: [ADMINISTRADOR, DOCENTE, ESTUDIANTE] }, example: DOCENTE }
 *       - { in: query, name: estado, schema: { type: boolean }, example: true }
 *     responses:
 *       '200':
 *         description: Pagina de usuarios.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RespuestaListaUsuarios' }
 *       '400': { $ref: '#/components/responses/EntradaInvalida' }
 *       '401': { $ref: '#/components/responses/AutenticacionRequerida' }
 *       '403':
 *         description: Rol no autorizado o cambio de contrasena requerido.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorApi' }
 *       '500': { $ref: '#/components/responses/ErrorInterno' }
 *       '503': { $ref: '#/components/responses/ServicioNoDisponible' }
 *   post:
 *     tags: [Usuarios]
 *     summary: Crea un usuario y su perfil compatible dentro de una transaccion.
 *     description: El rol define si el perfil debe omitirse, ser docente o ser estudiantil.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/EntradaCrearUsuario' }
 *     responses:
 *       '201':
 *         description: Usuario creado sin exponer contrasena ni hash.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RespuestaUsuario' }
 *       '400': { $ref: '#/components/responses/EntradaInvalida' }
 *       '401': { $ref: '#/components/responses/AutenticacionRequerida' }
 *       '403': { $ref: '#/components/responses/RolNoAutorizado' }
 *       '409': { $ref: '#/components/responses/Conflicto' }
 *       '500': { $ref: '#/components/responses/ErrorInterno' }
 *       '503': { $ref: '#/components/responses/ServicioNoDisponible' }
 *
 * /api/usuarios/{id}:
 *   parameters:
 *     - { in: path, name: id, required: true, schema: { type: string, pattern: '^\\d+$' }, example: '15' }
 *   get:
 *     tags: [Usuarios]
 *     summary: Consulta el detalle seguro de un usuario.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '200':
 *         description: Detalle del usuario, rol y perfil compatible.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RespuestaUsuario' }
 *       '400': { $ref: '#/components/responses/EntradaInvalida' }
 *       '401': { $ref: '#/components/responses/AutenticacionRequerida' }
 *       '403': { $ref: '#/components/responses/RolNoAutorizado' }
 *       '404': { description: Usuario no encontrado. }
 *       '500': { $ref: '#/components/responses/ErrorInterno' }
 *       '503': { $ref: '#/components/responses/ServicioNoDisponible' }
 *   patch:
 *     tags: [Usuarios]
 *     summary: Actualiza datos generales y del perfil sin cambiar el rol.
 *     description: Si el cuerpo incluye rol, la validacion estricta responde 400.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/EntradaActualizarUsuario' }
 *     responses:
 *       '200':
 *         description: Usuario actualizado.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RespuestaUsuario' }
 *       '400': { $ref: '#/components/responses/EntradaInvalida' }
 *       '401': { $ref: '#/components/responses/AutenticacionRequerida' }
 *       '403': { $ref: '#/components/responses/RolNoAutorizado' }
 *       '404': { description: Usuario no encontrado. }
 *       '409': { $ref: '#/components/responses/Conflicto' }
 *       '500': { $ref: '#/components/responses/ErrorInterno' }
 *       '503': { $ref: '#/components/responses/ServicioNoDisponible' }
 *
 * /api/usuarios/{id}/estado:
 *   patch:
 *     tags: [Usuarios]
 *     summary: Activa o desactiva un usuario sin eliminarlo.
 *     description: La desactivacion revoca sesiones. El backend impide autodesactivacion y conservar cero administradores activos.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, pattern: '^\\d+$' }, example: '15' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/EntradaEstadoUsuario' }
 *     responses:
 *       '200':
 *         description: Estado actualizado.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RespuestaUsuario' }
 *       '400': { $ref: '#/components/responses/EntradaInvalida' }
 *       '401': { $ref: '#/components/responses/AutenticacionRequerida' }
 *       '403': { $ref: '#/components/responses/RolNoAutorizado' }
 *       '404': { description: Usuario no encontrado. }
 *       '409': { $ref: '#/components/responses/Conflicto' }
 *       '500': { $ref: '#/components/responses/ErrorInterno' }
 *       '503': { $ref: '#/components/responses/ServicioNoDisponible' }
 *
 * /api/usuarios/{id}/restablecer-contrasena:
 *   post:
 *     tags: [Usuarios]
 *     summary: Establece una contrasena temporal y revoca todas las sesiones.
 *     description: No devuelve la contrasena temporal ni el hash. Marca cambio obligatorio.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, pattern: '^\\d+$' }, example: '15' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/EntradaRestablecerContrasena' }
 *     responses:
 *       '200': { description: Contrasena restablecida sin devolver datos sensibles. }
 *       '400': { $ref: '#/components/responses/EntradaInvalida' }
 *       '401': { $ref: '#/components/responses/AutenticacionRequerida' }
 *       '403': { $ref: '#/components/responses/RolNoAutorizado' }
 *       '404': { description: Usuario no encontrado. }
 *       '409': { $ref: '#/components/responses/Conflicto' }
 *       '500': { $ref: '#/components/responses/ErrorInterno' }
 *       '503': { $ref: '#/components/responses/ServicioNoDisponible' }
 */
export {};
