import api from './api';

const reporteService = {
  obtenerKpis: (desde, hasta) =>
    api.get('/reportes/kpis', { params: { ...(desde && { desde }), ...(hasta && { hasta }) } }),

  exportar: (formato, { desde, hasta, estado, categoria } = {}) =>
    api.get('/reportes/exportar', {
      params: {
        formato,
        ...(desde && { desde }),
        ...(hasta && { hasta }),
        ...(estado && { estado }),
        ...(categoria && { categoria }),
      },
      responseType: 'blob',
    }),
};

export default reporteService;
