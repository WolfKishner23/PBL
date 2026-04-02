import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { invoiceAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import '../styles/dashboard.css';

export default function Dashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('creditor');
    const [filter, setFilter] = useState('all');
    const [dateStr, setDateStr] = useState('');
    const [creditorInvoices, setCreditorInvoices] = useState([]);
    const [debtorInvoices, setDebtorInvoices] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [glowInvoiceId, setGlowInvoiceId] = useState(null);

    // Notifications
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifCleared, setNotifCleared] = useState(false);
    const notifRef = useRef(null);

    // Cash Flow Chart
    const chartRef = useRef(null);
    const tooltipRef = useRef(null);

    const { user } = useAuth();
    const firstName = user ? user.name.split(' ')[0] : 'User';
    const h = new Date().getHours();
    const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

    // Fetch invoices
    useEffect(() => {
        fetchInvoices();
    }, []);

    async function fetchInvoices() {
        try {
            setLoadingData(true);
            const credRes = await invoiceAPI.getAll({ view: 'creditor' });
            setCreditorInvoices(credRes.data.invoices || []);
            const debtRes = await invoiceAPI.getAll({ view: 'debtor' });
            setDebtorInvoices(debtRes.data.invoices || []);
        } catch (err) {
            console.error('Failed to fetch invoices:', err);
        } finally {
            setLoadingData(false);
        }
    }

    useEffect(() => {
        function updateDate() {
            const now = new Date();
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const hr = now.getHours();
            const m = now.getMinutes().toString().padStart(2, '0');
            const ampm = hr >= 12 ? 'PM' : 'AM';
            const h12 = hr % 12 || 12;
            setDateStr(`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} · ${h12}:${m} ${ampm}`);
        }
        updateDate();
        const interval = setInterval(updateDate, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close notif on outside click
    useEffect(() => {
        function handleClick(e) {
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
        }
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    /* ═══════════ Cash Flow Chart ═══════════ */
    const allInvoices = [...creditorInvoices, ...debtorInvoices];
    // Deduplicate by id
    const uniqueInvoices = Array.from(new Map(allInvoices.map(i => [i.id, i])).values());

    useEffect(() => {
        const canvas = chartRef.current;
        if (!canvas || loadingData) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const now = new Date();
        const months = [];
        const inflow = [];
        const outflow = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(monthNames[d.getMonth()]);
            const monthInvoices = creditorInvoices.filter(inv => {
                const cd = new Date(inv.createdAt);
                return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
            });
            const fundedSum = monthInvoices.filter(inv => ['funded', 'paid', 'settled'].includes(inv.status)).reduce((s, inv) => s + parseFloat(inv.advanceAmount || inv.amount || 0), 0);
            inflow.push(parseFloat((fundedSum / 100000).toFixed(1)));

            // Outflow: invoices where I'm debtor and they're funded/paid
            const debtMonth = debtorInvoices.filter(inv => {
                const cd = new Date(inv.createdAt);
                return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
            });
            const debtSum = debtMonth.filter(inv => ['funded', 'paid', 'settled'].includes(inv.status)).reduce((s, inv) => s + parseFloat(inv.amount || 0), 0);
            outflow.push(parseFloat((debtSum / 100000).toFixed(1)));
        }
        const maxVal = Math.max(1, ...inflow, ...outflow) * 1.3;
        const BLUE = '#3B82F6', RED = '#EF4444', GRID = 'rgba(255,255,255,.04)', LABEL = '#64748B';

        function roundedRect(ctx, x, y, w, h, r) {
            if (h < 1) h = 1;
            r = Math.min(r, h / 2, w / 2);
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x, y + h);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        }

        function resize() {
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function drawChart(progress) {
            const W = canvas.width / dpr;
            const H = canvas.height / dpr;
            ctx.clearRect(0, 0, W, H);
            const padL = 44, padR = 16, padT = 12, padB = 36;
            const chartW = W - padL - padR;
            const chartH = H - padT - padB;

            const steps = 4;
            ctx.font = '11px JetBrains Mono, monospace';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            for (let i = 0; i <= steps; i++) {
                const val = (maxVal / steps) * i;
                const y = padT + chartH - (chartH * (val / maxVal));
                ctx.strokeStyle = GRID;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(padL, y);
                ctx.lineTo(W - padR, y);
                ctx.stroke();
                ctx.fillStyle = LABEL;
                ctx.fillText(val === 0 ? '₹0' : '₹' + val.toFixed(0) + 'L', padL - 8, y);
            }

            const groupW = chartW / months.length;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            months.forEach((m, i) => {
                const x = padL + i * groupW + groupW / 2;
                const barWidth = Math.min(groupW * 0.3, 24);
                const gap = 3;

                // Inflow bar (blue)
                const ih = (inflow[i] / maxVal) * chartH * progress;
                const ix = x - barWidth - gap / 2;
                const iy = padT + chartH - ih;
                roundedRect(ctx, ix, iy, barWidth, ih, 4);
                ctx.fillStyle = BLUE;
                ctx.fill();

                // Outflow bar (red)
                const oh = (outflow[i] / maxVal) * chartH * progress;
                const ox = x + gap / 2;
                const oy = padT + chartH - oh;
                roundedRect(ctx, ox, oy, barWidth, oh, 4);
                ctx.fillStyle = RED;
                ctx.fill();

                ctx.fillStyle = LABEL;
                ctx.font = '11px Sora, sans-serif';
                ctx.fillText(m, x, padT + chartH + 12);
            });
        }

        resize();
        let animStart = null;
        const animDuration = 900;
        function animate(ts) {
            if (!animStart) animStart = ts;
            const elapsed = ts - animStart;
            let t = Math.min(elapsed / animDuration, 1);
            t = 1 - Math.pow(1 - t, 3);
            drawChart(t);
            if (t < 1) requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);

        const ro = new ResizeObserver(() => { resize(); drawChart(1); });
        ro.observe(canvas.parentElement);

        // Tooltip
        let tooltip = tooltipRef.current;
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.style.cssText = 'position:fixed;pointer-events:none;z-index:999;background:#1E293B;border:1px solid rgba(59,130,246,.2);border-radius:8px;padding:8px 12px;font-size:12px;color:#E2E8F0;font-family:Sora,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.4);opacity:0;transition:opacity .15s;';
            document.body.appendChild(tooltip);
            tooltipRef.current = tooltip;
        }

        function onMouseMove(e) {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const W = rect.width;
            const padL = 44, padR = 16;
            const chartW = W - padL - padR;
            const groupW = chartW / months.length;
            const idx = Math.floor((mx - padL) / groupW);
            if (idx >= 0 && idx < months.length) {
                tooltip.innerHTML = `<strong>${months[idx]}</strong><br><span style="color:#3B82F6">Inflow:</span> ₹${inflow[idx]}L<br><span style="color:#EF4444">Outflow:</span> ₹${outflow[idx]}L`;
                tooltip.style.opacity = '1';
                tooltip.style.left = (e.clientX + 14) + 'px';
                tooltip.style.top = (e.clientY - 10) + 'px';
            } else {
                tooltip.style.opacity = '0';
            }
        }
        function onMouseLeave() { if (tooltip) tooltip.style.opacity = '0'; }
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mouseleave', onMouseLeave);

        return () => {
            ro.disconnect();
            canvas.removeEventListener('mousemove', onMouseMove);
            canvas.removeEventListener('mouseleave', onMouseLeave);
            if (tooltipRef.current) {
                tooltipRef.current.remove();
                tooltipRef.current = null;
            }
        };
    }, [creditorInvoices, debtorInvoices, loadingData]);

    // Helper functions
    const formatAmount = (amount) => '₹' + parseFloat(amount).toLocaleString('en-IN');
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    };

    const getStatusClass = (status) => {
        const map = {
            pending: 'status-review', debtor_confirmed: 'status-approved',
            disputed: 'status-rejected', funded: 'status-funded',
            paid: 'status-approved', settled: 'status-funded'
        };
        return map[status] || 'status-review';
    };

    const getStatusLabel = (status) => {
        const map = {
            pending: 'Pending', debtor_confirmed: 'Confirmed',
            disputed: 'Disputed', funded: 'Funded',
            paid: 'Paid', settled: 'Settled'
        };
        return map[status] || status;
    };

    const getRiskBadge = (label) => {
        if (!label) return 'risk-medium';
        const map = { LOW: 'risk-low', MEDIUM: 'risk-medium', HIGH: 'risk-high' };
        return map[label] || 'risk-medium';
    };

    // Debtor actions
    async function handleConfirm(invoiceId) {
        setActionLoading(invoiceId);
        try {
            await invoiceAPI.confirm(invoiceId);
            await fetchInvoices();
        } catch (err) {
            alert('Failed to confirm: ' + (err.response?.data?.error || err.message));
        } finally {
            setActionLoading(null);
        }
    }

    async function handleDispute(invoiceId) {
        const reason = prompt('Reason for dispute (optional):') || 'Disputed by debtor';
        setActionLoading(invoiceId);
        try {
            await invoiceAPI.dispute(invoiceId, reason);
            await fetchInvoices();
        } catch (err) {
            alert('Failed to dispute: ' + (err.response?.data?.error || err.message));
        } finally {
            setActionLoading(null);
        }
    }

    async function handleMarkPaid(invoiceId) {
        setActionLoading(invoiceId);
        try {
            await invoiceAPI.markPaid(invoiceId);
            await fetchInvoices();
        } catch (err) {
            alert('Failed to mark as paid: ' + (err.response?.data?.error || err.message));
        } finally {
            setActionLoading(null);
        }
    }

    // Search handler: scroll and glow
    function handleSearch(value) {
        setSearch(value);
        if (value.trim().length >= 2) {
            setTimeout(() => {
                const tableSection = document.getElementById('section-invoices');
                if (tableSection) tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                const match = currentInvoices.find(inv =>
                    (inv.invoiceNumber || '').toLowerCase().includes(value.toLowerCase()) ||
                    (inv.debtorCompanyName || inv.debtorCompany || inv.creditorCompany || '').toLowerCase().includes(value.toLowerCase())
                );
                if (match) {
                    setGlowInvoiceId(match.id);
                    setTimeout(() => setGlowInvoiceId(null), 2000);
                }
            }, 100);
        } else {
            setGlowInvoiceId(null);
        }
    }

    // Stats
    const totalInvoices = creditorInvoices.length;
    const totalFunded = creditorInvoices.filter(i => ['funded', 'paid', 'settled'].includes(i.status)).reduce((sum, i) => sum + parseFloat(i.advanceAmount || 0), 0);
    const pendingConfirmation = debtorInvoices.filter(i => i.status === 'pending').length;
    const activeInvoices = creditorInvoices.filter(i => ['pending', 'debtor_confirmed', 'funded'].includes(i.status)).length;

    // All notifications (from both creditor and debtor invoices)
    const notifInvoices = uniqueInvoices
        .filter(inv => inv.status !== 'pending')
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 8);

    // Filtered invoices for current tab
    const currentInvoices = activeTab === 'creditor' ? creditorInvoices : debtorInvoices;
    const filteredInvoices = currentInvoices.filter(inv => {
        const matchesSearch = (inv.debtorCompanyName || inv.debtorCompany || inv.creditorCompany || '').toLowerCase().includes(search.toLowerCase()) ||
            (inv.invoiceNumber || '').toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' || inv.status === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <>
            <Sidebar variant="business" activeSection="dashboard" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="main">
                {/* Header */}
                <header className="header-bar">
                    <div className="header-left">
                        <button className="mobile-sidebar-btn" onClick={() => setSidebarOpen(true)} aria-label="Toggle sidebar">
                            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        </button>
                        <div>
                            <h1 className="header-greeting">{greet}, {firstName} 👋</h1>
                            <p className="header-date">{dateStr}</p>
                        </div>
                    </div>
                    <div className="header-right">
                        <div className="search-box">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" /><path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                            <input type="text" placeholder="Search invoices…" value={search} onChange={e => handleSearch(e.target.value)} />
                        </div>
                        {/* ═══ NOTIFICATION BUTTON ═══ */}
                        <div style={{ position: 'relative' }} ref={notifRef}>
                            <button className="icon-btn notification-btn" onClick={(e) => { e.stopPropagation(); setNotifOpen(!notifOpen); }} aria-label="Notifications">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2a5 5 0 00-5 5v3l-1.3 2.6a.5.5 0 00.45.7h11.7a.5.5 0 00.45-.7L15 10V7a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.5" /><path d="M8 15a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                {!notifCleared && notifInvoices.length > 0 && <span className="notification-dot"></span>}
                            </button>
                            {notifOpen && (
                                <div className="notif-dropdown open">
                                    <div className="notif-header">
                                        <span className="notif-title">Notifications</span>
                                        <button className="notif-clear" onClick={() => setNotifCleared(true)}>Clear all</button>
                                    </div>
                                    {!notifCleared ? (
                                        <ul className="notif-list">
                                            {notifInvoices.length > 0 ? notifInvoices.map((inv, i) => (
                                                <li className="notif-item" key={i}>
                                                    <span className="notif-icon">{inv.status === 'funded' ? '💸' : inv.status === 'debtor_confirmed' ? '✅' : inv.status === 'disputed' ? '❌' : inv.status === 'paid' ? '💰' : inv.status === 'settled' ? '🏦' : '📄'}</span>
                                                    <div className="notif-body">
                                                        <span className="notif-msg"><strong>{inv.invoiceNumber}</strong> — {getStatusLabel(inv.status)}</span>
                                                        <span className="notif-time">{formatDate(inv.updatedAt)}</span>
                                                    </div>
                                                </li>
                                            )) : (
                                                <li className="notif-item"><div className="notif-body"><span className="notif-msg" style={{ color: '#64748B' }}>No activity yet</span></div></li>
                                            )}
                                        </ul>
                                    ) : (
                                        <div className="notif-empty" style={{ display: 'block' }}>
                                            <span>🔔</span>
                                            <p>No new notifications</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <Link to="/upload" className="btn-primary">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 11V3m0 0L5 6m3-3l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                            Upload Invoice
                        </Link>
                    </div>
                </header>

                {/* Stat Cards */}
                <section id="section-dashboard" className="stat-cards">
                    {[
                        { label: 'My Invoices', value: totalInvoices.toString(), change: `${activeInvoices} active`, accent: 'blue', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M7 6h6M7 9h4M7 12h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg> },
                        { label: 'Amount Funded', value: totalFunded > 100000 ? `₹${(totalFunded / 100000).toFixed(1)}L` : formatAmount(totalFunded), change: `${creditorInvoices.filter(i => i.status === 'funded').length} invoices`, accent: 'green', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2v16M6 6l4-4 4 4M5 18h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> },
                        { label: 'Awaiting My Confirm', value: pendingConfirmation.toString(), change: pendingConfirmation > 0 ? 'Action needed' : 'All clear', accent: 'amber', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" /><path d="M10 6v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> },
                        { label: 'Invoices Against Me', value: debtorInvoices.length.toString(), change: `${debtorInvoices.filter(i => i.status === 'funded').length} funded`, accent: 'purple', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.5L10 14.7 5.1 17.2l.9-5.5-4-3.9 5.5-.8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg> },
                    ].map((s, i) => (
                        <div className="stat-card" data-accent={s.accent} key={i}>
                            <div className="stat-card-top">
                                <span className="stat-card-label">{s.label}</span>
                                <div className={`stat-card-icon ${s.accent}`}>{s.icon}</div>
                            </div>
                            <div className="stat-card-value">{s.value}</div>
                            <div className="stat-card-change"><span className={`change-badge ${s.accent}`}>{s.change}</span></div>
                        </div>
                    ))}
                </section>

                {/* ═══ CASH FLOW CHART + RECENT ACTIVITY ═══ */}
                <section id="section-cashflow" className="two-col">
                    <div className="card chart-card">
                        <div className="card-header">
                            <div>
                                <h2 className="card-title">Cash Flow Overview</h2>
                                <p className="card-subtitle">Last 6 months</p>
                            </div>
                            <div className="chart-legend">
                                <span className="legend-item"><span className="legend-dot blue"></span>Inflow (Funded)</span>
                                <span className="legend-item"><span className="legend-dot red"></span>Outflow (Owed)</span>
                            </div>
                        </div>
                        <div className="chart-wrapper">
                            <canvas ref={chartRef}></canvas>
                        </div>
                    </div>
                    <div className="card activity-card">
                        <div className="card-header"><h2 className="card-title">Recent Activity</h2></div>
                        <ul className="activity-list">
                            {uniqueInvoices.slice(0, 5).map((inv, i) => (
                                <li className="activity-item" data-type={inv.status} key={i}>
                                    <div className={`activity-dot ${inv.status}`}>{inv.status === 'funded' ? '💸' : inv.status === 'debtor_confirmed' ? '✅' : inv.status === 'disputed' ? '❌' : inv.status === 'paid' ? '💰' : inv.status === 'settled' ? '🏦' : '📄'}</div>
                                    <div className="activity-text">
                                        <span className="activity-desc"><strong>{inv.invoiceNumber}</strong> — {getStatusLabel(inv.status)} ({inv.debtorCompanyName || inv.debtorCompany || inv.creditorCompany})</span>
                                        <span className="activity-time">{formatDate(inv.createdAt)}</span>
                                    </div>
                                </li>
                            ))}
                            {uniqueInvoices.length === 0 && !loadingData && (
                                <li className="activity-item"><div className="activity-text"><span className="activity-desc" style={{ color: '#64748B' }}>No invoices yet. Upload your first invoice!</span></div></li>
                            )}
                        </ul>
                    </div>
                </section>

                {/* ═══ INVOICE TABLE WITH TABS ═══ */}
                <section id="section-invoices" className="card table-card">
                    <div className="table-header">
                        <div className="table-header-left">
                            <div className="table-tabs">
                                <button className={`tab${activeTab === 'creditor' ? ' active' : ''}`} onClick={() => { setActiveTab('creditor'); setFilter('all'); }}>
                                    📤 My Invoices ({creditorInvoices.length})
                                </button>
                                <button className={`tab${activeTab === 'debtor' ? ' active' : ''}`} onClick={() => { setActiveTab('debtor'); setFilter('all'); }}>
                                    📥 Invoices Against Me ({debtorInvoices.length})
                                    {pendingConfirmation > 0 && <span style={{
                                        background: '#EF4444', color: '#fff', fontSize: '10px',
                                        padding: '2px 6px', borderRadius: '10px', marginLeft: '6px', fontWeight: 700
                                    }}>{pendingConfirmation}</span>}
                                </button>
                            </div>
                        </div>
                        <div className="table-tabs" style={{ marginLeft: 'auto' }}>
                            {['all', 'pending', 'debtor_confirmed', 'funded', 'paid', 'settled'].map(f => (
                                <button key={f} className={`tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)} style={{ fontSize: '11px', padding: '4px 10px' }}>
                                    {f === 'all' ? 'All' : getStatusLabel(f)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="table-scroll">
                        <table className="invoice-table">
                            <thead>
                                <tr>
                                    <th>Invoice ID</th>
                                    <th>{activeTab === 'creditor' ? 'Debtor' : 'Creditor'}</th>
                                    <th>Amount</th>
                                    <th>Due Date</th>
                                    <th>Advance</th>
                                    <th>Risk</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingData ? (
                                    <tr><td colSpan="8" style={{ textAlign: 'center', color: '#64748B', padding: '32px' }}>Loading invoices...</td></tr>
                                ) : filteredInvoices.length === 0 ? (
                                    <tr><td colSpan="8" style={{ textAlign: 'center', color: '#64748B', padding: '32px' }}>
                                        {activeTab === 'creditor' ? 'No invoices uploaded yet. Click Upload Invoice to get started!' : 'No invoices against you.'}
                                    </td></tr>
                                ) : filteredInvoices.map(inv => {
                                    const isGlowing = glowInvoiceId === inv.id;
                                    return (
                                    <tr key={inv.id} data-status={inv.status} id={`invoice-row-${inv.id}`}
                                        style={isGlowing ? {
                                            boxShadow: '0 0 0 2px rgba(59,130,246,.5), 0 0 20px rgba(59,130,246,.15)',
                                            background: 'rgba(59,130,246,.08)',
                                            transition: 'all .3s ease'
                                        } : {}}
                                    >
                                        <td className="td-id">{inv.invoiceNumber}</td>
                                        <td>{activeTab === 'creditor' ? (inv.debtorCompanyName || inv.debtorCompany) : (inv.creditorCompany || inv.creditorName)}</td>
                                        <td className="td-amount">{formatAmount(inv.amount)}</td>
                                        <td>{formatDate(inv.dueDate)}</td>
                                        <td className="td-amount" style={{ color: '#3B82F6' }}>
                                            {inv.advanceAmount ? formatAmount(inv.advanceAmount) : '—'}
                                        </td>
                                        <td>
                                            <span className={`badge ${getRiskBadge(inv.riskLabel)}`}>
                                                {inv.riskLabel || '—'}
                                                {inv.riskScore ? ` (${Math.round(inv.riskScore)})` : ''}
                                            </span>
                                        </td>
                                        <td><span className={`badge ${getStatusClass(inv.status)}`}>{getStatusLabel(inv.status)}</span></td>
                                        <td>
                                            {activeTab === 'debtor' && inv.status === 'pending' && (
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button className="btn-approve" disabled={actionLoading === inv.id} onClick={() => handleConfirm(inv.id)} style={{ fontSize: '11px', padding: '4px 10px' }}>
                                                        {actionLoading === inv.id ? '...' : '✓ Confirm'}
                                                    </button>
                                                    <button className="btn-reject" disabled={actionLoading === inv.id} onClick={() => handleDispute(inv.id)} style={{ fontSize: '11px', padding: '4px 10px' }}>
                                                        ✕ Dispute
                                                    </button>
                                                </div>
                                            )}
                                            {activeTab === 'debtor' && inv.status === 'funded' && (
                                                <button disabled={actionLoading === inv.id} onClick={() => handleMarkPaid(inv.id)} style={{ fontSize: '11px', padding: '5px 12px', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                                                    {actionLoading === inv.id ? '...' : '💰 Mark Paid'}
                                                </button>
                                            )}
                                            {activeTab === 'creditor' && (
                                                <button className="btn-ghost-sm">View</button>
                                            )}
                                            {activeTab === 'debtor' && !['pending', 'funded'].includes(inv.status) && (
                                                <span style={{ fontSize: '11px', color: '#64748B' }}>—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </>
    );
}
