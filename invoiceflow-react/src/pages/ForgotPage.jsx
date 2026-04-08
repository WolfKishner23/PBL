import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/auth.css';

export default function ForgotPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authAPI.forgot(email);
            setSent(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
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
                            <p className="auth-subtext">Enter your email and we'll send you a reset OTP</p>

                            {error && (
                                <div style={{
                                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                    borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
                                    color: '#EF4444', fontSize: '13px'
                                }}>
                                    {error}
                                </div>
                            )}

                            <form className="auth-form" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="forgotEmail">Email address</label>
                                    <input type="email" className="form-input" id="forgotEmail" placeholder="name@company.com" required value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                                <button type="submit" className="btn-auth-primary" disabled={loading}>
                                    {loading ? 'Sending OTP…' : 'Send OTP'}
                                </button>
                            </form>
                            <p className="auth-footer-text">
                                <Link to="/login" className="form-link">← Back to Sign In</Link>
                            </p>
                        </>
                    ) : (
                        <div className="forgot-success">
                            <div className="forgot-icon">✅</div>
                            <h1 className="auth-heading">Check your email</h1>
                            <p className="auth-subtext">We've sent a 6-digit OTP to <strong>{email}</strong></p>
                            <Link to="/login" className="btn-auth-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>Back to Sign In</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
