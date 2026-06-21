const STATUS_STYLES = {
  PENDIENTE:    'bg-amber-100 text-amber-800',
  EN_REVISION:  'bg-blue-100 text-blue-800',
  EN_PROCESO:   'bg-orange-100 text-orange-800',
  RESUELTO:     'bg-green-100 text-green-800',
  RECHAZADO:    'bg-red-100 text-red-800',
};

const STATUS_LABELS = {
  PENDIENTE:    'Pendiente',
  EN_REVISION:  'En Revisión',
  EN_PROCESO:   'En Proceso',
  RESUELTO:     'Resuelto',
  RECHAZADO:    'Rechazado',
};

const CATEGORY_STYLES = {
  INFRAESTRUCTURA:   'bg-slate-100 text-slate-700',
  SEGURIDAD:         'bg-red-100 text-red-700',
  SERVICIOS_PUBLICOS:'bg-purple-100 text-purple-700',
  MEDIO_AMBIENTE:    'bg-emerald-100 text-emerald-700',
  OTRO:              'bg-gray-100 text-gray-700',
};

const CATEGORY_LABELS = {
  INFRAESTRUCTURA:    'Infraestructura',
  SEGURIDAD:          'Seguridad',
  SERVICIOS_PUBLICOS: 'Servicios Públicos',
  MEDIO_AMBIENTE:     'Medio Ambiente',
  OTRO:               'Otro',
};

const PRIORITY_STYLES = {
  BAJA:   'bg-gray-100 text-gray-600',
  MEDIA:  'bg-blue-100 text-blue-700',
  ALTA:   'bg-orange-100 text-orange-700',
  CRITICA:'bg-red-100 text-red-700 font-semibold',
};

const ROLE_STYLES = {
  CIUDADANO:       'bg-indigo-100 text-indigo-700',
  ADMINISTRADOR:   'bg-red-100 text-red-700',
  ENTIDAD_PUBLICA: 'bg-purple-100 text-purple-700',
};

const ROLE_LABELS = {
  CIUDADANO:       'Ciudadano',
  ADMINISTRADOR:   'Administrador',
  ENTIDAD_PUBLICA: 'Entidad Pública',
};

export const StatusBadge = ({ estado }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[estado] || 'bg-gray-100 text-gray-700'}`}>
    {STATUS_LABELS[estado] || estado}
  </span>
);

export const CategoryBadge = ({ categoria }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_STYLES[categoria] || 'bg-gray-100 text-gray-700'}`}>
    {CATEGORY_LABELS[categoria] || categoria}
  </span>
);

export const PriorityBadge = ({ prioridad }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLES[prioridad] || 'bg-gray-100 text-gray-700'}`}>
    {prioridad}
  </span>
);

export const RoleBadge = ({ rol }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[rol] || 'bg-gray-100 text-gray-700'}`}>
    {ROLE_LABELS[rol] || rol}
  </span>
);