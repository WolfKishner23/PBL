import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/auth.css';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const emailFromUrl = searchParams.get('email') || '';

    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (otp.length !== 6) {
            setError('Please enter the 6-digit OTP from your email.');
            return;
        }
        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters.');
            return;
        }

        setLoading(true);
        try {
            await authAPI.resetPassword(emailFromUrl, otp, newPassword);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
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

                    {success ? (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div className="forgot-icon">✅</div>
                            <h1 className="auth-heading">Password Reset!</h1>
                            <p className="auth-subtext">Your password has been updated successfully.<br />Redirecting to sign in…</p>
                            <Link to="/login" className="btn-auth-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '16px' }}>
                                Go to Sign In
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="forgot-icon">📩</div>
                            <h1 className="auth-heading">Enter OTP</h1>
                            <p className="auth-subtext">
                                We sent a 6-digit OTP to <strong>{emailFromUrl}</strong>.<br />
                                Check your inbox and enter it below.
                            </p>

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
                                {/* OTP Input */}
                                <div className="form-group">
                                    <label className="form-label" htmlFor="resetOtp">6-Digit OTP</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        id="resetOtp"
                                        placeholder="e.g. 483920"
                                        maxLength={6}
                                        required
                                        value={otp}
                                        onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                        style={{ letterSpacing: '6px', fontSize: '20px', textAlign: 'center' }}
                                    />
                                </div>

                                {/* New Password Input */}
                                <div className="form-group">
                                    <label className="form-label" htmlFor="resetPassword">New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className="form-input"
                                            id="resetPassword"
                                            placeholder="Min 8 characters"
                                            required
                                            minLength={8}
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            style={{ paddingRight: '44px' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            style={{
                                                position: 'absolute', right: '12px', top: '50%',
                                                transform: 'translateY(-50%)', background: 'none',
                                                border: 'none', cursor: 'pointer', padding: '4px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}
                                        >
                                            {showPassword ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                                                    <line x1="1" y1="1" x2="23" y2="23" />
                                                </svg>
                                            ) : (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" className="btn-auth-primary" disabled={loading}>
                                    {loading ? 'Resetting…' : 'Reset Password'}
                                </button>
                            </form>

                            <p className="auth-footer-text" style={{ marginTop: '16px' }}>
                                Didn't receive the OTP?{' '}
                                <Link to="/forgot" className="form-link">Resend OTP</Link>
                            </p>
                            <p className="auth-footer-text">
                                <Link to="/login" className="form-link">← Back to Sign In</Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
