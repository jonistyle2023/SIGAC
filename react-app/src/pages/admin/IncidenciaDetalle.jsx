import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, User, Tag, Loader2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import incidenciaService from '../../services/incidencia.service';
import usuarioService from '../../services/usuario.service';
import { StatusBadge, CategoryBadge, PriorityBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const ESTADOS = ['PENDIENTE', 'EN_REVISION', 'EN_PROCESO', 'RESUELTO', 'RECHAZADO'];

const AdminIncidenciaDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inc, setInc] = useState(null);
  const [entidades, setEntidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingEstado, setSavingEstado] = useState(false);
  const [savingAsign, setSavingAsign] = useState(false);
  const [selectedEstado, setSelectedEstado] = useState('');
  const [selectedEntidad, setSelectedEntidad] = useState('');

  const loadInc = () =>
    incidenciaService.obtenerPorId(id)
      .then(res => {
        setInc(res.data);
        setSelectedEstado(res.data.estado);
        setSelectedEntidad(res.data.entidadAsignadaId || '');
      });

  useEffect(() => {
    Promise.all([loadInc(), usuarioService.obtenerTodosActivos()])
      .then(([, usersRes]) => {
        setEntidades(usersRes.data.filter(u => u.rol === 'ENTIDAD_PUBLICA'));
      })
      .catch(() => toast.error('Error al cargar los datos'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCambiarEstado = async () => {
    if (selectedEstado === inc.estado) return;
    setSavingEstado(true);
    try {
      const res = await incidenciaService.cambiarEstado(id, selectedEstado);
      setInc(res.data);
      toast.success('Estado actualizado');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cambiar estado');
    } finally {
      setSavingEstado(false);
    }
  };

  const handleAsignar = async () => {
    if (!selectedEntidad) return;
    setSavingAsign(true);
    try {
      const res = await incidenciaService.asignar(id, Number(selectedEntidad));
      setInc(res.data);
      toast.success('Incidencia asignada');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al asignar');
    } finally {
      setSavingAsign(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!inc) return null;

  const selectClass = 'block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none';

  return (
    <div className="space-y-4 pb-4">
      <Link to="/admin/incidencias" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className="text-xs text-gray-400 font-medium">#{inc.id}</span>
            <h1 className="text-lg font-bold text-gray-900 leading-snug mt-0.5">{inc.titulo}</h1>
          </div>
          <StatusBadge estado={inc.estado} />
        </div>
        <div className="flex gap-2 flex-wrap mb-3">
          <CategoryBadge categoria={inc.categoria} />
          <PriorityBadge prioridad={inc.prioridad} />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{inc.descripcion}</p>
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Información</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Ciudadano: <span className="font-medium">{inc.ciudadanoNombre}</span> · {inc.ciudadanoEmail}</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Creado: <span className="font-medium">{inc.fechaCreacion?.split('T')[0]}</span></span>
          </div>
          {inc.entidadAsignadaNombre && (
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Asignado a: <span className="font-medium">{inc.entidadAsignadaNombre}</span></span>
            </div>
          )}
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

      {/* Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Acciones</h2>

        {/* Cambiar estado */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Cambiar estado</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select className={selectClass} value={selectedEstado} onChange={e => setSelectedEstado(e.target.value)}>
                {ESTADOS.map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={handleCambiarEstado}
              disabled={savingEstado || selectedEstado === inc.estado}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {savingEstado ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
            </button>
          </div>
        </div>

        {/* Asignar entidad */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Asignar a entidad</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select className={selectClass} value={selectedEntidad} onChange={e => setSelectedEntidad(e.target.value)}>
                <option value="">Sin asignar</option>
                {entidades.map(e => (
                  <option key={e.id} value={e.id}>{e.nombre} {e.apellido}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={handleAsignar}
              disabled={savingAsign || !selectedEntidad}
              className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {savingAsign ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Asignar'}
            </button>
          </div>
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
                  <span className="text-xs text-gray-500 text-center p-2 break-all">{media.nombreOriginal}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIncidenciaDetalle;