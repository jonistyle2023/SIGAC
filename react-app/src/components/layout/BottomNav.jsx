import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, FileText, User,
  ClipboardList, Users, Shield, ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = {
  CIUDADANO: [
    { to: '/dashboard',             icon: LayoutDashboard, label: 'Inicio' },
    { to: '/mis-incidencias/nueva', icon: PlusCircle,      label: 'Reportar' },
    { to: '/mis-incidencias',       icon: FileText,        label: 'Mis reportes' },
    { to: '/perfil',                icon: User,            label: 'Perfil' },
  ],
  ADMINISTRADOR: [
    { to: '/dashboard',            icon: LayoutDashboard, label: 'Inicio' },
    { to: '/admin/incidencias',    icon: ClipboardList,   label: 'Incidencias' },
    { to: '/admin/usuarios',       icon: Users,           label: 'Usuarios' },
    { to: '/admin/auditoria',      icon: Shield,          label: 'Auditoría' },
  ],
  ENTIDAD_PUBLICA: [
    { to: '/dashboard',            icon: LayoutDashboard, label: 'Inicio' },
    { to: '/entidad/incidencias',  icon: ClipboardCheck,  label: 'Asignadas' },
    { to: '/perfil',               icon: User,            label: 'Perfil' },
  ],
};

const BottomNav = () => {
  const { user } = useAuth();
  const items = NAV[user?.rol] || [];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 h-16 bg-white border-t border-gray-200 flex md:hidden">
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/dashboard'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
              isActive ? 'text-blue-600' : 'text-gray-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;