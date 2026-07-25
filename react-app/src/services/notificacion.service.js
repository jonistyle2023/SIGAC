import api from './api';

const notificacionService = {
  obtenerMisNotificaciones: (page = 0, size = 20) =>
    api.get('/notificaciones', { params: { page, size } }),

  contarNoLeidas: () => api.get('/notificaciones/no-leidas/contador'),

  marcarLeida: (id) => api.put(`/notificaciones/${id}/leer`),

  marcarTodasLeidas: () => api.put('/notificaciones/leer-todas'),
};

export default notificacionService;
