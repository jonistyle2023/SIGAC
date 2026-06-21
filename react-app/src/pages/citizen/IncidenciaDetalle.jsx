import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Calendar, Tag, AlertTriangle,
  Trash2, Edit3, Upload, X, Loader2, Image, CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import incidenciaService from '../../services/incidencia.service';
import { StatusBadge, CategoryBadge, PriorityBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'application/pdf'];

const IncidenciaDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [inc, setInc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const fetch = () => {
    setLoading(true);
    incidenciaService.obtenerPorId(id)
      .then(res => setInc(res.data))
      .catch(() => toast.error('No se encontró la incidencia'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [id]);

  const canEdit = inc?.estado === 'PENDIENTE';

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar esta incidencia? Esta acción no se puede deshacer.')) return;
    setDeleting(true);
    try {
      await incidenciaService.eliminar(id);
      toast.success('Incidencia eliminada');
      navigate('/mis-incidencias');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar');
      setDeleting(false);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const invalid = files.find(f => !ALLOWED_TYPES.includes(f.type));
    if (invalid) {
      toast.error('Tipo de archivo no permitido');
      return;
    }
    if ((inc.multimedia?.length || 0) + files.length > 10) {
      toast.error('Máximo 10 archivos por incidencia');
      return;
    }

    for (const file of files) {
      const key = `${file.name}-${Date.now()}`;
      setUploadingFiles(prev => [...prev, { key, name: file.name, status: 'uploading' }]);
      try {
        const { data: { presignedUrl, s3Key } } = await incidenciaService.generarUrlSubida(id, file.name, file.type);

        await fetch(`${presignedUrl}`, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        await incidenciaService.confirmarSubida(id, {
          s3Key,
          nombreOriginal: file.name,
          contentType: file.type,
          tamanoBytes: file.size,
        });

        setUploadingFiles(prev => prev.map(u => u.key === key ? { ...u, status: 'done' } : u));
        toast.success(`${file.name} subido`);
      } catch {
        setUploadingFiles(prev => prev.map(u => u.key === key ? { ...u, status: 'error' } : u));
        toast.error(`Error al subir ${file.name}`);
      }
    }
    fetch();
    setTimeout(() => setUploadingFiles([]), 3000);
    e.target.value = '';
  };

  const handleDeleteMedia = async (multimediaId) => {
    if (!window.confirm('¿Eliminar este archivo?')) return;
    try {
      await incidenciaService.eliminarMultimedia(id, multimediaId);
      toast.success('Archivo eliminado');
      fetch();
    } catch {
      toast.error('Error al eliminar el archivo');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!inc) return null;

  const isImage = (tipo) => tipo?.startsWith('image/');

  return (
    <div className="space-y-4 pb-4">
      {/* Back */}
      <Link to="/mis-incidencias" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="text-lg font-bold text-gray-900 leading-snug flex-1">{inc.titulo}</h1>
          <StatusBadge estado={inc.estado} />
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-4">
          <CategoryBadge categoria={inc.categoria} />
          <PriorityBadge prioridad={inc.prioridad} />
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">{inc.descripcion}</p>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Detalles</h2>
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600">Reportado el <span className="font-medium">{inc.fechaCreacion?.split('T')[0]}</span></span>
          </div>
          {inc.entidadAsignadaNombre && (
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">Asignado a <span className="font-medium">{inc.entidadAsignadaNombre}</span></span>
            </div>
          )}
          {(inc.latitud || inc.direccionReferencia) && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                {inc.direccionReferencia && <p className="text-gray-600">{inc.direccionReferencia}</p>}
                {inc.latitud && <p className="text-xs text-gray-400">{inc.latitud}, {inc.longitud}</p>}
              </div>
            </div>
          )}
          {inc.fechaResolucion && (
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-gray-600">Resuelto el <span className="font-medium">{inc.fechaResolucion?.split('T')[0]}</span></span>
            </div>
          )}
        </div>
      </div>

      {/* IA insight */}
      {inc.iaClasificado && (
        <div className={`rounded-2xl border p-4 ${inc.iaRazonRechazo ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-semibold text-gray-700">Análisis IA</span>
            <span className="text-xs bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
              {Math.round((inc.iaConfianza || 0) * 100)}% confianza
            </span>
          </div>
          {inc.iaResumen && <p className="text-sm text-gray-600">{inc.iaResumen}</p>}
          {inc.iaRazonRechazo && (
            <p className="text-sm text-red-600 mt-1 font-medium">{inc.iaRazonRechazo}</p>
          )}
        </div>
      )}

      {/* Multimedia */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Archivos adjuntos ({inc.multimedia?.length || 0}/10)
          </h2>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <Upload className="h-3.5 w-3.5" /> Agregar
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,video/mp4,video/quicktime,application/pdf"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Upload progress */}
        {uploadingFiles.map(u => (
          <div key={u.key} className="flex items-center gap-2 text-xs py-1.5">
            {u.status === 'uploading' && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />}
            {u.status === 'done'      && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
            {u.status === 'error'     && <X className="h-3.5 w-3.5 text-red-500" />}
            <span className="truncate text-gray-600">{u.name}</span>
          </div>
        ))}

        {/* Media grid */}
        {inc.multimedia?.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
            {inc.multimedia.map(media => (
              <div key={media.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                {isImage(media.tipoContenido) && media.url ? (
                  <img src={media.url} alt={media.nombreOriginal} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <button
                  onClick={() => handleDeleteMedia(media.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-4">Sin archivos adjuntos</p>
        )}
      </div>

      {/* Actions */}
      {canEdit && (
        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-red-200 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-50 active:bg-red-100 transition-colors disabled:opacity-60"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Eliminar
          </button>
        </div>
      )}

      {inc.estado === 'RECHAZADO' && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">Esta incidencia fue rechazada. Si crees que fue un error, puedes crear una nueva con más detalles.</p>
        </div>
      )}
    </div>
  );
};

export default IncidenciaDetalle;