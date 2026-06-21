import { useAuth } from '../context/AuthContext';
import CitizenDashboard from './citizen/CitizenDashboard';
import AdminDashboard from './admin/AdminDashboard';
import EntidadDashboard from './entidad/EntidadDashboard';

const Dashboard = () => {
  const { user } = useAuth();
  if (user?.rol === 'ADMINISTRADOR')   return <AdminDashboard />;
  if (user?.rol === 'ENTIDAD_PUBLICA') return <EntidadDashboard />;
  return <CitizenDashboard />;
};

export default Dashboard;