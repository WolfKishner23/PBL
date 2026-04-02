import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { invoiceAPI, aiAPI, userAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import '../styles/dashboard.css';
import '../styles/upload.css';

export default function UploadPage() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [file, setFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [extracting, setExtracting] = useState(false);
    const [showRisk, setShowRisk] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [error, setError] = useState('');
    const [createdInvoice, setCreatedInvoice] = useState(null);
    const fileInputRef = useRef(null);

    // Companies list for debtor dropdown
    const [companies, setCompanies] = useState([]);
    const [loadingCompanies, setLoadingCompanies] = useState(true);

    // Fetch companies on mount
    useEffect(() => {
        async function fetchCompanies() {
            try {
                const res = await userAPI.getCompanies();
                setCompanies(res.data.companies || []);
            } catch (err) {
                console.error('Failed to fetch companies:', err);
            } finally {
                setLoadingCompanies(false);
            }
        }
        fetchCompanies();
    }, []);

    // Form fields
    const [formData, setFormData] = useState({
        amount: '',
        debtorId: '',
        debtorGST: '',
        dueDate: '',
        paymentTerms: 'Net 30',
        industry: '',
        description: ''
    });
    const [fieldErrors, setFieldErrors] = useState({});

    function validateGSTIN(val) {
        return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/i.test(val);
    }

    function validateForm() {
        const errors = {};
        const amt = parseFloat(formData.amount);
        if (!formData.amount || isNaN(amt) || amt <= 0) {
            errors.amount = 'Amount must be greater than ₹0';
        } else if (amt > 100000000) {
            errors.amount = 'Amount cannot exceed ₹10 Cr';
        }
        if (!formData.debtorId) {
            errors.debtorId = 'Please select a debtor company';
        }
        if (formData.debtorGST.trim() && !validateGSTIN(formData.debtorGST.trim())) {
            errors.debtorGST = 'Invalid GSTIN format (e.g., 27AATCS1286K1ZP)';
        }
        if (!formData.dueDate) {
            errors.dueDate = 'Due date is required';
        } else if (new Date(formData.dueDate) <= new Date()) {
            errors.dueDate = 'Due date must be in the future';
        }
        if (!formData.industry) {
            errors.industry = 'Please select an industry';
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    function updateField(field, val) {
        setFormData(prev => ({ ...prev, [field]: val }));
        if (fieldErrors[field]) {
            setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
        }
    }

    // Auto-fill debtor GST when selecting a company
    function handleDebtorChange(debtorId) {
        updateField('debtorId', debtorId);
        const company = companies.find(c => c.id === parseInt(debtorId));
        if (company && company.gstNumber) {
            updateField('debtorGST', company.gstNumber);
        }
    }

    const [extractionStatus, setExtractionStatus] = useState('');

    function handleFile(f) {
        if (!f) return;
        const validTypes = ['application/pdf', 'image/png', 'image/jpeg'];
        if (!validTypes.includes(f.type)) return;
        if (f.size > 10 * 1024 * 1024) return;
        setFile(f);
        setCurrentStep(1);
        extractFromFile(f);
    }

    async function extractFromFile(f) {
        setExtractionStatus('extracting');
        setFieldErrors({});
        try {
            const fd = new FormData();
            fd.append('pdf', f);
            const res = await aiAPI.extract(fd);
            const wrapper = res.data?.extractedData || res.data || {};
            const data = wrapper?.extracted || wrapper || {};
            const hasData = data.amount || data.dueDate || data.industry;
            if (hasData) {
                setFormData(prev => ({
                    ...prev,
                    amount: data.amount ? String(data.amount) : prev.amount,
                    dueDate: data.dueDate || prev.dueDate,
                    paymentTerms: data.paymentTerms || prev.paymentTerms,
                    industry: data.industry || prev.industry,
                    description: data.description || prev.description,
                }));
                setFieldErrors({});
                setExtractionStatus('done');
            } else {
                setExtractionStatus('failed');
            }
        } catch (err) {
            console.warn('AI extraction unavailable:', err.message);
            setExtractionStatus('failed');
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    }

    async function handleExtract() {
        if (!validateForm()) return;
        setExtracting(true);
        setError('');
        setCurrentStep(2);

        try {
            const res = await invoiceAPI.create({
                amount: parseFloat(formData.amount) || 350000,
                debtorId: parseInt(formData.debtorId),
                debtorGST: formData.debtorGST,
                dueDate: formData.dueDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                paymentTerms: formData.paymentTerms,
                industry: formData.industry,
                description: formData.description
            });

            const invoice = res.data.invoice;
            setCreatedInvoice(invoice);

            if (file) {
                const pdfData = new FormData();
                pdfData.append('pdf', file);
                await invoiceAPI.uploadPDF(invoice.id, pdfData);
            }

            setExtracting(false);
            setCurrentStep(3);
            setShowRisk(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create invoice');
            setExtracting(false);
            setCurrentStep(1);
        }
    }

    async function handleSubmit() {
        if (!createdInvoice) return;
        setSubmitted(true);
        setCurrentStep(4);
        setShowToast(true);
        setTimeout(() => {
            setShowToast(false);
            navigate('/dashboard');
        }, 3000);
    }

    function handleBack() {
        setShowRisk(false);
        setCurrentStep(1);
    }

    function handleReplace() {
        setFile(null);
        setShowRisk(false);
        setCurrentStep(1);
        setSubmitted(false);
        setCreatedInvoice(null);
    }

    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    const stepCompleted = (s) => currentStep > s;
    const stepActive = (s) => currentStep === s;
    const lineCompleted = (afterStep) => currentStep > afterStep;

    // Get selected debtor company name for display
    const selectedDebtor = companies.find(c => c.id === parseInt(formData.debtorId));

    return (
        <>
            {showToast && (
                <div className="toast-notification toast-success">
                    <div className="toast-icon">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="9" stroke="#22C55E" strokeWidth="2" />
                            <path d="M6 10l3 3 5-6" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="toast-content">
                        <span className="toast-title">Invoice Created Successfully!</span>
                        <span className="toast-message">Waiting for debtor confirmation. Redirecting…</span>
                    </div>
                    <button className="toast-close" onClick={() => setShowToast(false)}>✕</button>
                </div>
            )}
            <Sidebar variant="business" activeSection="upload" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="main">

                <header className="header-bar">
                    <div className="header-left">
                        <button className="mobile-sidebar-btn" onClick={() => setSidebarOpen(true)} aria-label="Toggle sidebar">
                            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        </button>
                        <div>
                            <h1 className="header-greeting">Upload Invoice</h1>
                            <p className="header-date">Create invoice against a debtor company</p>
                        </div>
                    </div>
                    <div className="header-right">
                        <Link to="/dashboard" className="btn-primary">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><rect x="9" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><rect x="2" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><rect x="9" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3" /></svg>
                            Dashboard
                        </Link>
                    </div>
                </header>

                {/* Step Progress */}
                <div className="step-progress" id="stepProgress">
                    <div className={`step-item${stepActive(1) ? ' active' : ''}${stepCompleted(1) ? ' completed' : ''}`}><div className="step-circle">{stepCompleted(1) ? '✓' : '1'}</div><span className="step-label">Invoice Details</span></div>
                    <div className={`step-line${lineCompleted(1) ? ' completed' : ''}`}></div>
                    <div className={`step-item${stepActive(2) ? ' active' : ''}${stepCompleted(2) ? ' completed' : ''}`}><div className="step-circle">{stepCompleted(2) ? '✓' : '2'}</div><span className="step-label">Creating</span></div>
                    <div className={`step-line${lineCompleted(2) ? ' completed' : ''}`}></div>
                    <div className={`step-item${stepActive(3) ? ' active' : ''}${stepCompleted(3) ? ' completed' : ''}`}><div className="step-circle">{stepCompleted(3) ? '✓' : '3'}</div><span className="step-label">Review</span></div>
                    <div className={`step-line${lineCompleted(3) ? ' completed' : ''}`}></div>
                    <div className={`step-item${stepActive(4) ? ' active' : ''}${stepCompleted(4) ? ' completed' : ''}`}><div className="step-circle">{stepCompleted(4) ? '✓' : '4'}</div><span className="step-label">Done</span></div>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '8px', padding: '10px 14px', margin: '0 0 16px',
                        color: '#EF4444', fontSize: '13px'
                    }}>
                        {error}
                    </div>
                )}

                <div className="upload-layout">
                    {/* LEFT COLUMN */}
                    <div className="upload-left">
                        {/* Upload Card */}
                        <div className="card upload-card">
                            <div className="card-header">
                                <div>
                                    <h2 className="card-title">Upload Invoice PDF</h2>
                                    <p className="card-subtitle">Optional — attach a PDF for records</p>
                                </div>
                            </div>

                            {!file ? (
                                <div
                                    className={`dropzone${dragOver ? ' drag-over' : ''}`}
                                    onClick={() => fileInputRef.current.click()}
                                    onDrop={handleDrop}
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                >
                                    <svg className="dropzone-icon" width="48" height="48" viewBox="0 0 48 48" fill="none">
                                        <path d="M24 32V14m0 0l-7 7m7-7l7 7" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M8 32v4a4 4 0 004 4h24a4 4 0 004-4v-4" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
                                        <circle cx="24" cy="24" r="22" stroke="#3B82F6" strokeWidth="1" opacity=".15" />
                                    </svg>
                                    <p className="dropzone-main">Drag & drop your invoice PDF here</p>
                                    <p className="dropzone-alt">or <span className="dropzone-link">click to browse</span></p>
                                    <p className="dropzone-hint">PDF, PNG, JPG — max 10MB (optional)</p>
                                    <input type="file" ref={fileInputRef} accept=".pdf,.png,.jpg,.jpeg" hidden onChange={e => { if (e.target.files.length > 0) handleFile(e.target.files[0]); }} />
                                </div>
                            ) : (
                                <div className="uploaded-state">
                                    <div className="uploaded-file">
                                        <div className="uploaded-icon">
                                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                                <rect x="4" y="2" width="20" height="24" rx="3" stroke="#22C55E" strokeWidth="1.5" />
                                                <path d="M10 10h8M10 14h5" stroke="#22C55E" strokeWidth="1.3" strokeLinecap="round" />
                                                <path d="M16 2v6h6" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <div className="uploaded-info">
                                            <span className="uploaded-name">✅ {file.name}</span>
                                            <span className="uploaded-size">{formatSize(file.size)}</span>
                                        </div>
                                        <button className="uploaded-replace" onClick={handleReplace}>Click to replace</button>
                                    </div>
                                    {extractionStatus === 'extracting' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', color: '#3B82F6', fontSize: '13px' }}>
                                            ⚡ AI is extracting invoice data…
                                        </div>
                                    )}
                                    {extractionStatus === 'done' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', color: '#22C55E', fontSize: '13px' }}>
                                            ✓ AI extracted fields — review & edit on the right
                                        </div>
                                    )}
                                </div>
                            )}

                            <button className="btn-primary upload-extract-btn" onClick={handleExtract} disabled={extracting || showRisk} style={{ marginTop: '16px' }}>
                                {extracting ? 'Creating invoice…' : showRisk ? 'Invoice Created ✓' : 'Create Invoice →'}
                            </button>
                        </div>

                        {/* Review Card — after creation */}
                        {showRisk && (
                            <div className="card risk-card">
                                <div className="card-header">
                                    <div>
                                        <h2 className="card-title">Invoice Created</h2>
                                        <p className="card-subtitle">Awaiting debtor confirmation</p>
                                    </div>
                                    <span className="badge status-review" style={{ fontSize: '12px', padding: '4px 12px' }}>
                                        Pending
                                    </span>
                                </div>

                                <div className="risk-metrics">
                                    <div className="risk-metric-card amber">
                                        <span className="metric-label">Advance (85%)</span>
                                        <span className="metric-value mono">₹{createdInvoice?.advanceAmount ? parseFloat(createdInvoice.advanceAmount).toLocaleString('en-IN') : '—'}</span>
                                    </div>
                                    <div className="risk-metric-card amber">
                                        <span className="metric-label">Discount Fee (2%)</span>
                                        <span className="metric-value mono">₹{createdInvoice?.discountFee ? parseFloat(createdInvoice.discountFee).toLocaleString('en-IN') : '—'}</span>
                                    </div>
                                </div>

                                <div className="recommendation-box">
                                    <span className="recommendation-icon">ℹ</span>
                                    <div>
                                        <strong>Waiting for Debtor Confirmation</strong>
                                        <p>The debtor company will need to confirm this invoice before a Finance Partner can fund it.</p>
                                    </div>
                                </div>

                                <div className="risk-actions">
                                    <button className="btn-outline-action" onClick={handleBack}>
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 7H3m0 0l4 4M3 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        Back
                                    </button>
                                    <button className="btn-primary" onClick={handleSubmit} disabled={submitted} style={submitted ? { background: 'var(--green)' } : {}}>
                                        {submitted ? '✓ Done!' : 'Go to Dashboard'}
                                        {!submitted && <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN — Form */}
                    <div className="upload-right">
                        <div className="card preview-card">
                            <div className="card-header">
                                <h2 className="card-title">{createdInvoice ? 'Invoice Created' : 'Invoice Details'}</h2>
                            </div>

                            {createdInvoice ? (
                                <div className="preview-fields">
                                    {[
                                        { label: 'Invoice #', value: createdInvoice.invoiceNumber },
                                        { label: 'Amount', value: `₹${parseFloat(createdInvoice.amount).toLocaleString('en-IN')}` },
                                        { label: 'Debtor', value: selectedDebtor?.company || createdInvoice.debtorCompany },
                                        { label: 'Due Date', value: new Date(createdInvoice.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) },
                                        { label: 'Terms', value: createdInvoice.paymentTerms || 'N/A' },
                                        { label: 'Status', value: 'PENDING' },
                                        { label: 'Advance (85%)', value: `₹${parseFloat(createdInvoice.advanceAmount).toLocaleString('en-IN')}` },
                                        { label: 'Discount Fee (2%)', value: `₹${parseFloat(createdInvoice.discountFee).toLocaleString('en-IN')}` },
                                    ].map((row, i) => (
                                        <div className="preview-row" key={i}>
                                            <span className="preview-label">{row.label}</span>
                                            <span className="preview-value">{row.value}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="preview-fields" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 4px' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" style={{ color: '#94A3B8', fontSize: '12px' }}>Amount (₹) *</label>
                                        <input type="number" className={`form-input${fieldErrors.amount ? ' input-error' : ''}`} placeholder="350000" value={formData.amount} onChange={e => updateField('amount', e.target.value)} style={{ background: '#0F172A', border: fieldErrors.amount ? '1px solid #EF4444' : '1px solid #1E293B', color: '#E2E8F0', padding: '8px 12px', borderRadius: '8px', fontSize: '14px' }} />
                                        {fieldErrors.amount && <span className="field-error">{fieldErrors.amount}</span>}
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" style={{ color: '#94A3B8', fontSize: '12px' }}>Debtor Company *</label>
                                        <select
                                            className={`form-input${fieldErrors.debtorId ? ' input-error' : ''}`}
                                            value={formData.debtorId}
                                            onChange={e => handleDebtorChange(e.target.value)}
                                            style={{ background: '#0F172A', border: fieldErrors.debtorId ? '1px solid #EF4444' : '1px solid #1E293B', color: '#E2E8F0', padding: '8px 12px', borderRadius: '8px', fontSize: '14px' }}
                                        >
                                            <option value="">{loadingCompanies ? 'Loading companies…' : 'Select Debtor Company'}</option>
                                            {companies.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.company || c.name} {c.gstNumber ? `(${c.gstNumber})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {fieldErrors.debtorId && <span className="field-error">{fieldErrors.debtorId}</span>}
                                    </div>

                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" style={{ color: '#94A3B8', fontSize: '12px' }}>Due Date *</label>
                                        <input type="date" className={`form-input${fieldErrors.dueDate ? ' input-error' : ''}`} value={formData.dueDate} onChange={e => updateField('dueDate', e.target.value)} style={{ background: '#0F172A', border: fieldErrors.dueDate ? '1px solid #EF4444' : '1px solid #1E293B', color: '#E2E8F0', padding: '8px 12px', borderRadius: '8px', fontSize: '14px' }} />
                                        {fieldErrors.dueDate && <span className="field-error">{fieldErrors.dueDate}</span>}
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" style={{ color: '#94A3B8', fontSize: '12px' }}>Payment Terms</label>
                                        <select className="form-input" value={formData.paymentTerms} onChange={e => updateField('paymentTerms', e.target.value)} style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#E2E8F0', padding: '8px 12px', borderRadius: '8px', fontSize: '14px' }}>
                                            <option value="Net 30">Net 30</option>
                                            <option value="Net 45">Net 45</option>
                                            <option value="Net 60">Net 60</option>
                                            <option value="Net 90">Net 90</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" style={{ color: '#94A3B8', fontSize: '12px' }}>Industry *</label>
                                        <select className={`form-input${fieldErrors.industry ? ' input-error' : ''}`} value={formData.industry} onChange={e => updateField('industry', e.target.value)} style={{ background: '#0F172A', border: fieldErrors.industry ? '1px solid #EF4444' : '1px solid #1E293B', color: '#E2E8F0', padding: '8px 12px', borderRadius: '8px', fontSize: '14px' }}>
                                            <option value="">Select Industry</option>
                                            <option value="manufacturing">Manufacturing</option>
                                            <option value="it">IT / Software</option>
                                            <option value="healthcare">Healthcare</option>
                                            <option value="pharma">Pharmaceuticals</option>
                                            <option value="finance">Finance / Banking</option>
                                            <option value="export">Export</option>
                                            <option value="construction">Construction</option>
                                            <option value="retail">Retail</option>
                                            <option value="agriculture">Agriculture</option>
                                            <option value="government">Government</option>
                                            <option value="other">Other</option>
                                        </select>
                                        {fieldErrors.industry && <span className="field-error">{fieldErrors.industry}</span>}
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" style={{ color: '#94A3B8', fontSize: '12px' }}>Description</label>
                                        <input type="text" className="form-input" placeholder="Steel supply invoice" value={formData.description} onChange={e => updateField('description', e.target.value)} style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#E2E8F0', padding: '8px 12px', borderRadius: '8px', fontSize: '14px' }} />
                                    </div>

                                    {/* Advance preview */}
                                    {formData.amount && parseFloat(formData.amount) > 0 && (
                                        <div style={{ background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.15)', borderRadius: '10px', padding: '14px', marginTop: '4px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                <span style={{ color: '#94A3B8', fontSize: '12px' }}>Advance Amount (85%)</span>
                                                <span className="mono" style={{ color: '#3B82F6', fontSize: '14px', fontWeight: 600 }}>₹{(parseFloat(formData.amount) * 0.85).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#94A3B8', fontSize: '12px' }}>Discount Fee (2%)</span>
                                                <span className="mono" style={{ color: '#F59E0B', fontSize: '14px', fontWeight: 600 }}>₹{(parseFloat(formData.amount) * 0.02).toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* How It Works */}
                        <div className="card scoring-card">
                            <div className="card-header">
                                <h2 className="card-title">How Circular Economy Works</h2>
                            </div>
                            <div className="scoring-factors">
                                {[
                                    { name: '1. You upload invoice against a debtor', pct: '', width: '100%' },
                                    { name: '2. Debtor confirms the invoice', pct: '', width: '80%' },
                                    { name: '3. AI calculates risk score', pct: '', width: '60%' },
                                    { name: '4. Finance Partner funds (85% advance)', pct: '', width: '40%' },
                                    { name: '5. Debtor pays → Settlement calculated', pct: '', width: '20%' },
                                ].map((f, i) => (
                                    <div className="factor" key={i}>
                                        <div className="factor-top">
                                            <span className="factor-name">{f.name}</span>
                                        </div>
                                        <div className="factor-bar">
                                            <div className="factor-fill" style={{ width: f.width }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
