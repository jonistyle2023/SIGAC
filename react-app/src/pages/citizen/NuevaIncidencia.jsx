import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Images, MapPin, Loader2, Navigation, AlertCircle,
  CheckCircle2, Pencil, PhoneCall, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import incidenciaService from '../../services/incidencia.service';
import { CategoryBadge } from '../../components/ui/StatusBadge';

const CATEGORIAS = [
  { value: 'INFRAESTRUCTURA', label: 'Infraestructura' },
  { value: 'SEGURIDAD', label: 'Seguridad' },
  { value: 'SERVICIOS_PUBLICOS', label: 'Servicios Públicos' },
  { value: 'MEDIO_AMBIENTE', label: 'Medio Ambiente' },
  { value: 'OTRO', label: 'Otro' },
];

const GRAVEDAD = {
  BAJA: { nivel: 1, label: 'Baja' },
  MEDIA: { nivel: 2, label: 'Media' },
  ALTA: { nivel: 3, label: 'Alta' },
  CRITICA: { nivel: 4, label: 'Crítica' },
};

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 15000;

const inputClass = 'block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all';

const NuevaIncidencia = () => {
  const navigate = useNavigate();
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Foto
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Ubicación
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState(null); // { lat, lng }
  const [locationDenied, setLocationDenied] = useState(false);
  const [direccionReferencia, setDireccionReferencia] = useState('');

  // Detalles opcionales
  const [showDetails, setShowDetails] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // Envío
  const [submitting, setSubmitting] = useState(false);

  // Post-envío: sondeo de clasificación IA
  const [incidenciaId, setIncidenciaId] = useState(null);
  const [polling, setPolling] = useState(false);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [resultado, setResultado] = useState(null); // respuesta completa de la incidencia ya clasificada

  // Corrección inline
  const [correcting, setCorrecting] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({ titulo: '', descripcion: '', categoria: '' });
  const [savingCorrection, setSavingCorrection] = useState(false);

  useEffect(() => {
    return () => { if (photoPreview) URL.revokeObjectURL(photoPreview); };
  }, [photoPreview]);

  const solicitarUbicacion = () => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      return;
    }
    setLocating(true);
    setLocationDenied(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocation(null);
        setLocationDenied(true);
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const handlePickPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setLocation(null);
    setLocationDenied(false);
    solicitarUbicacion();
    e.target.value = '';
  };

  const tieneUbicacion = !!location || (locationDenied && direccionReferencia.trim().length > 0);
  const puedeEnviar = !!photoFile && tieneUbicacion && !submitting;

  const handleEnviar = async () => {
    if (!puedeEnviar) return;
    setSubmitting(true);
    try {
      const { data: incidencia } = await incidenciaService.crear({
        titulo: titulo.trim() || null,
        descripcion: descripcion.trim() || null,
        direccionReferencia: direccionReferencia.trim() || null,
        latitud: location?.lat ?? null,
        longitud: location?.lng ?? null,
      });

      const { data: { presignedUrl, s3Key } } = await incidenciaService.generarUrlSubida(
        incidencia.id, photoFile.name, photoFile.type
      );

      const s3Response = await window.fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': photoFile.type },
        body: photoFile,
      });
      if (!s3Response.ok) {
        throw new Error(`S3 rechazó el archivo (${s3Response.status})`);
      }

      await incidenciaService.confirmarSubida(incidencia.id, {
        s3Key,
        nombreOriginal: photoFile.name,
        contentType: photoFile.type,
        tamanoBytes: photoFile.size,
      });

      setIncidenciaId(incidencia.id);
      setSubmitting(false);
      iniciarSondeo(incidencia.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al enviar el reporte');
      setSubmitting(false);
    }
  };

  const iniciarSondeo = (id) => {
    setPolling(true);
    setPollTimedOut(false);
    const startedAt = Date.now();

    const tick = async () => {
      try {
        const { data } = await incidenciaService.obtenerPorId(id);
        if (data.iaClasificado) {
          setPolling(false);
          setResultado(data);
          return;
        }
      } catch {
        // sigue intentando hasta el timeout
      }
      if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
        setPolling(false);
        setPollTimedOut(true);
        return;
      }
      setTimeout(tick, POLL_INTERVAL_MS);
    };

    setTimeout(tick, POLL_INTERVAL_MS);
  };

  const irADetalle = () => navigate(`/mis-incidencias/${incidenciaId}`);

  const abrirCorreccion = () => {
    setCorrectionForm({
      titulo: resultado?.titulo || '',
      descripcion: resultado?.descripcion || '',
      categoria: resultado?.categoria || '',
    });
    setCorrecting(true);
  };

  const guardarCorreccion = async () => {
    setSavingCorrection(true);
    try {
      await incidenciaService.actualizar(incidenciaId, {
        titulo: correctionForm.titulo.trim() || null,
        descripcion: correctionForm.descripcion.trim() || null,
        categoria: correctionForm.categoria || null,
      });
      toast.success('Reporte actualizado');
      irADetalle();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar la corrección');
      setSavingCorrection(false);
    }
  };

  // ─── Pantalla: resultado de la clasificación IA ──────────────────────────
  if (resultado) {
    const gravedad = GRAVEDAD[resultado.iaPrioridad] || null;

    if (correcting) {
      return (
        <div className="space-y-5">
          <h1 className="text-xl font-bold text-gray-900">Corregir reporte</h1>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Título</label>
              <input
                className={inputClass}
                value={correctionForm.titulo}
                onChange={(e) => setCorrectionForm(p => ({ ...p, titulo: e.target.value }))}
                maxLength={200}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Categoría</label>
              <select
                className={inputClass}
                value={correctionForm.categoria}
                onChange={(e) => setCorrectionForm(p => ({ ...p, categoria: e.target.value }))}
              >
                <option value="">Sin especificar</option>
                {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descripción</label>
              <textarea
                className={inputClass + ' resize-none'}
                rows={5}
                value={correctionForm.descripcion}
                onChange={(e) => setCorrectionForm(p => ({ ...p, descripcion: e.target.value }))}
                maxLength={5000}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCorrecting(false)}
                disabled={savingCorrection}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={guardarCorreccion}
                disabled={savingCorrection}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm disabled:opacity-60"
              >
                {savingCorrection ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-gray-900">¡Reporte enviado!</h1>

        {resultado.alertaEmergencia && (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 flex gap-3">
            <PhoneCall className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-bold mb-1">Riesgo inmediato detectado</p>
              <p className="leading-relaxed">
                Si hay peligro inmediato para la vida o la seguridad, llama ahora al <span className="font-bold">ECU 911</span>.
                Tu reporte ya quedó registrado y será dado seguimiento.
              </p>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-blue-900 mb-1">Detectamos:</p>
          <p className="text-sm text-blue-800 leading-relaxed">
            {resultado.iaResumen || resultado.titulo}
            {gravedad && <> — Gravedad {gravedad.nivel} ({gravedad.label})</>}
          </p>
          {resultado.categoria && (
            <div className="mt-2"><CategoryBadge categoria={resultado.categoria} /></div>
          )}
          {resultado.requiereRevisionManual && (
            <p className="text-xs text-blue-600 mt-2">Un administrador revisará este reporte antes de asignarlo.</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={abrirCorreccion}
            className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50"
          >
            <Pencil className="h-4 w-4" /> Corregir o agregar detalles
          </button>
          <button
            onClick={irADetalle}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm"
          >
            <CheckCircle2 className="h-4 w-4" /> Es correcto
          </button>
        </div>
      </div>
    );
  }

  // ─── Pantalla: analizando (sondeo) ────────────────────────────────────────
  if (polling || pollTimedOut) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-gray-900">¡Reporte enviado!</h1>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center text-center gap-3">
          {polling ? (
            <>
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              <p className="text-sm text-gray-600">Estamos analizando tu reporte con IA...</p>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <p className="text-sm text-gray-600">Tu reporte fue registrado y está siendo analizado. Te avisaremos cuando haya novedades.</p>
            </>
          )}
          <button
            onClick={irADetalle}
            className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Ver mi reporte
          </button>
        </div>
      </div>
    );
  }

  // ─── Pantalla: captura ────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Nueva Incidencia</h1>
        <p className="text-sm text-gray-500 mt-0.5">Toma una foto del problema y listo — nosotros nos encargamos del resto.</p>
      </div>

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePickPhoto} />
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handlePickPhoto} />

      {!photoPreview ? (
        <div className="space-y-3">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-3 py-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-3xl font-bold shadow-lg shadow-blue-200 transition-colors"
          >
            <Camera className="h-10 w-10" />
            Tomar foto
          </button>
          <button
            onClick={() => galleryInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-sm hover:bg-gray-50"
          >
            <Images className="h-4 w-4" /> Elegir de la galería
          </button>
        </div>
      ) : (
        <>
          <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[4/3]">
            <img src={photoPreview} alt="Foto de la incidencia" className="w-full h-full object-cover" />
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow"
            >
              Cambiar foto
            </button>
          </div>

          {/* Ubicación */}
          <div className="bg-blue-50 rounded-2xl p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" /> Ubicación
            </p>

            {locating && (
              <p className="flex items-center gap-2 text-sm text-blue-700">
                <Loader2 className="h-4 w-4 animate-spin" /> Obteniendo tu ubicación...
              </p>
            )}

            {location && !locating && (
              <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
                <Navigation className="h-3.5 w-3.5 text-green-500" />
                Ubicación detectada: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
            )}

            {locationDenied && !locating && (
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  No pudimos obtener tu ubicación. Escribe una dirección de referencia para continuar.
                </p>
                <input
                  className={inputClass + ' bg-white'}
                  placeholder="Ej: Av. Principal y Calle 5, frente al parque"
                  value={direccionReferencia}
                  onChange={(e) => setDireccionReferencia(e.target.value)}
                  maxLength={500}
                  required
                />
                <button type="button" onClick={solicitarUbicacion} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                  Reintentar GPS
                </button>
              </div>
            )}
          </div>

          {/* Detalles opcionales */}
          <div>
            <button
              onClick={() => setShowDetails(s => !s)}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Agregar detalles
            </button>
            {showDetails && (
              <div className="mt-3 space-y-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Título</label>
                  <input className={inputClass} value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={200} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                  <textarea
                    className={inputClass + ' resize-none'}
                    rows={4}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    maxLength={5000}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleEnviar}
            disabled={!puedeEnviar}
            className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 transition-colors disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Enviar reporte'}
          </button>
        </>
      )}
    </div>
  );
};

export default NuevaIncidencia;
