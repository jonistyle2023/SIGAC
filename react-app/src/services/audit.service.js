import api from './api';

const auditService = {
  obtenerTodos: (page = 0, size = 50) =>
    api.get('/audit', { params: { page, size } }),

  obtenerPorUsuario: (userId) =>
    api.get(`/audit/usuario/${userId}`),

  obtenerPorAccion: (action) =>
    api.get(`/audit/accion/${action}`),
};

export default auditService;