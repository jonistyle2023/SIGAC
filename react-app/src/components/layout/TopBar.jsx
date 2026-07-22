import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import notificacionService from '../../services/notificacion.service';

const ROLE_LABELS = {
  CIUDADANO: 'Ciudadano',
  ADMINISTRADOR: 'Administrador',
  ENTIDAD_PUBLICA: 'Entidad Pública',
};

const INCIDENCIA_RUTA_POR_ROL = {
  CIUDADANO: (id) => `/mis-incidencias/${id}`,
  ADMINISTRADOR: (id) => `/admin/incidencias/${id}`,
  ENTIDAD_PUBLICA: (id) => `/entidad/incidencias/${id}`,
};

const NOTIFICACIONES_POLL_MS = 30000;

const DAYS   = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const formatDate = () => {
  const d = new Date();
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const formatRelativo = (isoString) => {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutos = Math.floor(diffMs / 60000);
  if (minutos < 1) return 'ahora';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} d`;
};

const TopBar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(formatDate);
  const dropdownRef = useRef(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);
  const [notificaciones, setNotificaciones] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef(null);

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

  // Cierra el dropdown de notificaciones al hacer clic fuera
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  // Contador de no leídas — carga inicial y sondeo periódico
  useEffect(() => {
    const cargarContador = async () => {
      try {
        const { data } = await notificacionService.contarNoLeidas();
        setNoLeidas(data.noLeidas);
      } catch {
        // Silencioso: el contador no es crítico para el uso de la app
      }
    };
    cargarContador();
    const interval = setInterval(cargarContador, NOTIFICACIONES_POLL_MS);
    return () => clearInterval(interval);
  }, []);

  const toggleNotificaciones = async () => {
    const abriendo = !notifOpen;
    setNotifOpen(abriendo);
    if (abriendo) {
      setNotifLoading(true);
      try {
        const { data } = await notificacionService.obtenerMisNotificaciones(0, 10);
        setNotificaciones(data.content);
      } catch {
        setNotificaciones([]);
      } finally {
        setNotifLoading(false);
      }
    }
  };

  const handleNotificacionClick = async (notif) => {
    setNotifOpen(false);
    if (!notif.leida) {
      setNoLeidas((n) => Math.max(0, n - 1));
      setNotificaciones((prev) => prev.map((n) => (n.id === notif.id ? { ...n, leida: true } : n)));
      notificacionService.marcarLeida(notif.id).catch(() => {});
    }
    if (notif.incidenciaId && INCIDENCIA_RUTA_POR_ROL[user?.rol]) {
      navigate(INCIDENCIA_RUTA_POR_ROL[user.rol](notif.incidenciaId));
    }
  };

  const handleMarcarTodas = async () => {
    setNoLeidas(0);
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    try {
      await notificacionService.marcarTodasLeidas();
    } catch {
      // El próximo sondeo restaura el contador real si algo falló
    }
  };

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
        <div className="relative" ref={notifRef}>
          <button
            onClick={toggleNotificaciones}
            className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors relative"
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5" />
            {noLeidas > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                {noLeidas > 9 ? '9+' : noLeidas}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-1 w-80 max-w-[90vw] bg-white rounded-2xl shadow-lg border border-gray-100 py-1 z-50">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-800">Notificaciones</span>
                {noLeidas > 0 && (
                  <button
                    onClick={handleMarcarTodas}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Marcar todas como leídas
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifLoading ? (
                  <div className="py-8 text-center text-sm text-gray-400">Cargando...</div>
                ) : notificaciones.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">Sin notificaciones</div>
                ) : (
                  notificaciones.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificacionClick(notif)}
                      className={`w-full text-left px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors flex gap-2 ${
                        !notif.leida ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                          !notif.leida ? 'bg-blue-600' : 'bg-transparent'
                        }`}
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-gray-800 truncate">{notif.titulo}</span>
                        <span className="block text-xs text-gray-500 line-clamp-2">{notif.mensaje}</span>
                        <span className="block text-[11px] text-gray-400 mt-0.5">{formatRelativo(notif.fechaCreacion)}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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