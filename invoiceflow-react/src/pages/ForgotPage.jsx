import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/auth.css';

export default function ForgotPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    function handleSubmit(e) {
        e.preventDefault();
        setSent(true);
    }

    return (
        <div className="auth-body">
            <div className="forgot-container">
                <div className="forgot-card">
                    <Link to="/" className="auth-logo" aria-label="InvoiceFlow home">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <rect width="28" height="28" rx="6" fill="#3B82F6" />
                            <path d="M8 8h12v2H8zm0 5h8v2H8zm0 5h10v2H8z" fill="#fff" />
                        </svg>
                        <span>InvoiceFlow</span>
                    </Link>

                    {!sent ? (
                        <>
                            <div className="forgot-icon">🔑</div>
                            <h1 className="auth-heading">Reset password</h1>
                            <p className="auth-subtext">Enter your email and we'll send you a reset link</p>
                            <form className="auth-form" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="forgotEmail">Email address</label>
                                    <input type="email" className="form-input" id="forgotEmail" placeholder="name@company.com" required value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                                <button type="submit" className="btn-auth-primary">Send Reset Link</button>
                            </form>
                            <p className="auth-footer-text">
                                <Link to="/login" className="form-link">← Back to Sign In</Link>
                            </p>
                        </>
                    ) : (
                        <div className="forgot-success">
                            <div className="forgot-icon">✅</div>
                            <h1 className="auth-heading">Check your email</h1>
                            <p className="auth-subtext">We've sent a password reset link to <strong>{email}</strong></p>
                            <Link to="/login" className="btn-auth-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>Back to Sign In</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
