import { ArrowRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PanelAdministrador() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Panel del administrador</h1>
      <p className="mt-2 text-slate-700">
        Estructura inicial para usuarios, estudiantes, docentes, catalogos academicos,
        matriculas y asignaciones academicas.
      </p>
      <div className="border-y border-slate-200 bg-white py-5">
        <Link className="flex items-center justify-between gap-4 px-4 text-gradia-tinta hover:text-gradia-azul" to="/administrador/usuarios">
          <span className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-blue-50 text-gradia-azul"><Users className="h-5 w-5" /></span>
            <span><strong className="block">Gestión de usuarios</strong><span className="text-sm text-slate-600">Crear, consultar y administrar el acceso.</span></span>
          </span>
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </section>
  );
}
