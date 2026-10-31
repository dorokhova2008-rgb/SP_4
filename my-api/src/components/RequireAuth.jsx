import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
  export default function RequireAuth({ children, role }) {
    const { user } = useContext(AuthContext);
    const location = useLocation();

    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location.pathname, message: 'Чтобы открыть этот раздел, войдите в аккаунт' }}
            />
        );
    }

    if (role && user.role_name !== role) {
        return <Navigate to="/" replace />;
    }

    return children;
}
