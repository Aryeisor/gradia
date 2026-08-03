export type DetalleError = Record<string, unknown> | unknown[];

export class ErrorAplicacion extends Error {
  readonly codigoHttp: number;
  readonly codigoInterno?: string;
  readonly detalles?: DetalleError;
  readonly esOperacional: boolean;

  constructor(
    mensaje: string,
    codigoHttp = 500,
    opciones: {
      codigoInterno?: string;
      detalles?: DetalleError;
      esOperacional?: boolean;
      causa?: unknown;
    } = {}
  ) {
    super(mensaje, { cause: opciones.causa });
    this.name = new.target.name;
    this.codigoHttp = codigoHttp;
    this.codigoInterno = opciones.codigoInterno;
    this.detalles = opciones.detalles;
    this.esOperacional = opciones.esOperacional ?? true;
  }
}

export class ErrorValidacion extends ErrorAplicacion {
  constructor(mensaje = 'Los datos enviados no son validos', detalles?: DetalleError) {
    super(mensaje, 400, { codigoInterno: 'VALIDACION', detalles });
  }
}

export class ErrorNoAutenticado extends ErrorAplicacion {
  constructor(mensaje = 'Autenticacion requerida', codigoInterno = 'AUTENTICACION_REQUERIDA') {
    super(mensaje, 401, { codigoInterno });
  }
}

export class ErrorSinPermisos extends ErrorAplicacion {
  constructor(mensaje = 'No tiene permisos para realizar esta accion', codigoInterno = 'ROL_NO_AUTORIZADO') {
    super(mensaje, 403, { codigoInterno });
  }
}

export class ErrorNoEncontrado extends ErrorAplicacion {
  constructor(mensaje = 'Recurso no encontrado') {
    super(mensaje, 404, { codigoInterno: 'NO_ENCONTRADO' });
  }
}

export class ErrorConflicto extends ErrorAplicacion {
  constructor(mensaje = 'La operacion entra en conflicto con el estado actual') {
    super(mensaje, 409, { codigoInterno: 'CONFLICTO' });
  }
}

export class ErrorServicioNoDisponible extends ErrorAplicacion {
  constructor(mensaje = 'Servicio temporalmente no disponible') {
    super(mensaje, 503, { codigoInterno: 'SERVICIO_NO_DISPONIBLE' });
  }
}

export class ErrorLimiteSolicitudes extends ErrorAplicacion {
  constructor(mensaje = 'Demasiadas solicitudes. Intente nuevamente mas tarde') {
    super(mensaje, 429, { codigoInterno: 'LIMITE_SOLICITUDES' });
  }
}
