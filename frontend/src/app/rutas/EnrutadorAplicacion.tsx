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
import { IniciarSesion } from '../../paginas/publicas/IniciarSesion';
import { PaginaNoEncontrada } from '../../paginas/publicas/PaginaNoEncontrada';

export function EnrutadorAplicacion() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DisenioPublico />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/iniciar-sesion" element={<IniciarSesion />} />
          <Route path="/sin-autorizacion" element={<AccesoNoAutorizado />} />
        </Route>
        <Route path="/administrador" element={<DisenioAdministrador />}>
          <Route index element={<PanelAdministrador />} />
        </Route>
        <Route path="/docente" element={<DisenioDocente />}>
          <Route index element={<PanelDocente />} />
        </Route>
        <Route path="/estudiante" element={<DisenioEstudiante />}>
          <Route index element={<PanelEstudiante />} />
        </Route>
        <Route path="/inicio" element={<Navigate to="/" replace />} />
        <Route path="*" element={<PaginaNoEncontrada />} />
      </Routes>
    </BrowserRouter>
  );
}
