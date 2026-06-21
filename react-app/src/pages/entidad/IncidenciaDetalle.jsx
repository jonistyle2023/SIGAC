import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, User, Loader2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import incidenciaService from '../../services/incidencia.service';
import { StatusBadge, CategoryBadge, PriorityBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const EntidadIncidenciaDetalle = () => {
  const { id } = useParams();
  const [inc, setInc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  const load = () =>
    incidenciaService.obtenerPorId(id)
      .then(res => setInc(res.data))
      .catch(() => toast.error('Error al cargar la incidencia'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  const cambiarEstado = async (estado) => {
    setSaving(estado);
    try {
      const res = await incidenciaService.cambiarEstado(id, estado);
      setInc(res.data);
      toast.success(`Incidencia marcada como ${estado === 'RESUELTO' ? 'resuelta' : 'rechazada'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cambiar estado');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!inc) return null;

  const canAct = inc.estado === 'EN_PROCESO' || inc.estado === 'EN_REVISION';

  return (
    <div className="space-y-4 pb-4">
      <Link to="/entidad/incidencias" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="text-lg font-bold text-gray-900 leading-snug flex-1">{inc.titulo}</h1>
          <StatusBadge estado={inc.estado} />
        </div>
        <div className="flex gap-2 flex-wrap mb-3">
          <CategoryBadge categoria={inc.categoria} />
          <PriorityBadge prioridad={inc.prioridad} />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{inc.descripcion}</p>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Información</h2>
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Ciudadano: <span className="font-medium">{inc.ciudadanoNombre}</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Reportado el <span className="font-medium">{inc.fechaCreacion?.split('T')[0]}</span></span>
          </div>
          {(inc.latitud || inc.direccionReferencia) && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                {inc.direccionReferencia && <p className="text-gray-600">{inc.direccionReferencia}</p>}
                {inc.latitud && <p className="text-xs text-gray-400">{inc.latitud}, {inc.longitud}</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Multimedia */}
      {inc.multimedia?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Archivos adjuntos</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {inc.multimedia.map(media => (
              <div key={media.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                {media.tipoContenido?.startsWith('image/') && media.url ? (
                  <img src={media.url} alt={media.nombreOriginal} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-500 p-2 text-center break-all">{media.nombreOriginal}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {canAct && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Resolución</h2>
          <div className="flex gap-3">
            <button
              onClick={() => cambiarEstado('RESUELTO')}
              disabled={!!saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60"
            >
              {saving === 'RESUELTO' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Marcar resuelta
            </button>
            <button
              onClick={() => cambiarEstado('RECHAZADO')}
              disabled={!!saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-red-200 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-50 transition-colors disabled:opacity-60"
            >
              {saving === 'RECHAZADO' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Rechazar
            </button>
          </div>
        </div>
      )}

      {(inc.estado === 'RESUELTO' || inc.estado === 'RECHAZADO') && inc.fechaResolucion && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-sm text-gray-500">
            {inc.estado === 'RESUELTO' ? '✅' : '❌'} {inc.estado === 'RESUELTO' ? 'Resuelto' : 'Rechazado'} el {inc.fechaResolucion?.split('T')[0]}
          </p>
        </div>
      )}
    </div>
  );
};

export default EntidadIncidenciaDetalle;