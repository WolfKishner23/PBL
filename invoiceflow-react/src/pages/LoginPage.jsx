import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const navigate = useNavigate();
    const { login } = useAuth();

    function validateEmail(val) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(val);
    }

    function validateFields() {
        const errors = {};
        if (!email.trim()) {
            errors.email = 'Email is required';
        } else if (!validateEmail(email)) {
            errors.email = 'Please enter a valid email address';
        }
        if (!password.trim()) {
            errors.password = 'Password is required';
        } else if (password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function doLogin(e) {
        if (e) e.preventDefault();
        if (!validateFields()) return;
        setError('');
        setLoading(true);

        try {
            const user = await login(email, password);
            const roleRoutes = { business: '/dashboard', finance: '/finance', admin: '/admin' };
            navigate(roleRoutes[user.role] || '/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
            setLoading(false);
        }
    }

    function handleEmailChange(val) {
        setEmail(val);
        if (fieldErrors.email) {
            const errors = { ...fieldErrors };
            if (val.trim() && validateEmail(val)) delete errors.email;
            setFieldErrors(errors);
        }
    }

    function handlePasswordChange(val) {
        setPassword(val);
        if (fieldErrors.password) {
            const errors = { ...fieldErrors };
            if (val.length >= 8) delete errors.password;
            setFieldErrors(errors);
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
                                <input
                                    type="email"
                                    className={`form-input${fieldErrors.email ? ' input-error' : ''}`}
                                    id="loginEmail"
                                    placeholder="name@company.com"
                                    required
                                    value={email}
                                    onChange={e => handleEmailChange(e.target.value)}
                                />
                                {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                            </div>
                            <div className="form-group">
                                <div className="form-label-row">
                                    <label className="form-label" htmlFor="loginPassword">Password</label>
                                    <Link to="/forgot" className="form-link">Forgot password?</Link>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className={`form-input${fieldErrors.password ? ' input-error' : ''}`}
                                        id="loginPassword"
                                        placeholder="••••••••"
                                        required
                                        value={password}
                                        onChange={e => handlePasswordChange(e.target.value)}
                                        style={{ paddingRight: '44px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {showPassword ? (
                                            /* Eye-off icon */
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            /* Eye icon */
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
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
