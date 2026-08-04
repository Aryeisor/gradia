import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FormularioUsuario } from '../componentes/FormularioUsuario';
import { UsuarioDetalle } from '../tipos/usuarios.tipos';

async function completarComunes(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(screen.getByLabelText('Nombres'), 'Luisa');
  await usuario.type(screen.getByLabelText('Apellidos'), 'Prueba');
  await usuario.type(screen.getByLabelText('Tipo de documento'), 'CC');
  await usuario.type(screen.getByLabelText('Número de documento'), '9001');
  await usuario.type(screen.getByLabelText('Correo institucional'), 'luisa@example.test');
}

async function completarContrasena(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(screen.getByLabelText('Contraseña temporal'), 'Temporal-Segura-2026!');
  await usuario.type(screen.getByLabelText('Confirmación'), 'Temporal-Segura-2026!');
}

describe('formularios de usuarios', () => {
  it('crea un administrador', async () => {
    const alEnviar = vi.fn();
    const usuario = userEvent.setup();
    render(<FormularioUsuario modo="crear" enviando={false} alCancelar={vi.fn()} alEnviar={alEnviar} />);
    await completarComunes(usuario);
    await usuario.selectOptions(screen.getByLabelText('Rol'), 'ADMINISTRADOR');
    await completarContrasena(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Crear usuario' }));
    await waitFor(() => expect(alEnviar).toHaveBeenCalledWith(expect.objectContaining({ rol: 'ADMINISTRADOR' }), expect.anything()));
  });

  it('crea un docente con campos condicionales', async () => {
    const alEnviar = vi.fn();
    const usuario = userEvent.setup();
    render(<FormularioUsuario modo="crear" enviando={false} alCancelar={vi.fn()} alEnviar={alEnviar} />);
    await completarComunes(usuario);
    expect(screen.getByLabelText('Código docente')).toBeInTheDocument();
    await usuario.type(screen.getByLabelText('Código docente'), 'DOC-90');
    await usuario.type(screen.getByLabelText('Especialidad'), 'Física');
    await completarContrasena(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Crear usuario' }));
    await waitFor(() => expect(alEnviar).toHaveBeenCalledWith(expect.objectContaining({ rol: 'DOCENTE', codigoDocente: 'DOC-90' }), expect.anything()));
  });

  it('crea un estudiante y cambia los campos condicionales', async () => {
    const alEnviar = vi.fn();
    const usuario = userEvent.setup();
    render(<FormularioUsuario modo="crear" enviando={false} alCancelar={vi.fn()} alEnviar={alEnviar} />);
    await completarComunes(usuario);
    await usuario.selectOptions(screen.getByLabelText('Rol'), 'ESTUDIANTE');
    expect(screen.queryByLabelText('Código docente')).not.toBeInTheDocument();
    await usuario.type(screen.getByLabelText('Código estudiantil'), 'EST-90');
    await usuario.type(screen.getByLabelText('Fecha de nacimiento'), '2012-05-10');
    await completarContrasena(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Crear usuario' }));
    await waitFor(() => expect(alEnviar).toHaveBeenCalledWith(expect.objectContaining({ rol: 'ESTUDIANTE', codigoEstudiante: 'EST-90' }), expect.anything()));
  });

  it('muestra errores duplicados enviados por la página', () => {
    render(<FormularioUsuario modo="crear" enviando={false} errorGeneral="Ya existe un usuario con ese correo" alCancelar={vi.fn()} alEnviar={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Ya existe un usuario');
  });

  it('edita datos permitidos y mantiene el rol inmutable', async () => {
    const detalle: UsuarioDetalle = {
      id: '2', nombres: 'Diana', apellidos: 'Docente', tipoDocumento: 'CC', numeroDocumento: '100', correo: 'diana@example.test',
      estado: true, ultimoAcceso: null, debeCambiarContrasena: false, creadoEn: '2026-01-01', actualizadoEn: '2026-01-01',
      rol: { codigo: 'DOCENTE', nombre: 'Docente' }, estudiante: null,
      docente: { id: '20', codigoDocente: 'DOC-20', especialidad: 'Física', telefono: null, estado: 'ACTIVO' }
    };
    const alEnviar = vi.fn();
    const usuario = userEvent.setup();
    render(<FormularioUsuario modo="editar" usuario={detalle} enviando={false} alCancelar={vi.fn()} alEnviar={alEnviar} />);
    expect(screen.getByRole('combobox', { name: 'Rol' })).toBeDisabled();
    await usuario.clear(screen.getByLabelText('Especialidad'));
    await usuario.type(screen.getByLabelText('Especialidad'), 'Química');
    await usuario.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(alEnviar).toHaveBeenCalledWith(expect.objectContaining({ especialidad: 'Química', rol: 'DOCENTE' }), expect.anything()));
  });
});
