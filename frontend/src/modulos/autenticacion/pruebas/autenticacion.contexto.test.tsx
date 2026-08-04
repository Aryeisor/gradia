import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const servicios = vi.hoisted(() => ({
  iniciarSesionApi: vi.fn(),
  renovarSesionApi: vi.fn(),
  consultarUsuarioActualApi: vi.fn(),
  cambiarContrasenaApi: vi.fn(),
  cerrarSesionApi: vi.fn(),
  cerrarTodasLasSesionesApi: vi.fn()
}));

vi.mock('../servicios/autenticacion.servicio', () => servicios);

import { ProveedorAutenticacion } from '../contexto/AutenticacionContexto';
import { useAutenticacion } from '../hooks/useAutenticacion';
import { limpiarTokenAcceso, obtenerTokenAcceso } from '../servicios/token-acceso.memoria';
import { UsuarioAutenticado } from '../tipos/autenticacion.tipos';

const usuario: UsuarioAutenticado = {
  id: '1',
  nombres: 'Ada',
  apellidos: 'Lovelace',
  correo: 'ada@example.test',
  debeCambiarContrasena: false,
  rol: { codigo: 'ADMINISTRADOR', nombre: 'Administrador' }
};

function SondaAutenticacion() {
  const autenticacion = useAutenticacion();
  const [error, setError] = useState(false);
  return (
    <div>
      <span data-testid="estado">{autenticacion.estado}</span>
      <span data-testid="usuario">{autenticacion.usuario?.correo ?? 'sin-usuario'}</span>
      <span data-testid="error">{error ? 'error' : 'sin-error'}</span>
      <button onClick={() => void autenticacion.iniciarSesion({
        correo: 'ada@example.test', contrasena: 'Clave-Ficticia-2026!'
      }).catch(() => setError(true))}>login</button>
      <button onClick={() => void autenticacion.cerrarSesion()}>logout</button>
    </div>
  );
}

function renderizar() {
  return render(
    <ProveedorAutenticacion>
      <SondaAutenticacion />
    </ProveedorAutenticacion>
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  limpiarTokenAcceso();
  localStorage.clear();
  sessionStorage.clear();
});

describe('ProveedorAutenticacion', () => {
  it('mantiene el estado inicializando mientras restaura la sesion', () => {
    servicios.renovarSesionApi.mockReturnValue(new Promise(() => undefined));
    renderizar();
    expect(screen.getByTestId('estado')).toHaveTextContent('inicializando');
  });

  it('restaura correctamente mediante renovar y consultar yo', async () => {
    servicios.renovarSesionApi.mockResolvedValue('access-restaurado');
    servicios.consultarUsuarioActualApi.mockResolvedValue(usuario);
    renderizar();
    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('autenticado'));
    expect(screen.getByTestId('usuario')).toHaveTextContent(usuario.correo);
    expect(obtenerTokenAcceso()).toBe('access-restaurado');
  });

  it('queda no autenticado cuando falla la restauracion', async () => {
    servicios.renovarSesionApi.mockRejectedValue(new Error('sin cookie'));
    renderizar();
    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('no_autenticado'));
    expect(obtenerTokenAcceso()).toBeNull();
  });

  it('inicia sesion y conserva el token solo en memoria', async () => {
    servicios.renovarSesionApi.mockRejectedValue(new Error('sin cookie'));
    servicios.iniciarSesionApi.mockResolvedValue({ tokenAcceso: 'access-login', usuario });
    renderizar();
    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('no_autenticado'));
    fireEvent.click(screen.getByRole('button', { name: 'login' }));
    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('autenticado'));
    expect(obtenerTokenAcceso()).toBe('access-login');
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it('conserva estado no autenticado ante login incorrecto', async () => {
    servicios.renovarSesionApi.mockRejectedValue(new Error('sin cookie'));
    servicios.iniciarSesionApi.mockRejectedValue(new Error('credenciales'));
    renderizar();
    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('no_autenticado'));
    fireEvent.click(screen.getByRole('button', { name: 'login' }));
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('error'));
    expect(screen.getByTestId('estado')).toHaveTextContent('no_autenticado');
  });

  it('cierra la sesion remota y limpia usuario y token', async () => {
    servicios.renovarSesionApi.mockResolvedValue('access-restaurado');
    servicios.consultarUsuarioActualApi.mockResolvedValue(usuario);
    servicios.cerrarSesionApi.mockResolvedValue(undefined);
    renderizar();
    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('autenticado'));
    fireEvent.click(screen.getByRole('button', { name: 'logout' }));
    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('no_autenticado'));
    expect(servicios.cerrarSesionApi).toHaveBeenCalledOnce();
    expect(obtenerTokenAcceso()).toBeNull();
  });
});
