import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/dashboard.css';
import '../styles/upload.css';

export default function UploadPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [file, setFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [extracting, setExtracting] = useState(false);
    const [showRisk, setShowRisk] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const fileInputRef = useRef(null);

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

    function handleExtract() {
        setExtracting(true);
        setCurrentStep(2);
        setTimeout(() => {
            setExtracting(false);
            setCurrentStep(3);
            setShowRisk(true);
        }, 1800);
    }

    function handleSubmit() {
        setSubmitted(true);
        setCurrentStep(4);
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
    }

    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    const stepCompleted = (s) => currentStep > s;
    const stepActive = (s) => currentStep === s;
    const lineCompleted = (afterStep) => currentStep > afterStep;

    return (
        <>
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
                                        {extracting ? 'Extracting fields…' : showRisk ? 'Fields Extracted ✓' : 'Extract Fields with AI'}
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
                                        <p className="card-subtitle">Computed in 1.2 seconds</p>
                                    </div>
                                    <span className="badge risk-low" style={{ fontSize: '12px', padding: '4px 12px' }}>Low Risk</span>
                                </div>

                                {/* 2×2 metrics */}
                                <div className="risk-metrics">
                                    <div className="risk-metric-card green">
                                        <span className="metric-label">Overall Score</span>
                                        <span className="metric-value mono">78<span className="metric-suffix">/100</span></span>
                                    </div>
                                    <div className="risk-metric-card green">
                                        <span className="metric-label">Pay History</span>
                                        <span className="metric-value">Excellent <span className="metric-check">✓</span></span>
                                    </div>
                                    <div className="risk-metric-card green">
                                        <span className="metric-label">Debtor Credit</span>
                                        <span className="metric-value">A+ Rating <span className="metric-check">✓</span></span>
                                    </div>
                                    <div className="risk-metric-card amber">
                                        <span className="metric-label">Industry Risk</span>
                                        <span className="metric-value">Moderate <span className="metric-tilde">~</span></span>
                                    </div>
                                </div>

                                {/* Risk Meter */}
                                <div className="risk-meter-section">
                                    <div className="risk-meter-bar">
                                        <div className="risk-marker" style={{ left: '25%' }}></div>
                                    </div>
                                    <div className="risk-meter-labels">
                                        <span>LOW</span>
                                        <span>MEDIUM</span>
                                        <span>HIGH</span>
                                    </div>
                                </div>

                                {/* Recommendation */}
                                <div className="recommendation-box">
                                    <span className="recommendation-icon">✓</span>
                                    <div>
                                        <strong>Recommended for Funding</strong>
                                        <p>This invoice has a low risk profile. Finance partners will approve quickly.</p>
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

                        {/* Invoice Preview */}
                        <div className="card preview-card">
                            <div className="card-header">
                                <h2 className="card-title">Invoice Preview</h2>
                            </div>

                            {!file ? (
                                <div className="preview-placeholder">
                                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                        <rect x="6" y="4" width="28" height="32" rx="4" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 3" />
                                        <path d="M14 16h12M14 22h8M14 28h10" stroke="#334155" strokeWidth="1.3" strokeLinecap="round" />
                                    </svg>
                                    <p>Upload a file to see preview</p>
                                </div>
                            ) : (
                                <div className="preview-fields">
                                    {[
                                        { label: 'Invoice #', value: 'INV-2024-009' },
                                        { label: 'Amount', value: '₹3,50,000' },
                                        { label: 'Debtor', value: 'Tata Steel Ltd' },
                                        { label: 'Due Date', value: 'Mar 25, 2024' },
                                        { label: 'Terms', value: 'Net 60' },
                                    ].map((row, i) => (
                                        <div className="preview-row" key={i}>
                                            <span className="preview-label">{row.label}</span>
                                            <span className="preview-value">{row.value}</span>
                                        </div>
                                    ))}
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
                                    { name: 'Debtor credit history', pct: '40%', width: '80%' },
                                    { name: 'Payment track record', pct: '30%', width: '60%' },
                                    { name: 'Industry risk index', pct: '20%', width: '40%' },
                                    { name: 'Invoice authenticity', pct: '10%', width: '20%' },
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
