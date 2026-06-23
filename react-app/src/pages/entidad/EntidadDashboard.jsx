import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Clock, CheckCircle, ChevronRight, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import incidenciaService from '../../services/incidencia.service';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge, CategoryBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const EntidadDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, enProceso: 0, resueltas: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [all, enProceso, resueltas] = await Promise.all([
          incidenciaService.obtenerAsignadas(0, 5),
          incidenciaService.obtenerAsignadas(0, 1, 'EN_PROCESO'),
          incidenciaService.obtenerAsignadas(0, 1, 'RESUELTO'),
        ]);
        setStats({
          total:     all.data.totalElements,
          enProceso: enProceso.data.totalElements,
          resueltas: resueltas.data.totalElements,
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
        <h1 className="text-xl font-bold text-gray-900">Panel de Entidad</h1>
        <p className="text-sm text-gray-500 mt-0.5">Hola, {user?.nombre}</p>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-3 gap-3">
          <StatCard title="Asignadas" value={stats.total} icon={ClipboardCheck} colorClass="bg-blue-50 text-blue-600" />
          <StatCard title="En Proceso" value={stats.enProceso} icon={Clock} colorClass="bg-orange-50 text-orange-500" />
          <StatCard title="Resueltas" value={stats.resueltas} icon={CheckCircle} colorClass="bg-green-50 text-green-600" />
        </div>
      )}

      {/* Guía de flujo */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 space-y-1">
          <p className="font-semibold">¿Qué hago con las incidencias asignadas?</p>
          <ol className="text-xs text-blue-700 space-y-0.5 list-none">
            <li>1. Entra al detalle de una incidencia desde "Asignadas".</li>
            <li>2. Revisa la descripción, fotos y ubicación del problema.</li>
            <li>3. Una vez atendido, usa el botón <strong>"Marcar resuelta"</strong>.</li>
            <li>4. Si no es de tu competencia, usa <strong>"Rechazar"</strong> con una explicación.</li>
          </ol>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800">Recientes</h2>
          <Link to="/entidad/incidencias" className="text-sm text-blue-600 font-medium flex items-center gap-0.5">
            Ver todas <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? <LoadingSpinner /> : recent.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No tienes incidencias asignadas</div>
        ) : (
          <div className="space-y-2">
            {recent.map(inc => (
              <Link
                key={inc.id}
                to={`/entidad/incidencias/${inc.id}`}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4 hover:border-blue-200 active:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{inc.titulo}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CategoryBadge categoria={inc.categoria} />
                    <span className="text-xs text-gray-400">{inc.fechaCreacion?.split('T')[0]}</span>
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

export default EntidadDashboard;