import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ children }) {
  const { user, ready } = useSelector((s) => s.auth);
  if (!ready) return <p className="muted center-note">Loading...</p>;
  return user ? children : <Navigate to="/login" replace />;
}
