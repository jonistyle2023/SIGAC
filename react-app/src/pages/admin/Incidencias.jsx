import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import incidenciaService from '../../services/incidencia.service';
import { StatusBadge, CategoryBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';

const ESTADOS = [
  { value: null,           label: 'Todas' },
  { value: 'PENDIENTE',    label: 'Pendiente' },
  { value: 'EN_REVISION',  label: 'En Revisión' },
  { value: 'EN_PROCESO',   label: 'En Proceso' },
  { value: 'RESUELTO',     label: 'Resuelto' },
  { value: 'RECHAZADO',    label: 'Rechazado' },
];

const Incidencias = () => {
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    incidenciaService.obtenerTodas(page, 15, estadoFiltro)
      .then(res => {
        setIncidencias(res.data.content);
        setTotalPages(res.data.totalPages);
        setTotal(res.data.totalElements);
      })
      .catch(() => toast.error('Error al cargar incidencias'))
      .finally(() => setLoading(false));
  }, [page, estadoFiltro]);

  const handleFiltro = (estado) => { setEstadoFiltro(estado); setPage(0); };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Incidencias</h1>
        {!loading && <p className="text-xs text-gray-400 mt-0.5">{total} en total</p>}
      </div>

      {/* Filtros horizontales */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {ESTADOS.map(({ value, label }) => (
          <button
            key={label}
            onClick={() => handleFiltro(value)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              estadoFiltro === value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : incidencias.length === 0 ? (
        <EmptyState title="Sin incidencias" description="No hay incidencias con los filtros seleccionados" />
      ) : (
        <div className="space-y-2">
          {incidencias.map(inc => (
            <Link
              key={inc.id}
              to={`/admin/incidencias/${inc.id}`}
              className="block bg-white rounded-2xl border border-gray-100 p-4 hover:border-blue-200 active:bg-gray-50 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge estado={inc.estado} />
                    <span className="text-xs text-gray-400">#{inc.id}</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm truncate">{inc.titulo}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <CategoryBadge categoria={inc.categoria} />
                    <span className="text-xs text-gray-500">{inc.ciudadanoNombre} · {inc.fechaCreacion?.split('T')[0]}</span>
                  </div>
                  {inc.entidadAsignadaNombre && (
                    <p className="text-xs text-blue-600 mt-1">→ {inc.entidadAsignadaNombre}</p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300 flex-shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default Incidencias;