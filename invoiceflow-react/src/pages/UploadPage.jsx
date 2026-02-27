import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { invoiceAPI } from '../services/api';
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
    const [riskResult, setRiskResult] = useState(null);
    const fileInputRef = useRef(null);

    // Form fields
    const [formData, setFormData] = useState({
        amount: '',
        debtorCompany: '',
        debtorGST: '',
        dueDate: '',
        paymentTerms: 'Net 30',
        description: ''
    });

    function handleFile(f) {
        if (!f) return;
        const validTypes = ['application/pdf', 'image/png', 'image/jpeg'];
        if (!validTypes.includes(f.type)) return;
        if (f.size > 10 * 1024 * 1024) return;
        setFile(f);
        setCurrentStep(1);
    }

    function handleDrop(e) {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    }

    async function handleExtract() {
        setExtracting(true);
        setError('');
        setCurrentStep(2);

        try {
            // Step 1: Create invoice in backend
            const res = await invoiceAPI.create({
                amount: parseFloat(formData.amount) || 350000,
                debtorCompany: formData.debtorCompany || 'Unknown Company',
                debtorGST: formData.debtorGST,
                dueDate: formData.dueDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                paymentTerms: formData.paymentTerms,
                description: formData.description
            });

            const invoice = res.data.invoice;
            setCreatedInvoice(invoice);

            // Step 2: Upload PDF if file exists
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
        setError('');

        try {
            // Submit invoice → triggers AI risk scoring
            const res = await invoiceAPI.submit(createdInvoice.id);
            setRiskResult(res.data.riskResult);
            setSubmitted(true);
            setCurrentStep(4);
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
                navigate('/dashboard');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit invoice');
        }
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
        setRiskResult(null);
    }

    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    const stepCompleted = (s) => currentStep > s;
    const stepActive = (s) => currentStep === s;
    const lineCompleted = (afterStep) => currentStep > afterStep;

    // Risk display helpers
    const riskScore = riskResult?.riskScore || createdInvoice?.riskScore || null;
    const riskLevel = riskResult?.riskLevel || createdInvoice?.riskLevel || 'medium';
    const riskDetails = riskResult?.details || {};
    const recommendation = riskResult?.recommendation || 'Invoice is being reviewed.';
    const riskBadgeClass = riskLevel === 'low' ? 'risk-low' : riskLevel === 'high' ? 'risk-high' : 'risk-medium';

    return (
        <>
            {/* ─── SUCCESS TOAST NOTIFICATION ─── */}
            {showToast && (
                <div className="toast-notification toast-success">
                    <div className="toast-icon">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="9" stroke="#22C55E" strokeWidth="2" />
                            <path d="M6 10l3 3 5-6" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="toast-content">
                        <span className="toast-title">Invoice Submitted Successfully!</span>
                        <span className="toast-message">{riskResult?.riskLevel ? `Risk: ${riskLevel.toUpperCase()} (Score: ${riskScore}/100)` : 'Redirecting to dashboard…'}</span>
                    </div>
                    <button className="toast-close" onClick={() => setShowToast(false)}>✕</button>
                </div>
            )}
            <Sidebar variant="business" activeSection="upload" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="main">

                {/* ─── HEADER BAR ─── */}
                <header className="header-bar">
                    <div className="header-left">
                        <button className="mobile-sidebar-btn" onClick={() => setSidebarOpen(true)} aria-label="Toggle sidebar">
                            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        </button>
                        <div>
                            <h1 className="header-greeting">Upload Invoice</h1>
                            <p className="header-date">Upload and submit for early payment</p>
                        </div>
                    </div>
                    <div className="header-right">
                        <div className="search-box">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" /><path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                            <input type="text" placeholder="Search invoices…" />
                        </div>
                        <button className="icon-btn notification-btn" aria-label="Notifications">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2a5 5 0 00-5 5v3l-1.3 2.6a.5.5 0 00.45.7h11.7a.5.5 0 00.45-.7L15 10V7a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.5" /><path d="M8 15a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                            <span className="notification-dot"></span>
                        </button>
                        <Link to="/dashboard" className="btn-primary">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><rect x="9" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><rect x="2" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><rect x="9" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3" /></svg>
                            Dashboard
                        </Link>
                    </div>
                </header>

                {/* ─── STEP PROGRESS BAR ─── */}
                <div className="step-progress" id="stepProgress">
                    <div className={`step-item${stepActive(1) ? ' active' : ''}${stepCompleted(1) ? ' completed' : ''}`} data-step="1">
                        <div className="step-circle">{stepCompleted(1) ? '✓' : '1'}</div>
                        <span className="step-label">Upload PDF</span>
                    </div>
                    <div className={`step-line${lineCompleted(1) ? ' completed' : ''}`}></div>
                    <div className={`step-item${stepActive(2) ? ' active' : ''}${stepCompleted(2) ? ' completed' : ''}`} data-step="2">
                        <div className="step-circle">{stepCompleted(2) ? '✓' : '2'}</div>
                        <span className="step-label">Review Fields</span>
                    </div>
                    <div className={`step-line${lineCompleted(2) ? ' completed' : ''}`}></div>
                    <div className={`step-item${stepActive(3) ? ' active' : ''}${stepCompleted(3) ? ' completed' : ''}`} data-step="3">
                        <div className="step-circle">{stepCompleted(3) ? '✓' : '3'}</div>
                        <span className="step-label">AI Risk Score</span>
                    </div>
                    <div className={`step-line${lineCompleted(3) ? ' completed' : ''}`}></div>
                    <div className={`step-item${stepActive(4) ? ' active' : ''}${stepCompleted(4) ? ' completed' : ''}`} data-step="4">
                        <div className="step-circle">{stepCompleted(4) ? '✓' : '4'}</div>
                        <span className="step-label">Submit</span>
                    </div>
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

                {/* ─── CONTENT 2-COL ─── */}
                <div className="upload-layout">

                    {/* ═══ LEFT COLUMN ═══ */}
                    <div className="upload-left">

                        {/* STEP 1 — Upload Card */}
                        <div className="card upload-card">
                            <div className="card-header">
                                <div>
                                    <h2 className="card-title">Upload Invoice PDF</h2>
                                    <p className="card-subtitle">Our AI will automatically extract all invoice fields</p>
                                </div>
                            </div>

                            {/* Empty state — dropzone */}
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
                                    <p className="dropzone-hint">PDF, PNG, JPG — max 10MB</p>
                                    <input type="file" ref={fileInputRef} accept=".pdf,.png,.jpg,.jpeg" hidden onChange={e => { if (e.target.files.length > 0) handleFile(e.target.files[0]); }} />
                                </div>
                            ) : (
                                /* Uploaded state */
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
                                    <button className="btn-primary upload-extract-btn" onClick={handleExtract} disabled={extracting || showRisk}>
                                        {extracting ? 'Creating invoice…' : showRisk ? 'Invoice Created ✓' : 'Create Invoice & Extract'}
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* STEP 3 — AI Risk Score Card */}
                        {showRisk && (
                            <div className="card risk-card">
                                <div className="card-header">
                                    <div>
                                        <h2 className="card-title">AI Risk Assessment</h2>
                                        <p className="card-subtitle">{riskScore ? `Score: ${riskScore}/100` : 'Submit to get AI risk score'}</p>
                                    </div>
                                    <span className={`badge ${riskBadgeClass}`} style={{ fontSize: '12px', padding: '4px 12px' }}>
                                        {riskScore ? `${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk` : 'Pending'}
                                    </span>
                                </div>

                                {/* 2×2 metrics */}
                                <div className="risk-metrics">
                                    <div className={`risk-metric-card ${riskScore && riskScore >= 60 ? 'green' : 'amber'}`}>
                                        <span className="metric-label">Overall Score</span>
                                        <span className="metric-value mono">{riskScore || '—'}<span className="metric-suffix">/100</span></span>
                                    </div>
                                    <div className={`risk-metric-card ${riskDetails.paymentHistory >= 70 ? 'green' : 'amber'}`}>
                                        <span className="metric-label">Pay History</span>
                                        <span className="metric-value">{riskDetails.paymentHistory ? `${riskDetails.paymentHistory}` : '—'} <span className="metric-check">{riskDetails.paymentHistory >= 70 ? '✓' : '~'}</span></span>
                                    </div>
                                    <div className={`risk-metric-card ${riskDetails.debtorCredit >= 80 ? 'green' : 'amber'}`}>
                                        <span className="metric-label">Debtor Credit</span>
                                        <span className="metric-value">{riskDetails.debtorCredit ? `${riskDetails.debtorCredit}` : '—'} <span className="metric-check">{riskDetails.debtorCredit >= 80 ? '✓' : '~'}</span></span>
                                    </div>
                                    <div className={`risk-metric-card ${riskDetails.industryRisk >= 70 ? 'green' : 'amber'}`}>
                                        <span className="metric-label">Industry Risk</span>
                                        <span className="metric-value">{riskDetails.industryRisk ? `${riskDetails.industryRisk}` : '—'} <span className="metric-tilde">{riskDetails.industryRisk >= 70 ? '✓' : '~'}</span></span>
                                    </div>
                                </div>

                                {/* Risk Meter */}
                                <div className="risk-meter-section">
                                    <div className="risk-meter-bar">
                                        <div className="risk-marker" style={{ left: riskScore ? `${100 - riskScore}%` : '50%' }}></div>
                                    </div>
                                    <div className="risk-meter-labels">
                                        <span>LOW</span>
                                        <span>MEDIUM</span>
                                        <span>HIGH</span>
                                    </div>
                                </div>

                                {/* Recommendation */}
                                <div className="recommendation-box">
                                    <span className="recommendation-icon">{riskLevel === 'low' ? '✓' : riskLevel === 'high' ? '⚠' : 'ℹ'}</span>
                                    <div>
                                        <strong>{riskLevel === 'low' ? 'Recommended for Funding' : riskLevel === 'high' ? 'Manual Review Needed' : 'Moderate Risk'}</strong>
                                        <p>{recommendation}</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="risk-actions">
                                    <button className="btn-outline-action" onClick={handleBack}>
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 7H3m0 0l4 4M3 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        Back
                                    </button>
                                    <button className="btn-primary" onClick={handleSubmit} disabled={submitted} style={submitted ? { background: 'var(--green)' } : {}}>
                                        {submitted ? '✓ Submitted Successfully!' : 'Submit for Funding'}
                                        {!submitted && <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ═══ RIGHT COLUMN ═══ */}
                    <div className="upload-right">

                        {/* Invoice Preview / Form */}
                        <div className="card preview-card">
                            <div className="card-header">
                                <h2 className="card-title">{createdInvoice ? 'Invoice Created' : 'Invoice Details'}</h2>
                            </div>

                            {createdInvoice ? (
                                <div className="preview-fields">
                                    {[
                                        { label: 'Invoice #', value: createdInvoice.invoiceNumber },
                                        { label: 'Amount', value: `₹${parseFloat(createdInvoice.amount).toLocaleString('en-IN')}` },
                                        { label: 'Debtor', value: createdInvoice.debtorCompany },
                                        { label: 'Due Date', value: new Date(createdInvoice.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) },
                                        { label: 'Terms', value: createdInvoice.paymentTerms || 'N/A' },
                                        { label: 'Status', value: createdInvoice.status?.toUpperCase() || 'DRAFT' },
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
                                        <label className="form-label" style={{ color: '#94A3B8', fontSize: '12px' }}>Amount (₹)</label>
                                        <input type="number" className="form-input" placeholder="350000" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#E2E8F0', padding: '8px 12px', borderRadius: '8px', fontSize: '14px' }} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" style={{ color: '#94A3B8', fontSize: '12px' }}>Debtor Company</label>
                                        <input type="text" className="form-input" placeholder="Tata Steel Ltd" value={formData.debtorCompany} onChange={e => setFormData({ ...formData, debtorCompany: e.target.value })} style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#E2E8F0', padding: '8px 12px', borderRadius: '8px', fontSize: '14px' }} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" style={{ color: '#94A3B8', fontSize: '12px' }}>GST Number</label>
                                        <input type="text" className="form-input" placeholder="27AATCS1286K1ZP" value={formData.debtorGST} onChange={e => setFormData({ ...formData, debtorGST: e.target.value })} style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#E2E8F0', padding: '8px 12px', borderRadius: '8px', fontSize: '14px' }} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" style={{ color: '#94A3B8', fontSize: '12px' }}>Due Date</label>
                                        <input type="date" className="form-input" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#E2E8F0', padding: '8px 12px', borderRadius: '8px', fontSize: '14px' }} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" style={{ color: '#94A3B8', fontSize: '12px' }}>Payment Terms</label>
                                        <select className="form-input" value={formData.paymentTerms} onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })} style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#E2E8F0', padding: '8px 12px', borderRadius: '8px', fontSize: '14px' }}>
                                            <option value="Net 30">Net 30</option>
                                            <option value="Net 45">Net 45</option>
                                            <option value="Net 60">Net 60</option>
                                            <option value="Net 90">Net 90</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" style={{ color: '#94A3B8', fontSize: '12px' }}>Description</label>
                                        <input type="text" className="form-input" placeholder="Steel supply invoice" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#E2E8F0', padding: '8px 12px', borderRadius: '8px', fontSize: '14px' }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* How AI Scoring Works */}
                        <div className="card scoring-card">
                            <div className="card-header">
                                <h2 className="card-title">How AI Scoring Works</h2>
                            </div>
                            <div className="scoring-factors">
                                {[
                                    { name: 'Debtor credit history', pct: '35%', width: '70%' },
                                    { name: 'Payment track record', pct: '25%', width: '50%' },
                                    { name: 'Industry risk index', pct: '20%', width: '40%' },
                                    { name: 'Invoice validity', pct: '10%', width: '20%' },
                                    { name: 'Days to maturity', pct: '10%', width: '20%' },
                                ].map((f, i) => (
                                    <div className="factor" key={i}>
                                        <div className="factor-top">
                                            <span className="factor-name">{f.name}</span>
                                            <span className="factor-pct mono">{f.pct}</span>
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
