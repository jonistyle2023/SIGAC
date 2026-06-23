import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader2, Navigation, AlertCircle, Info, Lightbulb } from 'lucide-react';
import toast from 'react-hot-toast';
import incidenciaService from '../../services/incidencia.service';

const CATEGORIAS = [
  {
    value: 'INFRAESTRUCTURA',
    label: 'Infraestructura',
    desc: 'Huecos en la vía, puentes dañados, semáforos averiados, aceras rotas, postes caídos.',
    ejemplo: 'Ej: "Hueco peligroso en calzada frente al Mercado Central"',
  },
  {
    value: 'SEGURIDAD',
    label: 'Seguridad',
    desc: 'Robos, peleas, zonas peligrosas, luminarias apagadas en áreas de riesgo.',
    ejemplo: 'Ej: "Zona sin iluminación en Calle Sucre favorece robos nocturnos"',
  },
  {
    value: 'SERVICIOS_PUBLICOS',
    label: 'Servicios Públicos',
    desc: 'Cortes de agua, electricidad o internet, problemas en recolección de basura.',
    ejemplo: 'Ej: "Falta de agua potable en el barrio Las Palmas desde hace 3 días"',
  },
  {
    value: 'MEDIO_AMBIENTE',
    label: 'Medio Ambiente',
    desc: 'Basura acumulada ilegalmente, contaminación de ríos, tala de árboles, malos olores.',
    ejemplo: 'Ej: "Depósito clandestino de basura en terreno baldío de Av. Colón"',
  },
  {
    value: 'OTRO',
    label: 'Otro',
    desc: 'Cualquier problema que no encaje en las categorías anteriores.',
    ejemplo: 'Ej: "Perro abandonado herido en el parque La Carolina"',
  },
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

  const categoriaSeleccionada = CATEGORIAS.find(c => c.value === form.categoria);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Nueva Incidencia</h1>
        <p className="text-sm text-gray-500 mt-0.5">Completa el formulario para reportar un problema en tu comunidad</p>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">¿Qué puedo reportar?</p>
          <p className="text-blue-700 leading-relaxed">
            Cualquier problema que afecte a tu barrio o ciudad: vías en mal estado, falta de servicios, problemas de seguridad, contaminación ambiental, etc. Tu reporte llega directamente a la entidad responsable.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Título */}
        <div>
          <label className={labelClass}>
            Título *
            <span className="text-xs text-gray-400 font-normal ml-1">— sé concreto y breve</span>
          </label>
          <input
            className={inputClass}
            placeholder='Ej: "Semáforo averiado en Av. Amazonas y Naciones Unidas"'
            value={form.titulo}
            onChange={set('titulo')}
            required
            maxLength={200}
          />
          <p className="text-xs text-gray-400 mt-1">Incluye el lugar o punto de referencia. Evita títulos vagos como "hay un problema".</p>
        </div>

        {/* Categoría */}
        <div>
          <label className={labelClass}>
            Categoría *
            <span className="text-xs text-gray-400 font-normal ml-1">— elige la que mejor aplique</span>
          </label>
          <select
            className={inputClass}
            value={form.categoria}
            onChange={set('categoria')}
            required
          >
            <option value="">Selecciona una categoría...</option>
            {CATEGORIAS.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          {categoriaSeleccionada && (
            <div className="mt-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-600 space-y-1">
              <p>{categoriaSeleccionada.desc}</p>
              <p className="text-blue-600 font-medium">{categoriaSeleccionada.ejemplo}</p>
            </div>
          )}
        </div>

        {/* Descripción */}
        <div>
          <label className={labelClass}>
            Descripción *
            <span className="text-xs text-gray-400 font-normal ml-1">— más detalles = respuesta más rápida</span>
          </label>
          <textarea
            className={inputClass + ' resize-none'}
            rows={5}
            placeholder={'Responde estas preguntas:\n• ¿Qué está pasando exactamente?\n• ¿Desde cuándo ocurre?\n• ¿Qué tan grave es o qué riesgo representa?\n• ¿Hay personas afectadas?\n\nEj: "El semáforo lleva 4 días sin funcionar. No hay señal de tráfico en ninguna dirección, lo que ha causado al menos 2 casi-accidentes. Hay mucho flujo vehicular en horas pico."'}
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

        {/* Tips box */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5" /> Consejos para un buen reporte
          </p>
          <ul className="text-xs text-amber-700 space-y-1">
            <li>• <span className="font-medium">Fotos y videos:</span> podrás adjuntarlos desde el detalle de tu reporte, una vez creado.</li>
            <li>• <span className="font-medium">Ubicación:</span> usa el botón GPS o escribe la dirección más exacta posible.</li>
            <li>• <span className="font-medium">Duplicados:</span> revisa "Mis Incidencias" para evitar reportar el mismo problema dos veces.</li>
          </ul>
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