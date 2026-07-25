export const StatCard = ({ title, value, icon: Icon, colorClass = 'bg-blue-50 text-blue-600' }) => (
  <div className="min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
    <div className={`flex-shrink-0 p-2.5 sm:p-3 rounded-xl ${colorClass}`}>
      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 font-medium truncate">{title}</p>
      <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight truncate">{value ?? '—'}</p>
    </div>
  </div>
);