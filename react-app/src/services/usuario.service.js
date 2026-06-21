import api from './api';

const usuarioService = {
  obtenerPerfil: () => api.get('/usuarios/perfil'),

  actualizarPerfil: (data) => api.put('/usuarios/perfil', data),

  cambiarPassword: (data) => api.put('/usuarios/perfil/password', data),

  obtenerTodos: () => api.get('/usuarios'),

  obtenerTodosActivos: () => api.get('/usuarios/filtro/activos'),

  obtenerPorId: (id) => api.get(`/usuarios/${id}`),

  actualizarUsuario: (id, data) => api.put(`/usuarios/${id}`, data),

  cambiarRol: (id, nuevoRol) =>
    api.put(`/usuarios/${id}/rol`, null, { params: { nuevoRol } }),

  activar: (id) => api.put(`/usuarios/${id}/activar`),

  desactivar: (id) => api.put(`/usuarios/${id}/desactivar`),
};

export default usuarioService;