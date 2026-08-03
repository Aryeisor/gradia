export const codigosRol = ['ADMINISTRADOR', 'DOCENTE', 'ESTUDIANTE'] as const;

export type CodigoRol = (typeof codigosRol)[number];

export type PayloadTokenAcceso = {
  sub: string;
  rol: CodigoRol;
  sid: string;
  tipo: 'access';
  iat: number;
  exp: number;
};
