import { useContext } from 'react';
import { AutenticacionContexto } from '../contexto/autenticacion.contexto';

export function useAutenticacion() {
  const contexto = useContext(AutenticacionContexto);
  if (!contexto) {
    throw new Error('useAutenticacion debe utilizarse dentro de ProveedorAutenticacion');
  }
  return contexto;
}
