import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader2, Navigation, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import incidenciaService from '../../services/incidencia.service';

const CATEGORIAS = [
  { value: 'INFRAESTRUCTURA',    label: 'Infraestructura' },
  { value: 'SEGURIDAD',          label: 'Seguridad' },
  { value: 'SERVICIOS_PUBLICOS', label: 'Servicios Públicos' },
  { value: 'MEDIO_AMBIENTE',     label: 'Medio Ambiente' },
  { value: 'OTRO',               label: 'Otro' },
];

const inputClass = 'block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all';
const labelClass = 'block text-sm font-semibold text-gray-700 mb-1.5';

const NuevaIncidencia = () => {
  const navigate = useNavigate();
  const [gettingLocation, setGettingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    categoria: '',
    direccionReferencia: '',
    latitud: null,
    longitud: null,
  });

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const obtenerUbicacion = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no disponible en este dispositivo');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(p => ({
          ...p,
          latitud: parseFloat(pos.coords.latitude.toFixed(8)),
          longitud: parseFloat(pos.coords.longitude.toFixed(8)),
        }));
        toast.success('Ubicación capturada');
        setGettingLocation(false);
      },
      () => {
        toast.error('No se pudo obtener la ubicación. Ingresa la dirección manualmente.');
        setGettingLocation(false);
      },
      { timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.categoria) {
      toast.error('Selecciona una categoría');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        titulo: form.titulo,
        descripcion: form.descripcion,
        categoria: form.categoria,
        direccionReferencia: form.direccionReferencia || null,
        latitud: form.latitud,
        longitud: form.longitud,
      };
      const res = await incidenciaService.crear(payload);
      toast.success('¡Incidencia reportada exitosamente!');
      navigate(`/mis-incidencias/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear la incidencia');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Nueva Incidencia</h1>
        <p className="text-sm text-gray-500 mt-0.5">Completa el formulario para reportar un problema</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Título */}
        <div>
          <label className={labelClass}>Título *</label>
          <input
            className={inputClass}
            placeholder="Describe brevemente el problema"
            value={form.titulo}
            onChange={set('titulo')}
            required
            maxLength={200}
          />
        </div>

        {/* Categoría */}
        <div>
          <label className={labelClass}>Categoría *</label>
          <select
            className={inputClass}
            value={form.categoria}
            onChange={set('categoria')}
            required
          >
            <option value="">Selecciona una categoría</option>
            {CATEGORIAS.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Descripción */}
        <div>
          <label className={labelClass}>Descripción *</label>
          <textarea
            className={inputClass + ' resize-none'}
            rows={4}
            placeholder="Describe el problema con el mayor detalle posible: qué ocurre, desde cuándo, qué tan grave es..."
            value={form.descripcion}
            onChange={set('descripcion')}
            required
            maxLength={5000}
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{form.descripcion.length}/5000</p>
        </div>

        {/* Ubicación */}
        <div className="bg-blue-50 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            Ubicación (opcional pero recomendada)
          </p>

          <button
            type="button"
            onClick={obtenerUbicacion}
            disabled={gettingLocation}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-medium text-blue-700 hover:bg-blue-50 active:bg-blue-100 transition-colors disabled:opacity-60 w-full justify-center"
          >
            {gettingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            {gettingLocation ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}
          </button>

          {form.latitud && (
            <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Coordenadas: {form.latitud.toFixed(6)}, {form.longitud.toFixed(6)}
            </p>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Dirección de referencia</label>
            <input
              className="block w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Av. Principal y Calle 5, frente al parque"
              value={form.direccionReferencia}
              onChange={set('direccionReferencia')}
              maxLength={500}
            />
          </div>
        </div>

        {/* Info sobre fotos */}
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            Podrás adjuntar fotos o videos desde el detalle de la incidencia, una vez creada.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 transition-colors disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Enviar reporte'}
        </button>
      </form>
    </div>
  );
};

export default NuevaIncidencia;