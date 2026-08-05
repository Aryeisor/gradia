import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RutaPorRol } from '../componentes/RutaPorRol';
import { RutaProtegida } from '../componentes/RutaProtegida';
import { RutaPublica } from '../componentes/RutaPublica';
import { PaginaCambiarContrasena } from '../paginas/PaginaCambiarContrasena';
import { PaginaIniciarSesion } from '../paginas/PaginaIniciarSesion';
import { UsuarioAutenticado } from '../tipos/autenticacion.tipos';
import { ValorAutenticacion } from '../contexto/autenticacion.contexto';

const autenticacion = vi.hoisted(() => ({ valor: null as ValorAutenticacion | null }));
vi.mock('../hooks/useAutenticacion', () => ({
  useAutenticacion: () => autenticacion.valor
}));

const usuarioBase: UsuarioAutenticado = {
  id: '1', nombres: 'Ada', apellidos: 'Lovelace', correo: 'ada@example.test',
  debeCambiarContrasena: false,
  rol: { codigo: 'ADMINISTRADOR', nombre: 'Administrador' }
};

function valor(parcial: Partial<ValorAutenticacion> = {}): ValorAutenticacion {
  return {
    estado: 'no_autenticado',
    usuario: null,
    iniciarSesion: vi.fn(),
    cambiarContrasena: vi.fn(),
    cerrarSesion: vi.fn(),
    cerrarTodasLasSesiones: vi.fn(),
    ...parcial
  };
}

beforeEach(() => {
  autenticacion.valor = valor();
});

describe('pagina de inicio de sesion', () => {
  function renderizarLogin() {
    return render(
      <MemoryRouter initialEntries={['/iniciar-sesion']}>
        <Routes>
          <Route path="/iniciar-sesion" element={<PaginaIniciarSesion />} />
          <Route path="/administrador" element={<p>panel administrador</p>} />
          <Route path="/cambiar-contrasena" element={<p>cambio requerido</p>} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('renderiza el formulario de login', () => {
    renderizarLogin();
    expect(screen.getByRole('heading', { name: 'Iniciar sesion' })).toBeInTheDocument();
    expect(screen.getByLabelText('Correo')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
  });

  it('valida un correo invalido', async () => {
    const usuario = userEvent.setup();
    renderizarLogin();
    await usuario.type(screen.getByLabelText('Correo'), 'correo-invalido');
    await usuario.type(screen.getByLabelText('Contraseña'), 'valor');
    await usuario.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText('Ingrese un correo valido')).toBeInTheDocument();
  });

  it('exige la contrasena', async () => {
    const usuario = userEvent.setup();
    renderizarLogin();
    await usuario.type(screen.getByLabelText('Correo'), 'ada@example.test');
    await usuario.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText('La contrasena es obligatoria')).toBeInTheDocument();
  });

  it('redirige al panel en un login correcto', async () => {
    const usuario = userEvent.setup();
    autenticacion.valor = valor({ iniciarSesion: vi.fn().mockResolvedValue(usuarioBase) });
    renderizarLogin();
    await usuario.type(screen.getByLabelText('Correo'), 'ada@example.test');
    await usuario.type(screen.getByLabelText('Contraseña'), 'Clave-Ficticia-2026!');
    await usuario.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText('panel administrador')).toBeInTheDocument();
  });

  it('muestra un error generico para login incorrecto', async () => {
    const usuario = userEvent.setup();
    autenticacion.valor = valor({ iniciarSesion: vi.fn().mockRejectedValue(new Error('401')) });
    renderizarLogin();
    await usuario.type(screen.getByLabelText('Correo'), 'ada@example.test');
    await usuario.type(screen.getByLabelText('Contraseña'), 'Incorrecta-2026!');
    await usuario.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible iniciar sesion');
  });
});

describe('rutas de autenticacion', () => {
  it('redirige una ruta privada sin sesion al login', () => {
    render(
      <MemoryRouter initialEntries={['/privada']}>
        <Routes>
          <Route element={<RutaProtegida />}><Route path="/privada" element={<p>privada</p>} /></Route>
          <Route path="/iniciar-sesion" element={<p>login requerido</p>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('login requerido')).toBeInTheDocument();
  });

  it('envia un rol incorrecto a sin autorizacion', () => {
    autenticacion.valor = valor({
      estado: 'autenticado',
      usuario: { ...usuarioBase, rol: { codigo: 'DOCENTE', nombre: 'Docente' } }
    });
    render(
      <MemoryRouter initialEntries={['/administrador']}>
        <Routes>
          <Route element={<RutaPorRol roles={['ADMINISTRADOR']} />}>
            <Route path="/administrador" element={<p>admin</p>} />
          </Route>
          <Route path="/sin-autorizacion" element={<p>sin autorizacion</p>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('sin autorizacion')).toBeInTheDocument();
  });

  it('redirige desde login al panel correspondiente al rol', () => {
    autenticacion.valor = valor({
      estado: 'autenticado',
      usuario: { ...usuarioBase, rol: { codigo: 'ESTUDIANTE', nombre: 'Estudiante' } }
    });
    render(
      <MemoryRouter initialEntries={['/iniciar-sesion']}>
        <Routes>
          <Route element={<RutaPublica />}><Route path="/iniciar-sesion" element={<p>login</p>} /></Route>
          <Route path="/estudiante" element={<p>panel estudiante</p>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('panel estudiante')).toBeInTheDocument();
  });

  it('redirige al cambio obligatorio antes de mostrar una ruta privada', () => {
    autenticacion.valor = valor({
      estado: 'autenticado',
      usuario: { ...usuarioBase, debeCambiarContrasena: true }
    });
    render(
      <MemoryRouter initialEntries={['/administrador']}>
        <Routes>
          <Route element={<RutaProtegida />}><Route path="/administrador" element={<p>admin</p>} /></Route>
          <Route path="/cambiar-contrasena" element={<p>cambio obligatorio</p>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('cambio obligatorio')).toBeInTheDocument();
  });
});

describe('cambio de contrasena', () => {
  it('limpia la sesion y redirige al login despues del cambio exitoso', async () => {
    const usuario = userEvent.setup();
    const cambiarContrasena = vi.fn().mockResolvedValue(undefined);
    autenticacion.valor = valor({ estado: 'autenticado', usuario: usuarioBase, cambiarContrasena });
    render(
      <MemoryRouter initialEntries={['/cambiar-contrasena']}>
        <Routes>
          <Route path="/cambiar-contrasena" element={<PaginaCambiarContrasena />} />
          <Route path="/iniciar-sesion" element={<p>nuevo inicio requerido</p>} />
        </Routes>
      </MemoryRouter>
    );
    await usuario.type(screen.getByLabelText('Contrasena actual'), 'Actual-Segura-2026!');
    await usuario.type(screen.getByLabelText('Nueva contrasena'), 'Nueva-Segura-2026!X');
    await usuario.type(screen.getByLabelText('Confirmar contrasena'), 'Nueva-Segura-2026!X');
    await usuario.click(screen.getByRole('button', { name: 'Actualizar contrasena' }));
    await waitFor(() => expect(cambiarContrasena).toHaveBeenCalledOnce());
    expect(await screen.findByText('nuevo inicio requerido')).toBeInTheDocument();
  });
});
