import api from './api';

const incidenciaService = {
  crear: (data) => api.post('/incidencias', data),

  obtenerTodas: (page = 0, size = 20, estado = null) =>
    api.get('/incidencias', { params: { page, size, ...(estado && { estado }) } }),

  obtenerMisIncidencias: (page = 0, size = 20, estado = null) =>
    api.get('/incidencias/mis-incidencias', { params: { page, size, ...(estado && { estado }) } }),

  obtenerAsignadas: (page = 0, size = 20, estado = null) =>
    api.get('/incidencias/asignadas', { params: { page, size, ...(estado && { estado }) } }),

  obtenerPorId: (id) => api.get(`/incidencias/${id}`),

  actualizar: (id, data) => api.put(`/incidencias/${id}`, data),

  cambiarEstado: (id, estado) => api.put(`/incidencias/${id}/estado`, { estado }),

  asignar: (id, entidadId) => api.put(`/incidencias/${id}/asignar`, { entidadId }),

  eliminar: (id) => api.delete(`/incidencias/${id}`),

  generarUrlSubida: (id, fileName, contentType) =>
    api.post(`/incidencias/${id}/multimedia/presigned-url`, { fileName, contentType }),

  confirmarSubida: (id, data) => api.post(`/incidencias/${id}/multimedia`, data),

  eliminarMultimedia: (id, multimediaId) =>
    api.delete(`/incidencias/${id}/multimedia/${multimediaId}`),
};

export default incidenciaService;