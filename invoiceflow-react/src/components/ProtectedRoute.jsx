import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
    const { user, token, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100vh', background: '#0B0F1A', color: '#94A3B8',
                fontFamily: 'Sora, sans-serif', fontSize: '16px'
            }}>
                Loading...
            </div>
        );
    }

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (roles && user && !roles.includes(user.role)) {
        // Redirect to the correct dashboard for their role
        const roleRoutes = { business: '/dashboard', finance: '/finance', admin: '/admin' };
        return <Navigate to={roleRoutes[user.role] || '/dashboard'} replace />;
    }

    return children;
}
