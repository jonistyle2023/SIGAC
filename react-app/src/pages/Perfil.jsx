import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Lock, Save, Loader2, IdCard, Eye, EyeOff, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import usuarioService from '../services/usuario.service';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { RoleBadge } from '../components/ui/StatusBadge';

const Field = ({ label, icon: Icon, children }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
      {children}
    </div>
  </div>
);

const inputClass = 'block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all';
const pwInputClass = 'block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all';

const PwCheck = ({ ok, label }) => (
  <span className={`flex items-center gap-1 text-xs font-medium ${ok ? 'text-green-600' : 'text-gray-400'}`}>
    {ok ? <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" /> : <X className="h-3.5 w-3.5 flex-shrink-0" />}
    {label}
  </span>
);

const Perfil = () => {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [profileForm, setProfileForm] = useState({ nombre: '', apellido: '', telefono: '', direccion: '' });
  const [passForm, setPassForm] = useState({ passwordActual: '', passwordNueva: '', confirmPasswordNueva: '' });
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    usuarioService.obtenerPerfil()
      .then(res => {
        setPerfil(res.data);
        setProfileForm({
          nombre: res.data.nombre || '',
          apellido: res.data.apellido || '',
          telefono: res.data.telefono || '',
          direccion: res.data.direccion || '',
        });
      })
      .catch(() => toast.error('Error al cargar el perfil'))
      .finally(() => setLoading(false));
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await usuarioService.actualizarPerfil(profileForm);
      setPerfil(res.data);
      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handlePassChange = async (e) => {
    e.preventDefault();
    const pw = passForm.passwordNueva;
    const strong = pw.length >= 8 && /[a-zA-Z]/.test(pw) && /[0-9!@#$%^&*()\-_+=.,;:'"<>?/\\[\]{}|`~]/.test(pw);
    if (!strong) {
      toast.error('La nueva contraseña no cumple los requisitos mínimos');
      return;
    }
    if (passForm.passwordNueva !== passForm.confirmPasswordNueva) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    setChangingPass(true);
    try {
      await usuarioService.cambiarPassword(passForm);
      toast.success('Contraseña actualizada exitosamente');
      setPassForm({ passwordActual: '', passwordNueva: '', confirmPasswordNueva: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cambiar la contraseña');
    } finally {
      setChangingPass(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-sm text-gray-500 mt-0.5">Administra tu información personal</p>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-2xl font-bold">{perfil?.nombre?.[0]?.toUpperCase()}</span>
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold text-gray-900 truncate">{perfil?.nombre} {perfil?.apellido}</p>
          <p className="text-sm text-gray-500 truncate">{perfil?.email}</p>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <RoleBadge rol={perfil?.rol} />
            {perfil?.cedula && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <IdCard className="h-3 w-3" /> {perfil.cedula}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Edit profile */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Información Personal</h2>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre" icon={User}>
              <input
                className={inputClass}
                value={profileForm.nombre}
                onChange={e => setProfileForm(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Tu nombre"
                minLength={2}
              />
            </Field>
            <Field label="Apellido" icon={User}>
              <input
                className={inputClass}
                value={profileForm.apellido}
                onChange={e => setProfileForm(p => ({ ...p, apellido: e.target.value }))}
                placeholder="Tu apellido"
              />
            </Field>
            <Field label="Teléfono" icon={Phone}>
              <input
                className={inputClass}
                value={profileForm.telefono}
                onChange={e => setProfileForm(p => ({ ...p, telefono: e.target.value }))}
                placeholder="0999XXXXXX"
                type="tel"
              />
            </Field>
            <Field label="Correo (no editable)" icon={Mail}>
              <input className={inputClass + ' opacity-60 cursor-not-allowed'} value={perfil?.email || ''} disabled />
            </Field>
          </div>
          <Field label="Dirección" icon={MapPin}>
            <input
              className={inputClass}
              value={profileForm.direccion}
              onChange={e => setProfileForm(p => ({ ...p, direccion: e.target.value }))}
              placeholder="Tu dirección de referencia"
            />
          </Field>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Cambiar Contraseña</h2>
        <form onSubmit={handlePassChange} className="space-y-4">

          {/* Contraseña actual */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña actual</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type={showActual ? 'text' : 'password'}
                className={pwInputClass}
                value={passForm.passwordActual}
                onChange={e => setPassForm(p => ({ ...p, passwordActual: e.target.value }))}
                placeholder="Tu contraseña actual"
                required
              />
              <button
                type="button"
                onClick={() => setShowActual(v => !v)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
                aria-label={showActual ? 'Ocultar' : 'Ver'}
              >
                {showActual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Nueva contraseña */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nueva contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type={showNueva ? 'text' : 'password'}
                className={pwInputClass}
                value={passForm.passwordNueva}
                onChange={e => setPassForm(p => ({ ...p, passwordNueva: e.target.value }))}
                placeholder="Mínimo 8 caracteres"
                required
              />
              <button
                type="button"
                onClick={() => setShowNueva(v => !v)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
                aria-label={showNueva ? 'Ocultar' : 'Ver'}
              >
                {showNueva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passForm.passwordNueva.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 px-1">
                <PwCheck ok={passForm.passwordNueva.length >= 8}                                                                    label="8 caracteres" />
                <PwCheck ok={/[a-zA-Z]/.test(passForm.passwordNueva)}                                                              label="Una letra" />
                <PwCheck ok={/[0-9!@#$%^&*()\-_+=.,;:'"<>?/\\[\]{}|`~]/.test(passForm.passwordNueva)} label="Un número o símbolo" />
              </div>
            )}
          </div>

          {/* Confirmar nueva contraseña */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirmar nueva contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type={showConfirm ? 'text' : 'password'}
                className={`${pwInputClass} ${
                  passForm.confirmPasswordNueva.length > 0
                    ? passForm.passwordNueva === passForm.confirmPasswordNueva
                      ? 'border-green-300 focus:ring-green-400'
                      : 'border-red-300 focus:ring-red-400'
                    : ''
                }`}
                value={passForm.confirmPasswordNueva}
                onChange={e => setPassForm(p => ({ ...p, confirmPasswordNueva: e.target.value }))}
                placeholder="Repite la nueva contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
                aria-label={showConfirm ? 'Ocultar' : 'Ver'}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passForm.confirmPasswordNueva.length > 0 && (
              passForm.passwordNueva === passForm.confirmPasswordNueva
                ? <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Las contraseñas coinciden</p>
                : <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><X className="h-3 w-3" /> Las contraseñas no coinciden</p>
            )}
          </div>

          <button
            type="submit"
            disabled={changingPass}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {changingPass ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Cambiar contraseña
          </button>
        </form>
      </div>
    </div>
  );
};

export default Perfil;