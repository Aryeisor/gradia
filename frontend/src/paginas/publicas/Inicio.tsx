import { Activity, AlertTriangle, CheckCircle2, ServerCrash } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { consultarSalud } from '../../servicios/salud.service';

export function Inicio() {
  const consulta = useQuery({
    queryKey: ['salud'],
    queryFn: consultarSalud
  });

  const estado = obtenerEstado(consulta.status, consulta.data?.datos?.base_datos);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-12">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gradia-verde">
          Sistema web academico
        </p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight text-gradia-tinta md:text-6xl">
          Gradia
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
          Plataforma cliente-servidor para iniciar la gestion academica y el registro de
          calificaciones con React, Node.js, Prisma ORM y PostgreSQL.
        </p>
        <div className="mt-10 border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            {estado.icono}
            <div>
              <h2 className="text-lg font-semibold">{estado.titulo}</h2>
              <p className="text-sm text-slate-600">{estado.descripcion}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function obtenerEstado(status: string, baseDatos?: string) {
  if (status === 'pending') {
    return {
      titulo: 'Comprobando servicios',
      descripcion: 'Consultando la API REST de Gradia.',
      icono: <Activity className="h-8 w-8 animate-pulse text-gradia-azul" />
    };
  }

  if (status === 'error') {
    return {
      titulo: 'API no disponible',
      descripcion: 'No fue posible consultar el backend de Gradia.',
      icono: <ServerCrash className="h-8 w-8 text-red-600" />
    };
  }

  if (baseDatos === 'conectada') {
    return {
      titulo: 'API disponible y base de datos conectada',
      descripcion: 'Express, Prisma y PostgreSQL respondieron correctamente.',
      icono: <CheckCircle2 className="h-8 w-8 text-gradia-verde" />
    };
  }

  return {
    titulo: 'API disponible, pero base de datos desconectada',
    descripcion: 'El backend respondio, aunque PostgreSQL no esta disponible.',
    icono: <AlertTriangle className="h-8 w-8 text-amber-600" />
  };
}
