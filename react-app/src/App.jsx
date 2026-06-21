import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import MainLayout from './layouts/MainLayout';
import RoleRoute from './components/RoleRoute';

// Public pages (eager — small, loaded immediately)
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy-loaded pages
const Dashboard      = lazy(() => import('./pages/Dashboard'));
const Perfil         = lazy(() => import('./pages/Perfil'));

// Ciudadano
const MisIncidencias    = lazy(() => import('./pages/citizen/MisIncidencias'));
const NuevaIncidencia   = lazy(() => import('./pages/citizen/NuevaIncidencia'));
const IncidenciaDetalle = lazy(() => import('./pages/citizen/IncidenciaDetalle'));

// Admin
const AdminIncidencias  = lazy(() => import('./pages/admin/Incidencias'));
const AdminIncidencia   = lazy(() => import('./pages/admin/IncidenciaDetalle'));
const AdminUsuarios     = lazy(() => import('./pages/admin/Usuarios'));
const AdminAuditoria    = lazy(() => import('./pages/admin/Auditoria'));

// Entidad
const EntidadIncidencias  = lazy(() => import('./pages/entidad/Incidencias'));
const EntidadIncidencia   = lazy(() => import('./pages/entidad/IncidenciaDetalle'));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <Routes>
            {/* Public */}
            <Route path="/"         element={<Landing />} />
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected — all inside MainLayout */}
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/perfil"    element={<Perfil />} />

              {/* Ciudadano */}
              <Route path="/mis-incidencias" element={
                <RoleRoute allowedRoles={['CIUDADANO']}>
                  <MisIncidencias />
                </RoleRoute>
              } />
              <Route path="/mis-incidencias/nueva" element={
                <RoleRoute allowedRoles={['CIUDADANO']}>
                  <NuevaIncidencia />
                </RoleRoute>
              } />
              <Route path="/mis-incidencias/:id" element={
                <RoleRoute allowedRoles={['CIUDADANO']}>
                  <IncidenciaDetalle />
                </RoleRoute>
              } />

              {/* Admin */}
              <Route path="/admin/incidencias" element={
                <RoleRoute allowedRoles={['ADMINISTRADOR']}>
                  <AdminIncidencias />
                </RoleRoute>
              } />
              <Route path="/admin/incidencias/:id" element={
                <RoleRoute allowedRoles={['ADMINISTRADOR']}>
                  <AdminIncidencia />
                </RoleRoute>
              } />
              <Route path="/admin/usuarios" element={
                <RoleRoute allowedRoles={['ADMINISTRADOR']}>
                  <AdminUsuarios />
                </RoleRoute>
              } />
              <Route path="/admin/auditoria" element={
                <RoleRoute allowedRoles={['ADMINISTRADOR']}>
                  <AdminAuditoria />
                </RoleRoute>
              } />

              {/* Entidad */}
              <Route path="/entidad/incidencias" element={
                <RoleRoute allowedRoles={['ENTIDAD_PUBLICA']}>
                  <EntidadIncidencias />
                </RoleRoute>
              } />
              <Route path="/entidad/incidencias/:id" element={
                <RoleRoute allowedRoles={['ENTIDAD_PUBLICA']}>
                  <EntidadIncidencia />
                </RoleRoute>
              } />
            </Route>

            {/* Legacy redirect + catchall */}
            <Route path="/welcome" element={<Navigate to="/dashboard" replace />} />
            <Route path="*"        element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;