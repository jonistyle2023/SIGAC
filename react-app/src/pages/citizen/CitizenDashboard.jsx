import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, PlusCircle, ChevronRight, Send, Search, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import incidenciaService from '../../services/incidencia.service';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const CitizenDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ recent: [], total: 0, enProceso: 0, resueltas: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [recent, enProceso, resueltas] = await Promise.all([
          incidenciaService.obtenerMisIncidencias(0, 5),
          incidenciaService.obtenerMisIncidencias(0, 1, 'EN_PROCESO'),
          incidenciaService.obtenerMisIncidencias(0, 1, 'RESUELTO'),
        ]);
        setData({
          recent: recent.data.content,
          total: recent.data.totalElements,
          enProceso: enProceso.data.totalElements,
          resueltas: resueltas.data.totalElements,
        });
      } catch {
        // stats are non-critical
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Hola, {user?.nombre} 👋</h1>
        <p className="text-sm text-gray-500 mt-0.5">Aquí está el resumen de tus incidencias</p>
      </div>

      {/* Stats */}
      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-3 gap-3">
          <StatCard title="Total" value={data.total} icon={FileText} colorClass="bg-blue-50 text-blue-600" />
          <StatCard title="En Proceso" value={data.enProceso} icon={Clock} colorClass="bg-orange-50 text-orange-500" />
          <StatCard title="Resueltas" value={data.resueltas} icon={CheckCircle} colorClass="bg-green-50 text-green-600" />
        </div>
      )}

      {/* CTA */}
      <Link
        to="/mis-incidencias/nueva"
        className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-blue-200 transition-colors"
      >
        <PlusCircle className="h-5 w-5" />
        Reportar nueva incidencia
      </Link>

      {/* Guía de inicio — solo si no hay incidencias */}
      {!loading && data.total === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-4">¿Cómo funciona SIGAC?</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Send className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">1. Reportas el problema</p>
                <p className="text-xs text-gray-500 mt-0.5">Describes qué pasó, dónde y adjuntas fotos si tienes. Solo toma 2 minutos.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Search className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">2. Se revisa y asigna</p>
                <p className="text-xs text-gray-500 mt-0.5">Un administrador revisa tu reporte y lo envía a la entidad responsable (bomberos, policía, municipio, etc.).</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Wrench className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">3. La entidad lo resuelve</p>
                <p className="text-xs text-gray-500 mt-0.5">La entidad trabaja en el problema y marca el caso como resuelto. Puedes ver el progreso aquí en tiempo real.</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">Tu primer reporte es el primer paso. ¡Empieza ahora!</p>
          </div>
        </div>
      )}

      {/* Recent */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800">Recientes</h2>
          <Link to="/mis-incidencias" className="text-sm text-blue-600 font-medium flex items-center gap-0.5">
            Ver todas <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? <LoadingSpinner /> : data.recent.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            Usa el botón de arriba para reportar tu primera incidencia
          </div>
        ) : (
          <div className="space-y-2">
            {data.recent.map(inc => (
              <Link
                key={inc.id}
                to={`/mis-incidencias/${inc.id}`}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4 hover:border-blue-200 active:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{inc.titulo}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{inc.categoria?.replace('_', ' ')}</p>
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

export default CitizenDashboard;