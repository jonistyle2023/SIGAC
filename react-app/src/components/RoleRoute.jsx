import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleRoute = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  if (!allowedRoles.includes(user?.rol)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default RoleRoute;