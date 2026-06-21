import { FileX } from 'lucide-react';

export const EmptyState = ({ icon: Icon = FileX, title = 'Sin resultados', description = '', action = null }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="bg-gray-100 p-4 rounded-full mb-4">
      <Icon className="h-8 w-8 text-gray-400" />
    </div>
    <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 mb-4 max-w-xs">{description}</p>}
    {action}
  </div>
);