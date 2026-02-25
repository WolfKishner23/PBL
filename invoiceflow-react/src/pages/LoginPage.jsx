import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/auth.css';

export default function LoginPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    function doLogin(e) {
        if (e) e.preventDefault();
        if (!name.trim()) return;
        localStorage.setItem('invoiceflow_user', name.trim());
        setLoading(true);
        setTimeout(() => navigate('/dashboard'), 800);
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

                        <button className="btn-google" onClick={doLogin}>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
                                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>

                        <div className="auth-divider"><span>or</span></div>

                        <form className="auth-form" onSubmit={doLogin}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="loginName">Full Name</label>
                                <input type="text" className="form-input" id="loginName" placeholder="Enter your name" required value={name} onChange={e => setName(e.target.value)} />
                            </div>
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
