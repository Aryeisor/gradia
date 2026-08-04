import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { RutaPorRol } from '../../autenticacion/componentes/RutaPorRol';

vi.mock('../../autenticacion/hooks/useAutenticacion', () => ({
  useAutenticacion: () => ({
    estado: 'autenticado',
    usuario: { id: '2', nombres: 'Diana', apellidos: 'Docente', rol: { codigo: 'DOCENTE', nombre: 'Docente' } }
  })
}));

describe('acceso a gestión visual de usuarios', () => {
  it('bloquea a un usuario no administrador', () => {
    render(
      <MemoryRouter initialEntries={['/administrador/usuarios']}>
        <Routes>
          <Route element={<RutaPorRol roles={['ADMINISTRADOR']} />}>
            <Route path="/administrador/usuarios" element={<p>gestión usuarios</p>} />
          </Route>
          <Route path="/sin-autorizacion" element={<p>sin autorización</p>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('sin autorización')).toBeInTheDocument();
    expect(screen.queryByText('gestión usuarios')).not.toBeInTheDocument();
  });
});
