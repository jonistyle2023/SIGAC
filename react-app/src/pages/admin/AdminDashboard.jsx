import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Clock, CheckCircle, XCircle, ChevronRight, Users, AlertCircle, Building2, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import incidenciaService from '../../services/incidencia.service';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge, CategoryBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pendientes: 0, enProceso: 0, resueltas: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [all, pendientes, enProceso, resueltas] = await Promise.all([
          incidenciaService.obtenerTodas(0, 5),
          incidenciaService.obtenerTodas(0, 1, 'PENDIENTE'),
          incidenciaService.obtenerTodas(0, 1, 'EN_PROCESO'),
          incidenciaService.obtenerTodas(0, 1, 'RESUELTO'),
        ]);
        setStats({
          total:     all.data.totalElements,
          pendientes: pendientes.data.totalElements,
          enProceso:  enProceso.data.totalElements,
          resueltas:  resueltas.data.totalElements,
        });
        setRecent(all.data.content);
      } catch {
        // non-critical
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Panel Administrador</h1>
        <p className="text-sm text-gray-500 mt-0.5">Hola, {user?.nombre}</p>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard title="Total" value={stats.total} icon={ClipboardList} colorClass="bg-blue-50 text-blue-600" />
          <StatCard title="Pendientes" value={stats.pendientes} icon={Clock} colorClass="bg-amber-50 text-amber-500" />
          <StatCard title="En Proceso" value={stats.enProceso} icon={Clock} colorClass="bg-orange-50 text-orange-500" />
          <StatCard title="Resueltas" value={stats.resueltas} icon={CheckCircle} colorClass="bg-green-50 text-green-600" />
        </div>
      )}

      {/* Alerta de pendientes */}
      {!loading && stats.pendientes > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {stats.pendientes} incidencia{stats.pendientes > 1 ? 's' : ''} pendiente{stats.pendientes > 1 ? 's' : ''} de revisión
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Revísalas, asígnalas a la entidad correcta y cambia el estado a <strong>En Revisión</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/admin/incidencias" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2 hover:border-blue-200 transition-colors">
          <ClipboardList className="h-6 w-6 text-blue-600" />
          <span className="text-sm font-semibold text-gray-800">Ver incidencias</span>
          <span className="text-xs text-gray-400">Revisar, asignar y gestionar estados</span>
        </Link>
        <Link to="/admin/usuarios" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2 hover:border-blue-200 transition-colors">
          <Users className="h-6 w-6 text-purple-600" />
          <span className="text-sm font-semibold text-gray-800">Gestionar usuarios</span>
          <span className="text-xs text-gray-400">Roles, activar o desactivar cuentas</span>
        </Link>
        <Link to="/admin/entidades" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2 hover:border-blue-200 transition-colors">
          <Building2 className="h-6 w-6 text-green-600" />
          <span className="text-sm font-semibold text-gray-800">Entidades</span>
          <span className="text-xs text-gray-400">Bomberos, policía, municipio, etc.</span>
        </Link>
        <Link to="/admin/auditoria" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2 hover:border-blue-200 transition-colors">
          <Shield className="h-6 w-6 text-slate-600" />
          <span className="text-sm font-semibold text-gray-800">Auditoría</span>
          <span className="text-xs text-gray-400">Registro de todas las acciones</span>
        </Link>
      </div>

      {/* Recent incidents */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800">Últimas incidencias</h2>
          <Link to="/admin/incidencias" className="text-sm text-blue-600 font-medium flex items-center gap-0.5">
            Ver todas <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {loading ? <LoadingSpinner /> : (
          <div className="space-y-2">
            {recent.map(inc => (
              <Link
                key={inc.id}
                to={`/admin/incidencias/${inc.id}`}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4 hover:border-blue-200 active:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{inc.titulo}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <CategoryBadge categoria={inc.categoria} />
                    <span className="text-xs text-gray-400">{inc.ciudadanoNombre}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge estado={inc.estado} />
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;