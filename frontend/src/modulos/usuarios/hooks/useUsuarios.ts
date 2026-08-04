import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  actualizarUsuario,
  cambiarEstadoUsuario,
  consultarUsuario,
  crearUsuario,
  listarUsuarios,
  restablecerContrasena
} from '../servicios/usuarios.servicio';
import {
  ConsultaUsuarios,
  EntradaActualizarUsuario,
  EntradaCrearUsuario,
  EntradaEstadoUsuario,
  EntradaRestablecerContrasena
} from '../tipos/usuarios.tipos';

export const clavesUsuarios = {
  todas: ['usuarios'] as const,
  lista: (consulta: ConsultaUsuarios) => ['usuarios', 'lista', consulta] as const,
  detalle: (id: string) => ['usuarios', 'detalle', id] as const
};

export function useListaUsuarios(consulta: ConsultaUsuarios) {
  return useQuery({
    queryKey: clavesUsuarios.lista(consulta),
    queryFn: () => listarUsuarios(consulta),
    placeholderData: keepPreviousData
  });
}

export function useDetalleUsuario(id: string | null) {
  return useQuery({
    queryKey: clavesUsuarios.detalle(id ?? ''),
    queryFn: () => consultarUsuario(id ?? ''),
    enabled: Boolean(id)
  });
}

function useInvalidarUsuarios() {
  const cliente = useQueryClient();
  return () => cliente.invalidateQueries({ queryKey: clavesUsuarios.todas });
}

export function useCrearUsuario() {
  const invalidar = useInvalidarUsuarios();
  return useMutation({ mutationFn: (entrada: EntradaCrearUsuario) => crearUsuario(entrada), onSuccess: invalidar });
}

export function useActualizarUsuario(id: string) {
  const invalidar = useInvalidarUsuarios();
  return useMutation({
    mutationFn: (entrada: EntradaActualizarUsuario) => actualizarUsuario(id, entrada),
    onSuccess: invalidar
  });
}

export function useCambiarEstadoUsuario(id: string) {
  const invalidar = useInvalidarUsuarios();
  return useMutation({
    mutationFn: (entrada: EntradaEstadoUsuario) => cambiarEstadoUsuario(id, entrada),
    onSuccess: invalidar
  });
}

export function useRestablecerContrasena(id: string) {
  const invalidar = useInvalidarUsuarios();
  return useMutation({
    mutationFn: (entrada: EntradaRestablecerContrasena) => restablecerContrasena(id, entrada),
    onSuccess: invalidar
  });
}
