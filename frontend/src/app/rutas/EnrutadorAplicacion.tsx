import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DisenioAdministrador } from '../../disenios/DisenioAdministrador';
import { DisenioDocente } from '../../disenios/DisenioDocente';
import { DisenioEstudiante } from '../../disenios/DisenioEstudiante';
import { DisenioPublico } from '../../disenios/DisenioPublico';
import { PanelAdministrador } from '../../paginas/administrador/PanelAdministrador';
import { PanelDocente } from '../../paginas/docente/PanelDocente';
import { PanelEstudiante } from '../../paginas/estudiante/PanelEstudiante';
import { AccesoNoAutorizado } from '../../paginas/publicas/AccesoNoAutorizado';
import { Inicio } from '../../paginas/publicas/Inicio';
import { PaginaNoEncontrada } from '../../paginas/publicas/PaginaNoEncontrada';
import { RutaCambioContrasena } from '../../modulos/autenticacion/componentes/RutaCambioContrasena';
import { RutaPorRol } from '../../modulos/autenticacion/componentes/RutaPorRol';
import { RutaProtegida } from '../../modulos/autenticacion/componentes/RutaProtegida';
import { RutaPublica } from '../../modulos/autenticacion/componentes/RutaPublica';
import { PaginaCambiarContrasena } from '../../modulos/autenticacion/paginas/PaginaCambiarContrasena';
import { PaginaIniciarSesion } from '../../modulos/autenticacion/paginas/PaginaIniciarSesion';
import { PaginaUsuarios } from '../../modulos/usuarios/paginas/PaginaUsuarios';

export function EnrutadorAplicacion() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DisenioPublico />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/sin-autorizacion" element={<AccesoNoAutorizado />} />
        </Route>
        <Route element={<RutaPublica />}>
          <Route path="/iniciar-sesion" element={<PaginaIniciarSesion />} />
        </Route>
        <Route element={<RutaCambioContrasena />}>
          <Route path="/cambiar-contrasena" element={<PaginaCambiarContrasena />} />
        </Route>
        <Route element={<RutaProtegida />}>
          <Route element={<RutaPorRol roles={['ADMINISTRADOR']} />}>
            <Route path="/administrador" element={<DisenioAdministrador />}>
              <Route index element={<PanelAdministrador />} />
              <Route path="usuarios" element={<PaginaUsuarios />} />
            </Route>
          </Route>
          <Route element={<RutaPorRol roles={['DOCENTE']} />}>
            <Route path="/docente" element={<DisenioDocente />}>
              <Route index element={<PanelDocente />} />
            </Route>
          </Route>
          <Route element={<RutaPorRol roles={['ESTUDIANTE']} />}>
            <Route path="/estudiante" element={<DisenioEstudiante />}>
              <Route index element={<PanelEstudiante />} />
            </Route>
          </Route>
        </Route>
        <Route path="/inicio" element={<Navigate to="/" replace />} />
        <Route path="*" element={<PaginaNoEncontrada />} />
      </Routes>
    </BrowserRouter>
  );
}
