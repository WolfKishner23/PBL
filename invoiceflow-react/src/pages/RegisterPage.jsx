import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function RegisterPage() {
    const [step, setStep] = useState(1);
    const [role, setRole] = useState('business');
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [businessData, setBusinessData] = useState({ company: '', gstin: '', industry: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const navigate = useNavigate();
    const { register } = useAuth();

    function validateEmail(val) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    }

    function validateGSTIN(val) {
        // Indian GSTIN format: 2-digit state code + 10-char PAN + 1 entity code + Z + 1 checksum
        return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/i.test(val);
    }

    function validateStep1() {
        const errors = {};
        // Name: only letters and spaces, min 2 chars
        if (!formData.name.trim()) {
            errors.name = 'Full name is required';
        } else if (formData.name.trim().length < 2) {
            errors.name = 'Name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s.'-]+$/.test(formData.name.trim())) {
            errors.name = 'Name can only contain letters, spaces, and hyphens';
        }

        // Email
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        // Password: min 8 chars, at least 1 uppercase, 1 number
        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        } else if (!/[A-Z]/.test(formData.password)) {
            errors.password = 'Password must contain at least 1 uppercase letter';
        } else if (!/[0-9]/.test(formData.password)) {
            errors.password = 'Password must contain at least 1 number';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    function validateStep2() {
        const errors = {};
        if (!businessData.company.trim()) {
            errors.company = 'Company name is required';
        } else if (businessData.company.trim().length < 2) {
            errors.company = 'Company name must be at least 2 characters';
        }

        // GSTIN: optional but must be valid format if provided
        if (businessData.gstin.trim() && !validateGSTIN(businessData.gstin.trim())) {
            errors.gstin = 'Invalid GSTIN format (e.g., 22AAAAA0000A1Z5)';
        }

        if (!businessData.industry.trim()) {
            errors.industry = 'Industry is required';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    function handleStep1(e) {
        e.preventDefault();
        setError('');
        if (!validateStep1()) return;
        setFieldErrors({});
        setStep(2);
    }

    async function handleStep2(e) {
        e.preventDefault();
        setError('');
        if (!validateStep2()) return;
        setLoading(true);

        try {
            await register({
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                role,
                company: businessData.company.trim(),
                gstNumber: businessData.gstin.trim().toUpperCase(),
                industry: businessData.industry.trim()
            });
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    function goToDashboard() {
        const roleRoutes = { business: '/dashboard', finance: '/finance', admin: '/admin' };
        navigate(roleRoutes[role] || '/dashboard');
    }

    // Real-time clearing of field errors
    function updateFormData(field, val) {
        setFormData(prev => ({ ...prev, [field]: val }));
        if (fieldErrors[field]) {
            setFieldErrors(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    }

    function updateBusinessData(field, val) {
        setBusinessData(prev => ({ ...prev, [field]: val }));
        if (fieldErrors[field]) {
            setFieldErrors(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    }

    // Password strength indicator
    function getPasswordStrength() {
        const p = formData.password;
        if (!p) return { level: 0, label: '', color: '' };
        let score = 0;
        if (p.length >= 8) score++;
        if (p.length >= 12) score++;
        if (/[A-Z]/.test(p)) score++;
        if (/[0-9]/.test(p)) score++;
        if (/[^A-Za-z0-9]/.test(p)) score++;
        if (score <= 2) return { level: score, label: 'Weak', color: '#EF4444' };
        if (score <= 3) return { level: score, label: 'Fair', color: '#F59E0B' };
        if (score <= 4) return { level: score, label: 'Good', color: '#3B82F6' };
        return { level: score, label: 'Strong', color: '#22C55E' };
    }

    const pwStrength = getPasswordStrength();

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

                    {error && (
                        <div style={{
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
                            color: '#EF4444', fontSize: '13px'
                        }}>
                            {error}
                        </div>
                    )}

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
                                    <input
                                        type="text"
                                        className={`form-input${fieldErrors.name ? ' input-error' : ''}`}
                                        id="regName"
                                        placeholder="Enter your name"
                                        required
                                        value={formData.name}
                                        onChange={e => updateFormData('name', e.target.value)}
                                    />
                                    {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="regEmail">Email address</label>
                                    <input
                                        type="email"
                                        className={`form-input${fieldErrors.email ? ' input-error' : ''}`}
                                        id="regEmail"
                                        placeholder="name@company.com"
                                        required
                                        value={formData.email}
                                        onChange={e => updateFormData('email', e.target.value)}
                                    />
                                    {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="regPassword">Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className={`form-input${fieldErrors.password ? ' input-error' : ''}`}
                                            id="regPassword"
                                            placeholder="Min 8 chars, 1 uppercase, 1 number"
                                            required
                                            minLength={8}
                                            value={formData.password}
                                            onChange={e => updateFormData('password', e.target.value)}
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
                                    {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
                                    {formData.password && !fieldErrors.password && (
                                        <div className="password-strength">
                                            <div className="strength-bars">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <div key={i} className="strength-bar" style={{
                                                        background: i <= pwStrength.level ? pwStrength.color : 'rgba(255,255,255,0.08)'
                                                    }}></div>
                                                ))}
                                            </div>
                                            <span className="strength-label" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                                        </div>
                                    )}
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
                                    <input
                                        type="text"
                                        className={`form-input${fieldErrors.company ? ' input-error' : ''}`}
                                        id="companyName"
                                        placeholder="Acme Corp"
                                        required
                                        value={businessData.company}
                                        onChange={e => updateBusinessData('company', e.target.value)}
                                    />
                                    {fieldErrors.company && <span className="field-error">{fieldErrors.company}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="gstin">GSTIN (optional)</label>
                                    <input
                                        type="text"
                                        className={`form-input${fieldErrors.gstin ? ' input-error' : ''}`}
                                        id="gstin"
                                        placeholder="22AAAAA0000A1Z5"
                                        maxLength={15}
                                        value={businessData.gstin}
                                        onChange={e => updateBusinessData('gstin', e.target.value.toUpperCase())}
                                    />
                                    {fieldErrors.gstin && <span className="field-error">{fieldErrors.gstin}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="industry">Industry</label>
                                    <input
                                        type="text"
                                        className={`form-input${fieldErrors.industry ? ' input-error' : ''}`}
                                        id="industry"
                                        placeholder="e.g. Manufacturing"
                                        required
                                        value={businessData.industry}
                                        onChange={e => updateBusinessData('industry', e.target.value)}
                                    />
                                    {fieldErrors.industry && <span className="field-error">{fieldErrors.industry}</span>}
                                </div>
                                <button type="submit" className="btn-auth-primary" disabled={loading}>
                                    {loading ? 'Creating Account…' : 'Create Account'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Step 3 — Success */}
                    {step === 3 && (
                        <div className="register-step register-success">
                            <div className="success-icon">🎉</div>
                            <h1 className="auth-heading">You're all set!</h1>
                            <p className="auth-subtext">Your account has been created successfully.</p>
                            <button className="btn-auth-primary" onClick={goToDashboard}>Go to Dashboard</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
