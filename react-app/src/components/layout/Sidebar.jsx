import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, FileText, User, Users,
  Shield, ClipboardList, X, LogOut, ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = {
  CIUDADANO: [
    { to: '/dashboard',          icon: LayoutDashboard, label: 'Inicio' },
    { to: '/mis-incidencias/nueva', icon: PlusCircle,   label: 'Reportar Incidencia' },
    { to: '/mis-incidencias',    icon: FileText,        label: 'Mis Incidencias' },
    { to: '/perfil',             icon: User,            label: 'Mi Perfil' },
  ],
  ADMINISTRADOR: [
    { to: '/dashboard',          icon: LayoutDashboard, label: 'Inicio' },
    { to: '/admin/incidencias',  icon: ClipboardList,   label: 'Incidencias' },
    { to: '/admin/usuarios',     icon: Users,           label: 'Usuarios' },
    { to: '/admin/auditoria',    icon: Shield,          label: 'Auditoría' },
    { to: '/perfil',             icon: User,            label: 'Mi Perfil' },
  ],
  ENTIDAD_PUBLICA: [
    { to: '/dashboard',           icon: LayoutDashboard, label: 'Inicio' },
    { to: '/entidad/incidencias', icon: ClipboardCheck,  label: 'Asignadas' },
    { to: '/perfil',              icon: User,            label: 'Mi Perfil' },
  ],
};

const SidebarLink = ({ to, icon: Icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`
    }
  >
    <Icon className="h-5 w-5 flex-shrink-0" />
    <span>{label}</span>
  </NavLink>
);

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const items = NAV[user?.rol] || [];

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-slate-800 z-40 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">SIGAC</span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">
                {user?.nombre?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.nombre}</p>
              <p className="text-slate-400 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {items.map((item) => (
            <SidebarLink key={item.to} {...item} onClick={onClose} />
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-slate-700">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;