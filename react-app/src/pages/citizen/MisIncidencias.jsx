import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, ChevronRight, FileX, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import incidenciaService from '../../services/incidencia.service';
import { StatusBadge, CategoryBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';

const ESTADOS = [
  { value: null,          label: 'Todas' },
  { value: 'PENDIENTE',   label: 'Pendiente' },
  { value: 'EN_REVISION', label: 'En Revisión' },
  { value: 'EN_PROCESO',  label: 'En Proceso' },
  { value: 'RESUELTO',    label: 'Resuelto' },
  { value: 'RECHAZADO',   label: 'Rechazado' },
];

const ESTADO_INFO = [
  { label: 'Pendiente',   color: 'bg-amber-100 text-amber-800',  desc: 'Tu reporte llegó. Está en cola esperando que un administrador lo revise.' },
  { label: 'En Revisión', color: 'bg-blue-100 text-blue-800',    desc: 'Un administrador está evaluando tu caso para asignarlo a la entidad correcta.' },
  { label: 'En Proceso',  color: 'bg-orange-100 text-orange-800', desc: 'La entidad responsable ya recibió el caso y está trabajando en resolverlo.' },
  { label: 'Resuelto',    color: 'bg-green-100 text-green-800',  desc: 'El problema fue atendido. ¡Gracias por tu reporte!' },
  { label: 'Rechazado',   color: 'bg-red-100 text-red-800',      desc: 'El reporte no pudo procesarse. Abre el detalle para ver el motivo.' },
];

const MisIncidencias = () => {
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [showLeyenda, setShowLeyenda] = useState(false);

  useEffect(() => {
    setLoading(true);
    incidenciaService.obtenerMisIncidencias(page, 10, estadoFiltro)
      .then(res => {
        setIncidencias(res.data.content);
        setTotalPages(res.data.totalPages);
        setTotal(res.data.totalElements);
      })
      .catch(() => toast.error('Error al cargar las incidencias'))
      .finally(() => setLoading(false));
  }, [page, estadoFiltro]);

  const handleFiltro = (estado) => {
    setEstadoFiltro(estado);
    setPage(0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mis Incidencias</h1>
          {!loading && <p className="text-xs text-gray-400 mt-0.5">{total} en total</p>}
        </div>
        <Link
          to="/mis-incidencias/nueva"
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-100 hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Nueva
        </Link>
      </div>

      {/* Leyenda de estados */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowLeyenda(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
            ¿Qué significa cada estado?
          </span>
          {showLeyenda ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </button>
        {showLeyenda && (
          <div className="px-4 pb-3 space-y-2">
            {ESTADO_INFO.map(e => (
              <div key={e.label} className="flex items-start gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${e.color}`}>{e.label}</span>
                <p className="text-xs text-gray-500">{e.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {ESTADOS.map(({ value, label }) => (
          <button
            key={label}
            onClick={() => handleFiltro(value)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              estadoFiltro === value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <LoadingSpinner />
      ) : incidencias.length === 0 ? (
        <EmptyState
          icon={FileX}
          title="Sin incidencias"
          description={estadoFiltro ? `No tienes incidencias con estado "${estadoFiltro}"` : 'Aún no has reportado ninguna incidencia'}
          action={
            <Link
              to="/mis-incidencias/nueva"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
            >
              <PlusCircle className="h-4 w-4" />
              Reportar ahora
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {incidencias.map(inc => (
            <Link
              key={inc.id}
              to={`/mis-incidencias/${inc.id}`}
              className="block bg-white rounded-2xl border border-gray-100 p-4 hover:border-blue-200 active:bg-gray-50 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm leading-snug truncate">{inc.titulo}</p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{inc.descripcion}</p>
                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    <StatusBadge estado={inc.estado} />
                    <CategoryBadge categoria={inc.categoria} />
                    <span className="text-xs text-gray-400">
                      {inc.fechaCreacion?.split('T')[0]}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default MisIncidencias;