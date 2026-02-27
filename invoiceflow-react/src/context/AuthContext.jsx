import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('invoiceflow_token'));
    const [loading, setLoading] = useState(true);

    // Auto-load user on mount if token exists
    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    const res = await authAPI.getMe();
                    setUser(res.data.user);
                    localStorage.setItem('invoiceflow_user', res.data.user.name);
                } catch {
                    localStorage.removeItem('invoiceflow_token');
                    localStorage.removeItem('invoiceflow_user');
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };
        loadUser();
    }, [token]);

    const login = async (email, password) => {
        const res = await authAPI.login({ email, password });
        const { token: newToken, user: userData } = res.data;
        localStorage.setItem('invoiceflow_token', newToken);
        localStorage.setItem('invoiceflow_user', userData.name);
        setToken(newToken);
        setUser(userData);
        return userData;
    };

    const register = async (data) => {
        const res = await authAPI.register(data);
        const { token: newToken, user: userData } = res.data;
        localStorage.setItem('invoiceflow_token', newToken);
        localStorage.setItem('invoiceflow_user', userData.name);
        setToken(newToken);
        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('invoiceflow_token');
        localStorage.removeItem('invoiceflow_user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}

export default AuthContext;
