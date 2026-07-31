import { GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

type Props = {
  perfil: string;
};

export function NavegacionPrincipal({ perfil }: Props) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link className="flex items-center gap-2 font-bold text-gradia-tinta" to="/">
          <GraduationCap className="h-6 w-6 text-gradia-azul" />
          Gradia
        </Link>
        <span className="text-sm font-medium text-slate-600">{perfil}</span>
      </nav>
    </header>
  );
}
