import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABELS = {
  CIUDADANO: 'Ciudadano',
  ADMINISTRADOR: 'Administrador',
  ENTIDAD_PUBLICA: 'Entidad Pública',
};

const DAYS   = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const formatDate = () => {
  const d = new Date();
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const TopBar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(formatDate);
  const dropdownRef = useRef(null);

  // Actualiza la fecha a medianoche
  useEffect(() => {
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
    const t = setTimeout(() => {
      setDate(formatDate());
    }, msUntilMidnight);
    return () => clearTimeout(t);
  }, [date]);

  // Cierra el dropdown al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <header className="fixed top-0 left-0 right-0 md:left-64 z-20 h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
      {/* Hamburger — solo móvil */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 -ml-1 rounded-xl text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Logo — solo móvil */}
      <span className="md:hidden font-bold text-blue-600 text-lg tracking-tight flex-1">
        SIGAC
      </span>

      {/* Spacer — desktop */}
      <div className="hidden md:block flex-1" />

      {/* Lado derecho */}
      <div className="flex items-center gap-2">

        {/* Fecha */}
        <span className="hidden sm:block text-xs text-gray-400 font-medium pr-1">
          {date}
        </span>

        {/* Campana */}
        <button className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors relative">
          <Bell className="h-5 w-5" />
        </button>

        {/* Separador */}
        <div className="hidden sm:block w-px h-5 bg-gray-200" />

        {/* Avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {user?.nombre?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-sm font-semibold text-gray-800">{user?.nombre}</span>
              <span className="text-xs text-gray-400">{ROLE_LABELS[user?.rol]}</span>
            </div>
            <ChevronDown className={`hidden sm:block h-3.5 w-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-2xl shadow-lg border border-gray-100 py-1 z-50">
              <Link
                to="/perfil"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="h-4 w-4 text-gray-400" />
                Mi Perfil
              </Link>
              <div className="mx-3 my-1 border-t border-gray-100" />
              <button
                onClick={() => { setOpen(false); logout(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;