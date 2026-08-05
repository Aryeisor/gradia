import {
  BookMarked,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Layers,
  LucideIcon,
  ScrollText,
  Settings,
  ShieldCheck,
  UserCheck,
  Users
} from 'lucide-react';

type ElementoMenuAdministrador = {
  etiqueta: string;
  ruta?: string;
  icono: LucideIcon;
  habilitado: boolean;
};

export type GrupoMenuAdministrador = {
  titulo: string;
  elementos: ElementoMenuAdministrador[];
};

export const menuAdministrador: GrupoMenuAdministrador[] = [
  {
    titulo: 'Panel principal',
    elementos: [
      { etiqueta: 'Panel principal', ruta: '/administrador', icono: LayoutDashboard, habilitado: true }
    ]
  },
  {
    titulo: 'Administración',
    elementos: [
      { etiqueta: 'Usuarios', ruta: '/administrador/usuarios', icono: Users, habilitado: true },
      { etiqueta: 'Docentes', ruta: '/administrador/docentes', icono: UserCheck, habilitado: true },
      { etiqueta: 'Estudiantes', ruta: '/administrador/estudiantes', icono: GraduationCap, habilitado: true }
    ]
  },
  {
    titulo: 'Configuración académica',
    elementos: [
      { etiqueta: 'Años académicos', icono: CalendarDays, habilitado: false },
      { etiqueta: 'Periodos', icono: CalendarDays, habilitado: false },
      { etiqueta: 'Niveles educativos', icono: Layers, habilitado: false },
      { etiqueta: 'Grados', icono: GraduationCap, habilitado: false },
      { etiqueta: 'Grupos', icono: Users, habilitado: false },
      { etiqueta: 'Áreas académicas', icono: BookOpen, habilitado: false },
      { etiqueta: 'Asignaturas', icono: BookMarked, habilitado: false }
    ]
  },
  {
    titulo: 'Planeación académica',
    elementos: [
      { etiqueta: 'Planes de estudio', icono: ClipboardList, habilitado: false },
      { etiqueta: 'Asignaciones docentes', icono: UserCheck, habilitado: false }
    ]
  },
  {
    titulo: 'Gestión estudiantil',
    elementos: [
      { etiqueta: 'Matriculas', icono: FileText, habilitado: false }
    ]
  },
  {
    titulo: 'Evaluación',
    elementos: [
      { etiqueta: 'Actividades evaluativas', icono: ClipboardCheck, habilitado: false },
      { etiqueta: 'Calificaciones', icono: BookOpen, habilitado: false },
      { etiqueta: 'Boletines', icono: ScrollText, habilitado: false }
    ]
  },
  {
    titulo: 'Sistema',
    elementos: [
      { etiqueta: 'Auditoría', icono: ShieldCheck, habilitado: false },
      { etiqueta: 'Configuración', icono: Settings, habilitado: false }
    ]
  }
];
