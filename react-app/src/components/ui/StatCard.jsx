export const StatCard = ({ title, value, icon: Icon, colorClass = 'bg-blue-50 text-blue-600' }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
    <div className={`p-3 rounded-xl ${colorClass}`}>
      <Icon className="h-6 w-6" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 font-medium truncate">{title}</p>
      <p className="text-2xl font-bold text-gray-900 leading-tight">{value ?? '—'}</p>
    </div>
  </div>
);