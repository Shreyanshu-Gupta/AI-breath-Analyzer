import { Navigate, Outlet } from 'react-router-dom';

export function ProtectedRoute() {
  const currentUser = localStorage.getItem('currentUser');
  const token = localStorage.getItem('token');
  
  if (!currentUser || !token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
