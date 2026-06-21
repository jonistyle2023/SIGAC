import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABELS = {
  CIUDADANO: 'Ciudadano',
  ADMINISTRADOR: 'Administrador',
  ENTIDAD_PUBLICA: 'Entidad Pública',
};

const TopBar = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 md:left-64 z-20 h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
      {/* Hamburger — only on mobile */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 -ml-1 rounded-xl text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Logo — only on mobile (desktop shows in sidebar) */}
      <span className="md:hidden font-bold text-blue-600 text-lg tracking-tight flex-1">
        SIGAC
      </span>

      {/* Spacer — desktop */}
      <div className="hidden md:block flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors relative">
          <Bell className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-semibold text-gray-800 leading-tight">{user?.nombre}</span>
          <span className="text-xs text-gray-400">{ROLE_LABELS[user?.rol]}</span>
        </div>

        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">
            {user?.nombre?.[0]?.toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
};

export default TopBar;