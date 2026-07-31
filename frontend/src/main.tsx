import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'sonner';
import { ProveedoresAplicacion } from './app/proveedores/ProveedoresAplicacion';
import { EnrutadorAplicacion } from './app/rutas/EnrutadorAplicacion';
import './estilos/global.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ProveedoresAplicacion>
      <EnrutadorAplicacion />
      <Toaster richColors position="top-right" />
    </ProveedoresAplicacion>
  </React.StrictMode>
);
