import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Clock, Tag, FileDown, FileSpreadsheet, FileText } from 'lucide-react';
import reporteService from '../../services/reporte.service';
import { StatCard } from '../../components/ui/StatCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';

// Paleta categórica validada (orden fijo — ver skill de dataviz) aplicada
// en el orden en que se declaran las categorías, no por asociación semántica.
const CATEGORIA_COLORS = {
  INFRAESTRUCTURA:    '#2a78d6',
  SEGURIDAD:          '#eb6834',
  SERVICIOS_PUBLICOS: '#1baf7a',
  MEDIO_AMBIENTE:     '#eda100',
  OTRO:               '#e87ba4',
};

const CATEGORIA_LABELS = {
  INFRAESTRUCTURA:    'Infraestructura',
  SEGURIDAD:          'Seguridad',
  SERVICIOS_PUBLICOS: 'Servicios Públicos',
  MEDIO_AMBIENTE:     'Medio Ambiente',
  OTRO:               'Otro',
};

// Magnitud de un solo hecho (conteo) por entidad — hue único secuencial, no identidad categórica.
const ZONA_COLOR = '#2a78d6';

const BarRow = ({ label, value, max, color }) => {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 3 : 0) : 0;
  return (
    <div className="flex items-center gap-3" title={`${label}: ${value}`}>
      <span className="w-40 flex-shrink-0 text-sm text-gray-700 truncate">{label}</span>
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-10 flex-shrink-0 text-sm font-semibold text-gray-800 text-right">{value}</span>
    </div>
  );
};

const descargarBlob = (response) => {
  const disposition = response.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : 'reporte';
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const Reportes = () => {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filtros, setFiltros] = useState({ desde: '', hasta: '' });
  const [exportando, setExportando] = useState(null);

  const cargarKpis = useCallback(async (f) => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await reporteService.obtenerKpis(f.desde || null, f.hasta || null);
      setKpis(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarKpis(filtros); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAplicarFiltros = (e) => {
    e.preventDefault();
    cargarKpis(filtros);
  };

  const handleExportar = async (formato) => {
    setExportando(formato);
    try {
      const response = await reporteService.exportar(formato, filtros);
      descargarBlob(response);
    } catch {
      // Silencioso: el usuario puede reintentar
    } finally {
      setExportando(null);
    }
  };

  const maxCategoria = kpis ? Math.max(0, ...Object.values(kpis.porCategoria || {})) : 0;
  const maxEntidad = kpis ? Math.max(0, ...Object.values(kpis.porEntidad || {})) : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Reportería y Analítica</h1>
        <p className="text-sm text-gray-500 mt-0.5">KPIs de gestión y exportación de incidencias</p>
      </div>

      {/* Filtro de rango de fechas */}
      <form onSubmit={handleAplicarFiltros} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
          <input
            type="date"
            value={filtros.desde}
            onChange={(e) => setFiltros((f) => ({ ...f, desde: e.target.value }))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
          <input
            type="date"
            value={filtros.hasta}
            onChange={(e) => setFiltros((f) => ({ ...f, hasta: e.target.value }))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors">
          Aplicar
        </button>
      </form>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <EmptyState title="No se pudieron cargar los KPIs" description="Intenta aplicar el filtro nuevamente." />
      ) : (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard title="Total de incidencias" value={kpis.totalIncidencias} icon={ClipboardList} colorClass="bg-blue-50 text-blue-600" />
            <StatCard
              title="Tiempo de resolución promedio"
              value={kpis.tiempoResolucionPromedioHoras != null ? `${kpis.tiempoResolucionPromedioHoras} h` : 'N/D'}
              icon={Clock}
              colorClass="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              title="Tipo más frecuente"
              value={kpis.categoriaMasFrecuente ? CATEGORIA_LABELS[kpis.categoriaMasFrecuente] || kpis.categoriaMasFrecuente : 'N/D'}
              icon={Tag}
              colorClass="bg-orange-50 text-orange-600"
            />
          </div>

          {/* Incidencias por categoría */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Incidencias por tipo</h2>
            {Object.keys(kpis.porCategoria || {}).length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Sin datos en el rango seleccionado</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(kpis.porCategoria)
                  .sort((a, b) => b[1] - a[1])
                  .map(([categoria, count]) => (
                    <BarRow
                      key={categoria}
                      label={CATEGORIA_LABELS[categoria] || categoria}
                      value={count}
                      max={maxCategoria}
                      color={CATEGORIA_COLORS[categoria] || '#9ca3af'}
                    />
                  ))}
              </div>
            )}
          </div>

          {/* Incidencias por zona (entidad asignada) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h2 className="text-base font-semibold text-gray-800 mb-1">Incidencias por zona</h2>
            <p className="text-xs text-gray-400 mb-4">Agrupadas por entidad pública asignada</p>
            {Object.keys(kpis.porEntidad || {}).length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Sin datos en el rango seleccionado</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(kpis.porEntidad)
                  .sort((a, b) => b[1] - a[1])
                  .map(([entidad, count]) => (
                    <BarRow key={entidad} label={entidad} value={count} max={maxEntidad} color={ZONA_COLOR} />
                  ))}
              </div>
            )}
          </div>

          {/* Exportación */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h2 className="text-base font-semibold text-gray-800 mb-1">Exportar reporte</h2>
            <p className="text-xs text-gray-400 mb-4">Incluye las incidencias del rango de fechas filtrado arriba</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleExportar('csv')}
                disabled={exportando !== null}
                className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <FileDown className="h-4 w-4" />
                {exportando === 'csv' ? 'Generando...' : 'Exportar CSV'}
              </button>
              <button
                onClick={() => handleExportar('xlsx')}
                disabled={exportando !== null}
                className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4" />
                {exportando === 'xlsx' ? 'Generando...' : 'Exportar XLS'}
              </button>
              <button
                onClick={() => handleExportar('pdf')}
                disabled={exportando !== null}
                className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <FileText className="h-4 w-4" />
                {exportando === 'pdf' ? 'Generando...' : 'Exportar PDF'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reportes;
