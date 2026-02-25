import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/auth.css';

export default function RegisterPage() {
    const [step, setStep] = useState(1);
    const [role, setRole] = useState('');
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [businessData, setBusinessData] = useState({ company: '', gstin: '', industry: '' });
    const navigate = useNavigate();

    function handleStep1(e) {
        e.preventDefault();
        setStep(2);
    }

    function handleStep2(e) {
        e.preventDefault();
        localStorage.setItem('invoiceflow_user', formData.name);
        setStep(3);
    }

    return (
        <div className="auth-body">
            <div className="register-container">
                <div className="register-card">
                    {/* Logo */}
                    <Link to="/" className="auth-logo" aria-label="InvoiceFlow home">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <rect width="28" height="28" rx="6" fill="#3B82F6" />
                            <path d="M8 8h12v2H8zm0 5h8v2H8zm0 5h10v2H8z" fill="#fff" />
                        </svg>
                        <span>InvoiceFlow</span>
                    </Link>

                    {/* Step Bar */}
                    <div className="step-bar">
                        <div className={`step-bar-item${step >= 1 ? ' active' : ''}`}>
                            <div className="step-bar-circle">{step > 1 ? '✓' : '1'}</div>
                            <span>Account</span>
                        </div>
                        <div className={`step-bar-line${step >= 2 ? ' active' : ''}`}></div>
                        <div className={`step-bar-item${step >= 2 ? ' active' : ''}`}>
                            <div className="step-bar-circle">{step > 2 ? '✓' : '2'}</div>
                            <span>Business</span>
                        </div>
                        <div className={`step-bar-line${step >= 3 ? ' active' : ''}`}></div>
                        <div className={`step-bar-item${step >= 3 ? ' active' : ''}`}>
                            <div className="step-bar-circle">3</div>
                            <span>Done</span>
                        </div>
                    </div>

                    {/* Step 1 */}
                    {step === 1 && (
                        <div className="register-step">
                            <h1 className="auth-heading">Create your account</h1>
                            <p className="auth-subtext">Start factoring invoices in minutes</p>

                            <div className="role-cards">
                                <button className={`role-card${role === 'business' ? ' selected' : ''}`} onClick={() => setRole('business')}>
                                    <span className="role-icon">🏢</span>
                                    <span className="role-label">Business Owner</span>
                                    <span className="role-desc">Upload invoices & get funded</span>
                                </button>
                                <button className={`role-card${role === 'finance' ? ' selected' : ''}`} onClick={() => setRole('finance')}>
                                    <span className="role-icon">💰</span>
                                    <span className="role-label">Finance Partner</span>
                                    <span className="role-desc">Fund invoices & earn returns</span>
                                </button>
                            </div>

                            <form className="auth-form" onSubmit={handleStep1}>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="regName">Full Name</label>
                                    <input type="text" className="form-input" id="regName" placeholder="Enter your name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="regEmail">Email address</label>
                                    <input type="email" className="form-input" id="regEmail" placeholder="name@company.com" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="regPassword">Password</label>
                                    <input type="password" className="form-input" id="regPassword" placeholder="Create a strong password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                </div>
                                <button type="submit" className="btn-auth-primary">Continue</button>
                            </form>

                            <p className="auth-footer-text">
                                Already have an account? <Link to="/login" className="form-link">Sign in</Link>
                            </p>
                        </div>
                    )}

                    {/* Step 2 */}
                    {step === 2 && (
                        <div className="register-step">
                            <h1 className="auth-heading">Business details</h1>
                            <p className="auth-subtext">Tell us about your company</p>
                            <form className="auth-form" onSubmit={handleStep2}>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="companyName">Company Name</label>
                                    <input type="text" className="form-input" id="companyName" placeholder="Acme Corp" required value={businessData.company} onChange={e => setBusinessData({ ...businessData, company: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="gstin">GSTIN (optional)</label>
                                    <input type="text" className="form-input" id="gstin" placeholder="22AAAAA0000A1Z5" value={businessData.gstin} onChange={e => setBusinessData({ ...businessData, gstin: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="industry">Industry</label>
                                    <input type="text" className="form-input" id="industry" placeholder="e.g. Manufacturing" required value={businessData.industry} onChange={e => setBusinessData({ ...businessData, industry: e.target.value })} />
                                </div>
                                <button type="submit" className="btn-auth-primary">Create Account</button>
                            </form>
                        </div>
                    )}

                    {/* Step 3 — Success */}
                    {step === 3 && (
                        <div className="register-step register-success">
                            <div className="success-icon">🎉</div>
                            <h1 className="auth-heading">You're all set!</h1>
                            <p className="auth-subtext">Your account has been created successfully.</p>
                            <button className="btn-auth-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
