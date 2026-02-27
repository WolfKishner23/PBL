import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { invoiceAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import '../styles/dashboard.css';

export default function Dashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifCleared, setNotifCleared] = useState(false);
    const [dateStr, setDateStr] = useState('');
    const [invoices, setInvoices] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const notifRef = useRef(null);
    const chartRef = useRef(null);
    const tooltipRef = useRef(null);

    const { user } = useAuth();
    const firstName = user ? user.name.split(' ')[0] : 'User';
    const h = new Date().getHours();
    const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

    // Fetch invoices from API
    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const res = await invoiceAPI.getAll();
                setInvoices(res.data.invoices || []);
            } catch (err) {
                console.error('Failed to fetch invoices:', err);
            } finally {
                setLoadingData(false);
            }
        };
        fetchInvoices();
    }, []);

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

    useEffect(() => {
        function handleClick(e) {
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
        }
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    /* ═══════════ Cash Flow Chart ═══════════ */
    useEffect(() => {
        const canvas = chartRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
        const inflow = [3.2, 4.1, 3.8, 5.5, 4.9, 6.3];
        const outflow = [2.8, 3.0, 3.5, 3.2, 3.8, 4.1];
        const maxVal = 8;
        const BLUE = '#3B82F6', GREY = '#475569', GRID = 'rgba(255,255,255,.04)', LABEL = '#64748B';

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
            const barW = Math.min(groupW * 0.28, 28);
            const gap = Math.min(barW * 0.2, 5);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            months.forEach((m, i) => {
                const x = padL + i * groupW + groupW / 2;
                const ih = (inflow[i] / maxVal) * chartH * progress;
                const ix = x - barW - gap / 2;
                const iy = padT + chartH - ih;
                roundedRect(ctx, ix, iy, barW, ih, 4);
                ctx.fillStyle = BLUE;
                ctx.fill();
                const oh = (outflow[i] / maxVal) * chartH * progress;
                const ox = x + gap / 2;
                const oy = padT + chartH - oh;
                roundedRect(ctx, ox, oy, barW, oh, 4);
                ctx.fillStyle = GREY;
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
                tooltip.innerHTML = `<strong>${months[idx]}</strong><br><span style="color:#3B82F6">Inflow:</span> ₹${inflow[idx]}L<br><span style="color:#94A3B8">Outflow:</span> ₹${outflow[idx]}L`;
                tooltip.style.opacity = '1';
                tooltip.style.left = (e.clientX + 14) + 'px';
                tooltip.style.top = (e.clientY - 10) + 'px';
            } else {
                tooltip.style.opacity = '0';
            }
        }
        function onMouseLeave() { tooltip.style.opacity = '0'; }

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
    }, []);

    // Helper functions
    const formatAmount = (amount) => {
        const num = parseFloat(amount);
        return '₹' + num.toLocaleString('en-IN');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    };

    const getRiskClass = (level) => {
        if (!level) return 'risk-medium';
        return `risk-${level}`;
    };

    const getStatusClass = (status) => {
        const map = { draft: 'status-review', submitted: 'status-review', review: 'status-review', approved: 'status-approved', funded: 'status-funded', rejected: 'status-rejected' };
        return map[status] || 'status-review';
    };

    const getStatusLabel = (status) => {
        const map = { draft: 'Draft', submitted: 'Submitted', review: 'Under Review', approved: 'Approved', funded: 'Funded', rejected: 'Rejected' };
        return map[status] || status;
    };

    // Stats
    const totalInvoices = invoices.length;
    const totalFunded = invoices.filter(i => i.status === 'funded').reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
    const avgRisk = invoices.filter(i => i.riskScore).reduce((sum, i, _, arr) => sum + i.riskScore / arr.length, 0);
    const pendingReview = invoices.filter(i => ['submitted', 'review'].includes(i.status)).length;

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = (inv.debtorCompany || '').toLowerCase().includes(search.toLowerCase()) || (inv.invoiceNumber || '').toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' || getStatusLabel(inv.status) === filter;
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
                            <input type="text" placeholder="Search invoices…" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div style={{ position: 'relative' }} ref={notifRef}>
                            <button className="icon-btn notification-btn" onClick={(e) => { e.stopPropagation(); setNotifOpen(!notifOpen); }} aria-label="Notifications">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2a5 5 0 00-5 5v3l-1.3 2.6a.5.5 0 00.45.7h11.7a.5.5 0 00.45-.7L15 10V7a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.5" /><path d="M8 15a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                {!notifCleared && <span className="notification-dot"></span>}
                            </button>
                            {notifOpen && (
                                <div className="notif-dropdown open">
                                    <div className="notif-header">
                                        <span className="notif-title">Notifications</span>
                                        <button className="notif-clear" onClick={() => setNotifCleared(true)}>Clear all</button>
                                    </div>
                                    {!notifCleared ? (
                                        <ul className="notif-list">
                                            {invoices.slice(0, 5).map((inv, i) => (
                                                <li className="notif-item" key={i}>
                                                    <span className="notif-icon">{inv.status === 'funded' ? '💸' : inv.status === 'approved' ? '✅' : inv.status === 'rejected' ? '❌' : '📄'}</span>
                                                    <div className="notif-body">
                                                        <span className="notif-msg"><strong>{inv.invoiceNumber}</strong> — {getStatusLabel(inv.status)}</span>
                                                        <span className="notif-time">{formatDate(inv.updatedAt)}</span>
                                                    </div>
                                                </li>
                                            ))}
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
                <section className="stat-cards">
                    {[
                        { label: 'Total Invoices', value: totalInvoices.toString(), change: `${invoices.filter(i => i.status === 'funded').length} funded`, accent: 'blue', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M7 6h6M7 9h4M7 12h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg> },
                        { label: 'Amount Funded', value: totalFunded > 100000 ? `₹${(totalFunded / 100000).toFixed(1)}L` : formatAmount(totalFunded), change: `${invoices.filter(i => i.status === 'funded').length} invoices`, accent: 'green', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2v16M6 6l4-4 4 4M5 18h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> },
                        { label: 'Avg. Risk Score', value: avgRisk ? Math.round(avgRisk).toString() : '—', change: avgRisk >= 70 ? 'Low Risk' : avgRisk >= 50 ? 'Medium' : avgRisk > 0 ? 'High Risk' : 'N/A', accent: 'amber', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.5L10 14.7 5.1 17.2l.9-5.5-4-3.9 5.5-.8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg> },
                        { label: 'Pending Review', value: pendingReview.toString(), change: pendingReview > 0 ? `${pendingReview} awaiting` : 'All clear', accent: 'purple', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" /><path d="M10 6v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> },
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

                {/* Charts & Activity */}
                <section className="two-col">
                    <div className="card chart-card">
                        <div className="card-header">
                            <div>
                                <h2 className="card-title">Cash Flow Overview</h2>
                                <p className="card-subtitle">Last 6 months</p>
                            </div>
                            <div className="chart-legend">
                                <span className="legend-item"><span className="legend-dot blue"></span>Inflow</span>
                                <span className="legend-item"><span className="legend-dot grey"></span>Outflow</span>
                            </div>
                        </div>
                        <div className="chart-wrapper">
                            <canvas ref={chartRef}></canvas>
                        </div>
                    </div>
                    <div className="card activity-card">
                        <div className="card-header"><h2 className="card-title">Recent Activity</h2></div>
                        <ul className="activity-list">
                            {invoices.slice(0, 5).map((inv, i) => (
                                <li className="activity-item" data-type={inv.status} key={i}>
                                    <div className={`activity-dot ${inv.status}`}>{inv.status === 'funded' ? '💸' : inv.status === 'approved' ? '✅' : inv.status === 'rejected' ? '❌' : '📄'}</div>
                                    <div className="activity-text">
                                        <span className="activity-desc"><strong>{inv.invoiceNumber}</strong> — {getStatusLabel(inv.status)} ({inv.debtorCompany})</span>
                                        <span className="activity-time">{formatDate(inv.createdAt)}</span>
                                    </div>
                                </li>
                            ))}
                            {invoices.length === 0 && !loadingData && (
                                <li className="activity-item"><div className="activity-text"><span className="activity-desc" style={{ color: '#64748B' }}>No invoices yet. Upload your first invoice!</span></div></li>
                            )}
                        </ul>
                    </div>
                </section>

                {/* Invoice Table */}
                <section className="card table-card">
                    <div className="table-header">
                        <div className="table-header-left">
                            <h2 className="card-title">Recent Invoices</h2>
                            <div className="table-tabs">
                                {['all', 'Under Review', 'Approved', 'Funded'].map(f => (
                                    <button key={f} className={`tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
                                        {f === 'all' ? 'All' : f === 'Under Review' ? 'In Review' : f}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Link to="/upload" className="btn-primary btn-sm">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                            New Invoice
                        </Link>
                    </div>
                    <div className="table-scroll">
                        <table className="invoice-table">
                            <thead>
                                <tr>
                                    <th>Invoice ID</th>
                                    <th>Company</th>
                                    <th>Amount</th>
                                    <th>Due Date</th>
                                    <th>Risk</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingData ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center', color: '#64748B', padding: '32px' }}>Loading invoices...</td></tr>
                                ) : filteredInvoices.length === 0 ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center', color: '#64748B', padding: '32px' }}>No invoices found</td></tr>
                                ) : filteredInvoices.map(inv => (
                                    <tr key={inv.id} data-status={inv.status}>
                                        <td className="td-id">{inv.invoiceNumber}</td>
                                        <td>{inv.debtorCompany}</td>
                                        <td className="td-amount">{formatAmount(inv.amount)}</td>
                                        <td>{formatDate(inv.dueDate)}</td>
                                        <td><span className={`badge ${getRiskClass(inv.riskLevel)}`}>{inv.riskLevel ? inv.riskLevel.charAt(0).toUpperCase() + inv.riskLevel.slice(1) : '—'}</span></td>
                                        <td><span className={`badge ${getStatusClass(inv.status)}`}>{getStatusLabel(inv.status)}</span></td>
                                        <td><button className="btn-ghost-sm">View</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </>
    );
}
