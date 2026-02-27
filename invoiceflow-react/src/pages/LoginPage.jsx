import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    async function doLogin(e) {
        if (e) e.preventDefault();
        if (!email.trim() || !password.trim()) return;
        setError('');
        setLoading(true);

        try {
            const user = await login(email, password);
            // Redirect based on role
            const roleRoutes = { business: '/dashboard', finance: '/finance', admin: '/admin' };
            navigate(roleRoutes[user.role] || '/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
            setLoading(false);
        }
    }

    return (
        <div className="auth-body">
            <div className="login-split">
                {/* LEFT PANEL — FORM */}
                <div className="login-left">
                    <div className="login-form-wrap">
                        <Link to="/" className="auth-logo" aria-label="InvoiceFlow home">
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                <rect width="28" height="28" rx="6" fill="#3B82F6" />
                                <path d="M8 8h12v2H8zm0 5h8v2H8zm0 5h10v2H8z" fill="#fff" />
                            </svg>
                            <span>InvoiceFlow</span>
                        </Link>

                        <h1 className="auth-heading">Welcome back</h1>
                        <p className="auth-subtext">Sign in to your account</p>

                        {error && (
                            <div style={{
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
                                color: '#EF4444', fontSize: '13px'
                            }}>
                                {error}
                            </div>
                        )}

                        <form className="auth-form" onSubmit={doLogin}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="loginEmail">Email address</label>
                                <input type="email" className="form-input" id="loginEmail" placeholder="name@company.com" required value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <div className="form-label-row">
                                    <label className="form-label" htmlFor="loginPassword">Password</label>
                                    <Link to="/forgot" className="form-link">Forgot password?</Link>
                                </div>
                                <input type="password" className="form-input" id="loginPassword" placeholder="••••••••" required value={password} onChange={e => setPassword(e.target.value)} />
                            </div>
                            <button type="submit" className="btn-auth-primary" disabled={loading}>
                                {loading ? 'Signing in…' : 'Sign In'}
                            </button>
                        </form>

                        <p className="auth-footer-text">
                            Don't have an account? <Link to="/register" className="form-link">Sign up</Link>
                        </p>
                    </div>
                </div>

                {/* RIGHT PANEL — DECORATIVE */}
                <div className="login-right">
                    <div className="login-right-bg">
                        <div className="glow glow-1"></div>
                        <div className="glow glow-2"></div>
                    </div>
                    <div className="floating-card fc-1">
                        <span className="fc-label">Funded Today</span>
                        <span className="fc-amount mono">₹4,85,000</span>
                        <span className="badge fc-badge-purple">Funded</span>
                    </div>
                    <div className="floating-card fc-2">
                        <span className="fc-label">AI Risk Score — INV-2024-002</span>
                        <div className="fc-score-row">
                            <span className="fc-score mono">88<span className="fc-score-sub">/100</span></span>
                            <span className="badge fc-badge-green">Low Risk</span>
                        </div>
                    </div>
                    <div className="login-right-brand">
                        <h2>Get paid today,<br />not in 90 days.</h2>
                        <p>AI-powered invoice factoring for Indian businesses</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
