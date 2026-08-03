import { CodigoRol } from '../tipos/autenticacion.tipos';

export function rutaInicialPorRol(rol: CodigoRol): string {
  const rutas: Record<CodigoRol, string> = {
    ADMINISTRADOR: '/administrador',
    DOCENTE: '/docente',
    ESTUDIANTE: '/estudiante'
  };
  return rutas[rol];
}
