import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/dashboard.css';

const invoices = [
    { id: 'INV-2024-001', company: 'Tata Steel', amount: '₹4,85,000', due: 'Mar 15', risk: 'Low', riskClass: 'risk-low', status: 'Funded', statusClass: 'status-funded' },
    { id: 'INV-2024-002', company: 'Infosys Ltd', amount: '₹1,27,500', due: 'Feb 28', risk: 'Low', riskClass: 'risk-low', status: 'Approved', statusClass: 'status-approved' },
    { id: 'INV-2024-003', company: 'Wipro Ltd', amount: '₹2,10,000', due: 'Mar 05', risk: 'Medium', riskClass: 'risk-medium', status: 'Under Review', statusClass: 'status-review' },
    { id: 'INV-2024-004', company: 'Reliance Retail', amount: '₹6,30,000', due: 'Apr 01', risk: 'Low', riskClass: 'risk-low', status: 'Under Review', statusClass: 'status-review' },
    { id: 'INV-2024-005', company: 'HDFC Bank', amount: '₹3,45,000', due: 'Mar 22', risk: 'High', riskClass: 'risk-high', status: 'Rejected', statusClass: 'status-rejected' },
    { id: 'INV-2024-006', company: 'Bajaj Finance', amount: '₹1,80,000', due: 'Mar 10', risk: 'Medium', riskClass: 'risk-medium', status: 'Funded', statusClass: 'status-funded' },
];

const notifications = [
    { icon: '✅', msg: <><strong>INV-2024-001</strong> approved by FinancePro</>, time: '5 hours ago' },
    { icon: '💸', msg: <><strong>INV-2024-002</strong> funded — ₹1,27,500 credited</>, time: '2 hours ago' },
    { icon: '❌', msg: <><strong>INV-2024-006</strong> rejected — high risk score</>, time: '1 day ago' },
    { icon: '✅', msg: <><strong>INV-2024-003</strong> approved by CapitalFund</>, time: '2 days ago' },
    { icon: '❌', msg: <><strong>INV-2024-005</strong> rejected — debtor low credit</>, time: '3 days ago' },
];

export default function Dashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifCleared, setNotifCleared] = useState(false);
    const [dateStr, setDateStr] = useState('');
    const notifRef = useRef(null);
    const chartRef = useRef(null);
    const tooltipRef = useRef(null);

    const userName = localStorage.getItem('invoiceflow_user') || 'Arjun';
    const firstName = userName.split(' ')[0];
    const h = new Date().getHours();
    const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

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

            // Grid lines + Y labels
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

            // Bars
            const groupW = chartW / months.length;
            const barW = Math.min(groupW * 0.28, 28);
            const gap = Math.min(barW * 0.2, 5);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            months.forEach((m, i) => {
                const x = padL + i * groupW + groupW / 2;
                // Inflow bar
                const ih = (inflow[i] / maxVal) * chartH * progress;
                const ix = x - barW - gap / 2;
                const iy = padT + chartH - ih;
                roundedRect(ctx, ix, iy, barW, ih, 4);
                ctx.fillStyle = BLUE;
                ctx.fill();
                // Outflow bar
                const oh = (outflow[i] / maxVal) * chartH * progress;
                const ox = x + gap / 2;
                const oy = padT + chartH - oh;
                roundedRect(ctx, ox, oy, barW, oh, 4);
                ctx.fillStyle = GREY;
                ctx.fill();
                // Month label
                ctx.fillStyle = LABEL;
                ctx.font = '11px Sora, sans-serif';
                ctx.fillText(m, x, padT + chartH + 12);
            });
        }

        resize();

        // Animate
        let animStart = null;
        const animDuration = 900;
        function animate(ts) {
            if (!animStart) animStart = ts;
            const elapsed = ts - animStart;
            let t = Math.min(elapsed / animDuration, 1);
            t = 1 - Math.pow(1 - t, 3); // ease-out cubic
            drawChart(t);
            if (t < 1) requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);

        // Resize observer
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

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.company.toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase());
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
                                            {notifications.map((n, i) => (
                                                <li className="notif-item" key={i}>
                                                    <span className="notif-icon">{n.icon}</span>
                                                    <div className="notif-body">
                                                        <span className="notif-msg">{n.msg}</span>
                                                        <span className="notif-time">{n.time}</span>
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
                        { label: 'Total Invoices', value: '24', change: '↑ 12%', accent: 'blue', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M7 6h6M7 9h4M7 12h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg> },
                        { label: 'Amount Funded', value: '₹18.2L', change: '↑ ₹3.1L', accent: 'green', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2v16M6 6l4-4 4 4M5 18h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> },
                        { label: 'Avg. Risk Score', value: '72', change: 'Low Risk', accent: 'amber', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.5L10 14.7 5.1 17.2l.9-5.5-4-3.9 5.5-.8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg> },
                        { label: 'Pending Review', value: '6', change: '2 urgent', accent: 'purple', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" /><path d="M10 6v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> },
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
                            {[
                                { type: 'funded', emoji: '💸', desc: <><strong>INV-2024-002</strong> funded — <strong>₹1,27,500</strong></>, time: '2 hrs ago' },
                                { type: 'approved', emoji: '✅', desc: <><strong>INV-2024-001</strong> approved by FinancePro</>, time: '5 hrs ago' },
                                { type: 'ai', emoji: '🤖', desc: <>AI risk scored <strong>INV-2024-003</strong></>, time: '1 day ago' },
                                { type: 'submitted', emoji: '📄', desc: <><strong>INV-2024-004</strong> submitted</>, time: '2 days ago' },
                                { type: 'rejected', emoji: '❌', desc: <><strong>INV-2024-006</strong> rejected</>, time: '3 days ago' },
                            ].map((a, i) => (
                                <li className="activity-item" data-type={a.type} key={i}>
                                    <div className={`activity-dot ${a.type}`}>{a.emoji}</div>
                                    <div className="activity-text">
                                        <span className="activity-desc">{a.desc}</span>
                                        <span className="activity-time">{a.time}</span>
                                    </div>
                                </li>
                            ))}
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
                                {filteredInvoices.map(inv => (
                                    <tr key={inv.id} data-status={inv.status}>
                                        <td className="td-id">{inv.id}</td>
                                        <td>{inv.company}</td>
                                        <td className="td-amount">{inv.amount}</td>
                                        <td>{inv.due}</td>
                                        <td><span className={`badge ${inv.riskClass}`}>{inv.risk}</span></td>
                                        <td><span className={`badge ${inv.statusClass}`}>{inv.status}</span></td>
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
