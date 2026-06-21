import { useState, useEffect } from 'react';
import { Plus, Building2, Phone, Mail, Users, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import entidadService from '../../services/entidad.service';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';

const TIPOS = ['BOMBEROS', 'POLICIA', 'TRANSITO', 'AMBULANCIA', 'MEDIO_AMBIENTE', 'OTRO'];

const TIPO_LABEL = {
  BOMBEROS: 'Bomberos',
  POLICIA: 'Policía',
  TRANSITO: 'Tránsito',
  AMBULANCIA: 'Ambulancia',
  MEDIO_AMBIENTE: 'Medio Ambiente',
  OTRO: 'Otro',
};

const TIPO_COLOR = {
  BOMBEROS:      'bg-red-100 text-red-700',
  POLICIA:       'bg-blue-100 text-blue-700',
  TRANSITO:      'bg-yellow-100 text-yellow-700',
  AMBULANCIA:    'bg-green-100 text-green-700',
  MEDIO_AMBIENTE:'bg-emerald-100 text-emerald-700',
  OTRO:          'bg-gray-100 text-gray-600',
};

const EMPTY_FORM = { nombre: '', tipo: '', descripcion: '', telefono: '', emailContacto: '' };
const EMPTY_FUNC = { nombre: '', apellido: '', email: '', password: '', confirmPassword: '', telefono: '' };

const Modal = ({ title, onClose, onSubmit, form, setForm, saving }) => {
  const inputClass = 'block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Nombre *</label>
            <input className={inputClass} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Tipo *</label>
            <div className="relative">
              <select className={inputClass + ' appearance-none'} value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} required>
                <option value="">Seleccionar tipo...</option>
                {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Descripción</label>
            <textarea className={inputClass} rows={2} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Teléfono</label>
              <input className={inputClass} value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Email contacto</label>
              <input type="email" className={inputClass} value={form.emailContacto} onChange={e => setForm(f => ({ ...f, emailContacto: e.target.value }))} />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FuncionarioModal = ({ entidad, onClose }) => {
  const [form, setForm] = useState(EMPTY_FUNC);
  const [saving, setSaving] = useState(false);
  const inputClass = 'block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/auth/register-entidad', { ...form, entidadId: entidad.id });
      toast.success('Funcionario registrado correctamente');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrar funcionario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Nuevo funcionario</h2>
            <p className="text-xs text-gray-400 mt-0.5">{entidad.nombre}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Nombre *</label>
              <input className={inputClass} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Apellido</label>
              <input className={inputClass} value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Email *</label>
            <input type="email" className={inputClass} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Teléfono</label>
            <input className={inputClass} value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Contraseña *</label>
            <input type="password" className={inputClass} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Confirmar contraseña *</label>
            <input type="password" className={inputClass} value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} required />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Entidades = () => {
  const [entidades, setEntidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFuncModal, setShowFuncModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [pendingToggle, setPendingToggle] = useState(null);

  const load = () => {
    entidadService.obtenerTodas()
      .then(res => { setEntidades(res.data); setLoading(false); })
      .catch(() => { toast.error('Error al cargar entidades'); setLoading(false); });
  };

  useEffect(() => { load(); }, []); // mount-only: load is intentionally excluded

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (entidad) => {
    setEditing(entidad);
    setForm({
      nombre: entidad.nombre,
      tipo: entidad.tipo,
      descripcion: entidad.descripcion || '',
      telefono: entidad.telefono || '',
      emailContacto: entidad.emailContacto || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await entidadService.actualizar(editing.id, form);
        toast.success('Entidad actualizada');
      } else {
        await entidadService.crear(form);
        toast.success('Entidad creada');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (entidad) => {
    setPendingToggle(entidad.id);
    try {
      await entidadService.toggleActivo(entidad.id);
      toast.success(entidad.activo ? 'Entidad desactivada' : 'Entidad activada');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cambiar estado');
    } finally {
      setPendingToggle(null);
    }
  };

  const handleEliminar = async (entidad) => {
    if (!window.confirm(`¿Eliminar la entidad "${entidad.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await entidadService.eliminar(entidad.id);
      toast.success('Entidad eliminada');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Entidades</h1>
          <p className="text-xs text-gray-400 mt-0.5">{entidades.length} registradas</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva
        </button>
      </div>

      {loading ? <LoadingSpinner /> : entidades.length === 0 ? (
        <EmptyState title="Sin entidades" description="Crea la primera entidad pública para comenzar a asignar incidencias" />
      ) : (
        <div className="space-y-3">
          {entidades.map(e => (
            <div key={e.id} className={`bg-white rounded-2xl border shadow-sm p-4 ${!e.activo ? 'border-gray-100 opacity-60' : 'border-gray-100'}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{e.nombre}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_COLOR[e.tipo]}`}>
                      {TIPO_LABEL[e.tipo]}
                    </span>
                    {!e.activo && <span className="text-xs text-red-500 font-medium">Inactiva</span>}
                  </div>

                  {e.descripcion && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{e.descripcion}</p>
                  )}

                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {e.telefono && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Phone className="h-3 w-3" /> {e.telefono}
                      </span>
                    )}
                    {e.emailContacto && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Mail className="h-3 w-3" /> {e.emailContacto}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Users className="h-3 w-3" /> {e.totalFuncionarios} funcionario{e.totalFuncionarios !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openEdit(e)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </button>

                <button
                  onClick={() => handleToggle(e)}
                  disabled={pendingToggle === e.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 ${
                    e.activo ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'
                  }`}
                >
                  {pendingToggle === e.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : e.activo
                      ? <><ToggleRight className="h-3.5 w-3.5" />Desactivar</>
                      : <><ToggleLeft className="h-3.5 w-3.5" />Activar</>
                  }
                </button>

                <button
                  onClick={() => setShowFuncModal(e)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-600 hover:bg-purple-50 transition-colors"
                >
                  <Users className="h-3.5 w-3.5" /> Funcionario
                </button>

                {e.totalFuncionarios === 0 && (
                  <button
                    onClick={() => handleEliminar(e)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors ml-auto"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal
          title={editing ? 'Editar entidad' : 'Nueva entidad'}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          form={form}
          setForm={setForm}
          saving={saving}
        />
      )}

      {showFuncModal && (
        <FuncionarioModal
          entidad={showFuncModal}
          onClose={() => { setShowFuncModal(null); load(); }}
        />
      )}
    </div>
  );
};

export default Entidades;
