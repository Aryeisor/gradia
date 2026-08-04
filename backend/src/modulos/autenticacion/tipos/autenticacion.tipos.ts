export const codigosRol = ['ADMINISTRADOR', 'DOCENTE', 'ESTUDIANTE'] as const;

export type CodigoRol = (typeof codigosRol)[number];

export function esCodigoRol(codigo: string): codigo is CodigoRol {
  return codigosRol.includes(codigo as CodigoRol);
}

export type PayloadTokenAcceso = {
  sub: string;
  rol: CodigoRol;
  sid: string;
  tipo: 'access';
  iat: number;
  exp: number;
};
