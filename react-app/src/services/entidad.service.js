import api from './api';

const entidadService = {
  obtenerTodas:  ()       => api.get('/entidades'),
  obtenerActivas: ()      => api.get('/entidades/activas'),
  obtenerPorId:  (id)     => api.get(`/entidades/${id}`),
  crear:         (data)   => api.post('/entidades', data),
  actualizar:    (id, data) => api.put(`/entidades/${id}`, data),
  toggleActivo:  (id)     => api.patch(`/entidades/${id}/toggle`),
  eliminar:      (id)     => api.delete(`/entidades/${id}`),
};

export default entidadService;
