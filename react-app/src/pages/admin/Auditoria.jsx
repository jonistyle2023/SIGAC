import { useState, useEffect } from 'react';
import { Shield, ChevronDown, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import auditService from '../../services/audit.service';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';

const ACTION_COLORS = {
  LOGIN:                   'bg-blue-100 text-blue-700',
  REGISTER_CIUDADANO:      'bg-green-100 text-green-700',
  REGISTER_ADMINISTRADOR:  'bg-green-100 text-green-700',
  REGISTER_ENTIDAD_PUBLICA:'bg-green-100 text-green-700',
  USER_UPDATE:             'bg-yellow-100 text-yellow-700',
  USER_ROLE_CHANGE:        'bg-orange-100 text-orange-700',
  USER_ACTIVATE:           'bg-emerald-100 text-emerald-700',
  USER_DEACTIVATE:         'bg-red-100 text-red-700',
  PASSWORD_CHANGE:         'bg-purple-100 text-purple-700',
  INCIDENT_CREATE:         'bg-teal-100 text-teal-700',
  INCIDENT_UPDATE:         'bg-teal-100 text-teal-700',
  INCIDENT_STATUS_CHANGE:  'bg-cyan-100 text-cyan-700',
  INCIDENT_DELETE:         'bg-red-100 text-red-700',
  INCIDENT_ASSIGN:         'bg-indigo-100 text-indigo-700',
  INCIDENT_AI_CLASSIFIED:  'bg-violet-100 text-violet-700',
};

const ACCIONES = [
  'LOGIN', 'REGISTER_CIUDADANO', 'REGISTER_ADMINISTRADOR', 'REGISTER_ENTIDAD_PUBLICA',
  'USER_UPDATE', 'USER_ROLE_CHANGE', 'USER_ACTIVATE', 'USER_DEACTIVATE', 'PASSWORD_CHANGE',
  'INCIDENT_CREATE', 'INCIDENT_UPDATE', 'INCIDENT_STATUS_CHANGE', 'INCIDENT_DELETE', 'INCIDENT_ASSIGN', 'INCIDENT_AI_CLASSIFIED',
];

const Auditoria = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accionFiltro, setAccionFiltro] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const load = (p = page) => {
    setLoading(true);
    const call = accionFiltro
      ? auditService.obtenerPorAccion(accionFiltro).then(r => ({ data: { content: r.data, totalPages: 1, totalElements: r.data.length } }))
      : auditService.obtenerTodos(p, 20);

    call
      .then(res => {
        setLogs(res.data.content || res.data);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.totalElements || (res.data.content || res.data).length);
      })
      .catch(() => toast.error('Error al cargar los logs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, accionFiltro]);

  const fmt = (ts) => ts ? ts.replace('T', ' ').substring(0, 16) : '—';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Auditoría</h1>
          {!loading && <p className="text-xs text-gray-400 mt-0.5">{total} registros</p>}
        </div>
        <button onClick={() => load(0)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Filtro acción */}
      <div className="relative">
        <select
          className="w-full pl-4 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={accionFiltro}
          onChange={e => { setAccionFiltro(e.target.value); setPage(0); }}
        >
          <option value="">Todas las acciones</option>
          {ACCIONES.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      {loading ? <LoadingSpinner /> : logs.length === 0 ? (
        <EmptyState icon={Shield} title="Sin registros" description="No hay logs de auditoría con los filtros seleccionados" />
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                  {log.action?.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0">{fmt(log.timestamp)}</span>
              </div>

              <p className="text-xs text-gray-600 truncate">
                <span className="font-medium">{log.userEmail}</span>
                {log.userRole && <span className="text-gray-400"> · {log.userRole}</span>}
              </p>

              {(log.previousValue || log.newValue) && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  {log.previousValue && (
                    <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-md truncate max-w-28">{log.previousValue}</span>
                  )}
                  {log.previousValue && log.newValue && <span className="text-gray-400">→</span>}
                  {log.newValue && (
                    <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-md truncate max-w-28">{log.newValue}</span>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-400 mt-1.5">
                {log.resource} {log.resourceId ? `#${log.resourceId}` : ''}
                {log.ipAddress && ` · IP: ${log.ipAddress}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {!accionFiltro && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
};

export default Auditoria;