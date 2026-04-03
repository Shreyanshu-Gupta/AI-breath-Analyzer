import { Navigate, Outlet } from 'react-router-dom';

export function ProtectedRoute() {
  const currentUser = localStorage.getItem('currentUser');
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
