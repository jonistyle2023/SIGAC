import { useState, useEffect } from 'react';
import { Search, UserCheck, UserX, ChevronDown, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import usuarioService from '../../services/usuario.service';
import { RoleBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';

const ROLES = ['CIUDADANO', 'ADMINISTRADOR', 'ENTIDAD_PUBLICA'];

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rolFiltro, setRolFiltro] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  const load = () => {
    setLoading(true);
    usuarioService.obtenerTodos()
      .then(res => { setUsuarios(res.data); setFiltered(res.data); })
      .catch(() => toast.error('Error al cargar usuarios'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let result = usuarios;
    if (search) result = result.filter(u =>
      `${u.nombre} ${u.apellido} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    );
    if (rolFiltro) result = result.filter(u => u.rol === rolFiltro);
    setFiltered(result);
  }, [search, rolFiltro, usuarios]);

  const toggle = async (usuario) => {
    const action = usuario.activo ? 'desactivar' : 'activar';
    setPendingAction(usuario.id);
    try {
      if (usuario.activo) await usuarioService.desactivar(usuario.id);
      else await usuarioService.activar(usuario.id);
      toast.success(`Usuario ${action === 'activar' ? 'activado' : 'desactivado'}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || `Error al ${action} usuario`);
    } finally {
      setPendingAction(null);
    }
  };

  const cambiarRol = async (userId, nuevoRol) => {
    setPendingAction(userId);
    try {
      await usuarioService.cambiarRol(userId, nuevoRol);
      toast.success('Rol actualizado');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cambiar rol');
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Usuarios</h1>
        <p className="text-xs text-gray-400 mt-0.5">{usuarios.length} en total</p>
      </div>

      {/* Búsqueda + filtro */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            className="pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={rolFiltro}
            onChange={e => setRolFiltro(e.target.value)}
          >
            <option value="">Todos</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState title="Sin resultados" description="No hay usuarios que coincidan con la búsqueda" />
      ) : (
        <div className="space-y-2">
          {filtered.map(u => (
            <div key={u.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${u.activo ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <span className="text-white text-sm font-bold">{u.nombre?.[0]?.toUpperCase()}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{u.nombre} {u.apellido}</span>
                    {!u.activo && <span className="text-xs text-red-500 font-medium">Inactivo</span>}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  <div className="mt-1.5">
                    <RoleBadge rol={u.rol} />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                {/* Cambiar rol */}
                <div className="relative flex-1 min-w-32">
                  <select
                    className="w-full pl-3 pr-7 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={u.rol}
                    onChange={e => cambiarRol(u.id, e.target.value)}
                    disabled={pendingAction === u.id}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                </div>

                {/* Activar/Desactivar */}
                <button
                  onClick={() => toggle(u)}
                  disabled={pendingAction === u.id}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 ${
                    u.activo
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {pendingAction === u.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : u.activo
                      ? <><UserX className="h-3.5 w-3.5" />Desactivar</>
                      : <><UserCheck className="h-3.5 w-3.5" />Activar</>
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Usuarios;