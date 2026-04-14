import React, { useState, useEffect, useRef, Fragment } from 'react';
import Sidebar from '../components/Sidebar';
import { invoiceAPI, factoringAPI, notificationAPI } from '../services/api';
import '../styles/dashboard.css';
import '../styles/finance.css';

function getScoreColor(score) {
    if (score > 70) return 'green';
    if (score >= 50) return 'amber';
    return 'red';
}

const RISK_RATES = { low: 2, medium: 4, high: 6 };
const getRateForRisk = (score) => {
    const color = getScoreColor(score);
    if (color === 'green') return { label: 'LOW', rate: 2 };
    if (color === 'amber') return { label: 'MEDIUM', rate: 4 };
    return { label: 'HIGH', rate: 6 };
};

export default function FinanceDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [tab, setTab] = useState('all');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [fundModal, setFundModal] = useState(null);
    const [fundAmount, setFundAmount] = useState('');
    const [fundRate, setFundRate] = useState('5.0');
    const [activeSection, setActiveSection] = useState('finance');
    const [glowSection, setGlowSection] = useState(null);
    const [fundingSummary, setFundingSummary] = useState(null);
    const [settleSummary, setSettleSummary] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifCleared, setNotifCleared] = useState(false);
    const notifRef = useRef(null);

    // Close notifications when clicking outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle sidebar section click — scroll + glow
    function handleSectionClick(section) {
        setActiveSection(section);
        const el = document.getElementById(`section-${section}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setGlowSection(section);
            setTimeout(() => setGlowSection(null), 1500);
        }
    }

    // Fetch data from API
    useEffect(() => {
        fetchInvoices();
        fetchNotifications();
    }, []);

    async function fetchNotifications() {
        try {
            const res = await notificationAPI.getAll();
            setNotifications(res.data.notifications || []);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    }

    async function fetchInvoices() {
        try {
            setLoading(true);
            const res = await invoiceAPI.getAll();
            const invoices = (res.data.invoices || []).map(inv => ({
                id: inv.invoiceNumber || `INV-${inv.id}`,
                dbId: inv.id,
                seller: inv.uploaderCompany || inv.uploaderName || 'Unknown',
                buyer: inv.debtorCompany || 'Unknown',
                amount: `₹${parseFloat(inv.amount).toLocaleString('en-IN')}`,
                rawAmount: parseFloat(inv.amount),
                days: inv.dueDate ? Math.max(0, Math.ceil((new Date(inv.dueDate) - new Date()) / (1000 * 60 * 60 * 24))) : 0,
                score: inv.riskScore || 0,
                debtor: inv.riskDetails?.debtorCredit || 0,
                payment: inv.riskDetails?.paymentHistory || 0,
                validity: inv.riskDetails?.invoiceValidity || 0,
                industry: inv.riskDetails?.industryRisk || 0,
                status: (inv.status === 'review' || inv.status === 'submitted') ? 'pending' : inv.status,
                rawStatus: inv.status,
            }));
            setQueue(invoices);
        } catch (err) {
            console.error('Failed to fetch invoices:', err);
        } finally {
            setLoading(false);
        }
    }

    const filtered = queue.filter(inv => {
        const matchTab = tab === 'all' || inv.status === tab || (tab === 'funded' && inv.status === 'paid') || (tab === 'funded' && inv.status === 'settled');
        const matchSearch = 
            (inv.seller && inv.seller.toLowerCase().includes(search.toLowerCase())) || 
            (inv.buyer && inv.buyer.toLowerCase().includes(search.toLowerCase())) || 
            (inv.id && inv.id.toLowerCase().includes(search.toLowerCase()));
        return matchTab && matchSearch;
    });

    // Stats
    const stats = {
        queueSize: queue.filter(i => i.status === 'pending' || i.status === 'confirmed').length,
        approved: queue.filter(i => i.status === 'approved').length,
        funded: queue.filter(i => ['funded', 'paid', 'closed', 'settled'].includes(i.status)).length,
        rejected: queue.filter(i => i.status === 'rejected').length,
    };

    async function handleApprove(inv) {
        setActionLoading(inv.id);
        try {
            await factoringAPI.approve(inv.dbId);
            setQueue(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'approved' } : i));
            if (selected?.id === inv.id) setSelected({ ...inv, status: 'approved' });
        } catch (err) {
            console.error('Approve failed:', err);
            alert('Failed to approve: ' + (err.response?.data?.error || err.message));
        } finally {
            setActionLoading(null);
        }
    }

    async function handleReject(inv) {
        const reason = prompt('Rejection reason (optional):') || 'Rejected by finance partner';
        setActionLoading(inv.id);
        try {
            await factoringAPI.reject(inv.dbId, reason);
            setQueue(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'rejected' } : i));
            if (selected?.id === inv.id) setSelected({ ...inv, status: 'rejected' });
        } catch (err) {
            console.error('Reject failed:', err);
            alert('Failed to reject: ' + (err.response?.data?.error || err.message));
        } finally {
            setActionLoading(null);
        }
    }

    function openFundModal(inv) {
        setFundModal(inv);
        setFundAmount(Math.round(inv.rawAmount * 0.85).toString());
    }

    async function handleFund() {
        if (!fundModal) return;
        setActionLoading(fundModal.id);
        try {
            await factoringAPI.fund(fundModal.dbId, {
                fundedAmount: parseFloat(fundAmount)
            });
            const rData = getRateForRisk(fundModal.score);
            const principal = parseFloat(fundAmount);
            const diffDays = Math.ceil((new Date(fundModal.due) - new Date()) / (1000 * 60 * 60 * 24)) || 1;
            const interest = principal * (rData.rate / 100) * (diffDays / 30);

            setFundingSummary({
                principal,
                seller: fundModal.seller,
                buyerPays: parseFloat(fundModal.rawAmount),
                profit: parseFloat(fundModal.rawAmount) - principal - interest,
                interest
            });

            setQueue(prev => prev.map(i => i.id === fundModal.id ? { ...i, status: 'funded' } : i));
            if (selected?.id === fundModal.id) setSelected({ ...fundModal, status: 'funded' });
            
            setFundModal(null);
        } catch (err) {
            console.error('Fund failed:', err);
            alert('Failed to fund: ' + (err.response?.data?.error || err.message));
        } finally {
            setActionLoading(null);
        }
    }

    async function handleSettle(inv) {
        setActionLoading(inv.id);
        try {
            const res = await factoringAPI.settle(inv.dbId);
            setSettleSummary(res.data.summary);
            setQueue(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'settled', rawStatus: 'settled' } : i));
            if (selected?.id === inv.id) setSelected({ ...selected, status: 'settled', rawStatus: 'settled' });
            fetchNotifications();
        } catch (err) {
            console.error('Settle failed:', err);
            alert('Failed to settle: ' + (err.response?.data?.error || err.message));
        } finally {
            setActionLoading(null);
        }
    }

    function getActionButtons(inv, isDetail = false) {
        const isLoading = actionLoading === inv.id;
        const btnClass = isDetail ? 'btn-detail' : 'btn-ghost-sm';

        if (inv.status === 'confirmed') {
            return (
                <div style={{ display: 'flex', gap: isDetail ? '8px' : '4px', flexDirection: isDetail ? 'column' : 'row' }}>
                    <button
                        className={isDetail ? 'btn-detail-approve' : 'btn-approve'}
                        disabled={isLoading}
                        onClick={e => { e.stopPropagation(); handleApprove(inv); }}
                        style={{ background: 'var(--green)', color: '#fff' }}
                    >
                        {isLoading ? '...' : '✓ Approve'}
                    </button>
                    <button
                        className={isDetail ? 'btn-detail-reject' : 'btn-reject'}
                        disabled={isLoading}
                        onClick={e => { e.stopPropagation(); handleReject(inv); }}
                    >
                        {isLoading ? '...' : '✕ Reject'}
                    </button>
                </div>
            );
        }

        if (inv.status === 'pending' || inv.rawStatus === 'submitted' || inv.rawStatus === 'review') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--gray-400)', fontStyle: 'italic' }}>Awaiting Buyer Confirmation</span>
                    <button className="btn-reject" disabled={true} style={{ opacity: 0.5, cursor: 'not-allowed', fontSize: '10px' }}>
                        Approval Locked
                    </button>
                </div>
            );
        }

        if (inv.status === 'approved') {
            return (
                <button
                    className={isDetail ? 'btn-detail-approve' : 'btn-fund'}
                    disabled={isLoading}
                    onClick={e => { e.stopPropagation(); openFundModal(inv); }}
                    style={!isDetail ? {
                        fontFamily: 'var(--font-head)', fontSize: '11px', fontWeight: 600,
                        color: '#fff', background: 'var(--blue)', border: '1px solid rgba(59,130,246,.3)',
                        padding: '5px 12px', borderRadius: '6px', cursor: 'pointer',
                        transition: 'all .2s var(--ease)',
                    } : {
                        background: 'var(--blue)',
                    }}
                >
                    💰 Fund
                </button>
            );
        }

        if (inv.status === 'funded' || inv.rawStatus === 'funded' || inv.rawStatus === 'pdf_processed') {
            return <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="badge status-funded">✓ Funded</span>
                <span style={{ fontSize: '10px', color: 'var(--gray-400)' }}>Awaiting Repayment</span>
            </div>;
        }

        if (inv.rawStatus === 'paid') {
            return (
                <button
                    className={isDetail ? 'btn-detail-approve' : 'btn-fund'}
                    disabled={isLoading}
                    onClick={e => { e.stopPropagation(); handleSettle(inv); }}
                    style={{ background: 'var(--green)', color: '#fff' }}
                >
                    {isLoading ? '...' : '🤝 Close Invoice'}
                </button>
            );
        }

        if (inv.status === 'settled' || inv.rawStatus === 'settled') {
            return <span className="badge status-approved" style={{ background: 'rgba(34,197,94,.1)', color: 'var(--green)' }}>✓ Settled</span>;
        }

        if (inv.status === 'rejected') {
            return <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>Rejected</span>;
        }

        return <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>—</span>;
    }

    return (
        <>
            <Sidebar variant="finance" activeSection={activeSection} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onSectionClick={handleSectionClick} />
            <main className="main">
                <header id="section-finance" className="header-bar" style={{ scrollMarginTop: '20px' }}>
                    <div className="header-left">
                        <button className="mobile-sidebar-btn" onClick={() => setSidebarOpen(true)} aria-label="Toggle sidebar">
                            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        </button>
                        <div>
                            <h1 className="header-greeting">Finance Dashboard</h1>
                            <p className="header-date">Invoice Queue & Portfolio</p>
                        </div>
                    </div>
                    <div className="header-right">
                        <div className="search-box">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" /><path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                            <input type="text" placeholder="Search queue…" value={search} onChange={e => { setSearch(e.target.value); setTab('all'); }} />
                        </div>
                        <div style={{ position: 'relative' }} ref={notifRef}>
                            <button className="icon-btn notification-btn" onClick={(e) => { e.stopPropagation(); setNotifOpen(!notifOpen); }} aria-label="Notifications">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2a5 5 0 00-5 5v3l-1.3 2.6a.5.5 0 00.45.7h11.7a.5.5 0 00.45-.7L15 10V7a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.5" /><path d="M8 15a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                {notifications.length > 0 && !notifCleared && <span className="notification-dot"></span>}
                            </button>
                            {notifOpen && (
                                <div className="notif-dropdown open">
                                    <div className="notif-header">
                                        <span className="notif-title">Notifications</span>
                                        <button className="notif-clear" onClick={async () => {
                                            await notificationAPI.clear();
                                            setNotifications([]);
                                            setNotifCleared(true);
                                        }}>Clear all</button>
                                    </div>
                                    {notifications.length > 0 && !notifCleared ? (
                                        <ul className="notif-list">
                                            {notifications.map((n, i) => (
                                                <li className="notif-item" key={i} onClick={async () => {
                                                    if (!n.isRead) {
                                                        await notificationAPI.markAsRead(n.id);
                                                        setNotifications(notifications.map(no => no.id === n.id ? { ...no, isRead: true } : no));
                                                    }
                                                }} style={{ opacity: n.isRead ? 0.6 : 1 }}>
                                                    <span className="notif-icon">{n.type === 'success' ? '✅' : '🔔'}</span>
                                                    <div className="notif-body">
                                                        <span className="notif-msg">{n.message}</span>
                                                        <span className="notif-time">{new Date(n.createdAt).toLocaleDateString()}</span>
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
                    </div>
                </header>

                {/* Stats */}
                <section className="stat-cards">
                    {[
                        { label: 'Queue Size', value: stats.queueSize, accent: 'blue' },
                        { label: 'Approved', value: stats.approved, accent: 'green' },
                        { label: 'Funded', value: stats.funded, accent: 'green' },
                        { label: 'Rejected', value: stats.rejected, accent: 'red' },
                    ].map((s, i) => (
                        <div className="stat-card" data-accent={s.accent} key={i}>
                            <div className="stat-card-top"><span className="stat-card-label">{s.label}</span></div>
                            <div className="stat-card-value">{s.value}</div>
                        </div>
                    ))}
                </section>

                <div id="section-queue" style={{ marginBottom: '28px', scrollMarginTop: '20px' }} className={glowSection === 'queue' ? 'section-glow' : ''}>
                    {/* Invoice Queue */}
                    <section className="card table-card">
                        <div className="table-header">
                            <div className="table-header-left">
                                <h2 className="card-title">Invoice Queue</h2>
                                <div className="table-tabs">
                                    {['all', 'pending', 'approved', 'funded', 'settled', 'rejected'].map(t => (
                                        <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
                                            {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="search-box" style={{ width: '200px' }}>
                                <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                        </div>
                        <div className="table-scroll">
                            <table className="invoice-table">
                                <thead>
                                    <tr>
                                        <th>Invoice ID</th>
                                        <th>Seller</th>
                                        <th>Buyer</th>
                                        <th>Amount</th>
                                        <th>Days</th>
                                        <th>Risk Score</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="8" style={{ textAlign: 'center', color: '#64748B', padding: '32px' }}>Loading invoices...</td></tr>
                                    ) : filtered.length === 0 ? (
                                        <tr><td colSpan="8" style={{ textAlign: 'center', color: '#64748B', padding: '32px' }}>No invoices found</td></tr>
                                    ) : filtered.map(inv => (
                                        <tr key={inv.id} onClick={() => setSelected(inv)} style={{ cursor: 'pointer', background: selected?.id === inv.id ? 'rgba(59,130,246,.08)' : '' }}>
                                            <td className="td-id">{inv.id}</td>
                                            <td style={{ fontWeight: 600 }}>{inv.seller}</td>
                                            <td style={{ color: '#94A3B8' }}>{inv.buyer}</td>
                                            <td className="td-amount">{inv.amount}</td>
                                            <td>{inv.days}d</td>
                                            <td><span className={`badge risk-${getScoreColor(inv.score) === 'green' ? 'low' : getScoreColor(inv.score) === 'amber' ? 'medium' : 'high'}`}>{inv.score}</span></td>
                                            <td><span className={`badge ${['approved', 'confirmed', 'funded', 'paid', 'settled'].includes(inv.status) ? 'status-approved' : inv.status === 'rejected' ? 'status-rejected' : 'status-review'}`}>{inv.status === 'confirmed' ? 'confirmed' : inv.status}</span></td>
                                            <td>{getActionButtons(inv)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* Detail Panel — full width below the table */}
                {selected && (
                    <section className="card" style={{ padding: '28px', marginBottom: '28px', animation: 'cardEnter .4s ease both' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <div>
                                <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--blue)' }}>{selected.id}</h3>
                                <p style={{ color: 'var(--white)', fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>Seller: {selected.seller}</p>
                                <p style={{ color: 'var(--gray-300)', fontSize: '14px', marginTop: '2px' }}>Buyer: {selected.buyer}</p>
                            </div>
                            <button onClick={() => setSelected(null)} style={{
                                background: 'rgba(255,255,255,.04)', border: '1px solid var(--border-dim)',
                                borderRadius: '8px', color: 'var(--gray-400)', width: '32px', height: '32px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                            }}>✕</button>
                        </div>

                        {/* Metrics row — 4 items in a row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
                            <div style={{ background: 'rgba(255,255,255,.025)', border: '1px solid var(--border-dim)', borderRadius: '10px', padding: '16px' }}>
                                <span style={{ color: 'var(--gray-400)', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.5px' }}>Amount</span><br />
                                <span className="mono" style={{ color: 'var(--white)', fontSize: '20px', fontWeight: 700 }}>{selected.amount}</span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,.025)', border: '1px solid var(--border-dim)', borderRadius: '10px', padding: '16px' }}>
                                <span style={{ color: 'var(--gray-400)', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.5px' }}>Risk Score</span><br />
                                <span className={`mono ${getScoreColor(selected.score)}-text`} style={{ fontSize: '28px', fontWeight: 700 }}>{selected.score}</span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,.025)', border: '1px solid var(--border-dim)', borderRadius: '10px', padding: '16px' }}>
                                <span style={{ color: 'var(--gray-400)', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.5px' }}>Days Outstanding</span><br />
                                <span className="mono" style={{ color: 'var(--white)', fontSize: '20px', fontWeight: 700 }}>{selected.days}</span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,.025)', border: '1px solid var(--border-dim)', borderRadius: '10px', padding: '16px' }}>
                                <span style={{ color: 'var(--gray-400)', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.5px' }}>Status</span><br />
                                <span className={`badge ${selected.status === 'approved' ? 'status-approved' : selected.status === 'rejected' ? 'status-rejected' : selected.status === 'funded' ? 'status-approved' : 'status-review'}`} style={{ marginTop: '6px', display: 'inline-block' }}>{selected.status}</span>
                            </div>
                        </div>

                        {/* AI Breakdown — horizontal layout */}
                        <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 400px' }}>
                                <h4 style={{ color: 'var(--gray-300)', fontSize: '13px', fontWeight: 600, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '.5px' }}>AI Breakdown</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    {[
                                        { label: 'Buyer Credit', value: selected.debtor },
                                        { label: 'Payment History', value: selected.payment },
                                        { label: 'Invoice Validity', value: selected.validity },
                                        { label: 'Industry Risk', value: selected.industry },
                                    ].map((f, i) => (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ color: 'var(--gray-400)', fontSize: '12px' }}>{f.label}</span>
                                                <span className={`mono ${getScoreColor(f.value)}-text`} style={{ fontSize: '12px', fontWeight: 700 }}>{f.value}</span>
                                            </div>
                                            <div style={{ height: '6px', background: 'rgba(255,255,255,.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{ width: `${f.value}%`, height: '100%', background: `var(--${getScoreColor(f.value)})`, borderRadius: '3px', transition: 'width .6s ease' }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '180px' }}>
                                {getActionButtons(selected, true)}
                            </div>
                        </div>
                    </section>
                )}

                {/* ═══ PORTFOLIO SECTION ═══ */}
                <section id="section-portfolio" style={{ marginBottom: '28px', scrollMarginTop: '20px' }} className={glowSection === 'portfolio' ? 'section-glow' : ''}>
                    <div className="card" style={{ padding: '28px' }}>
                        <h2 className="card-title" style={{ marginBottom: '20px' }}>📊 Portfolio Overview</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
                            <div style={{ background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.15)', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                                <div style={{ color: 'var(--gray-400)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>Total Invested</div>
                                <div className="mono" style={{ color: 'var(--blue)', fontSize: '22px', fontWeight: 700 }}>
                                    ₹{queue.filter(i => i.status === 'funded' || i.status === 'paid' || i.status === 'closed').reduce((a, b) => a + Math.round(b.rawAmount), 0).toLocaleString('en-IN')}
                                </div>
                            </div>
                            <div style={{ background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.15)', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                                <div style={{ color: 'var(--gray-400)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>Realized Profit</div>
                                <div className="mono" style={{ color: 'var(--green)', fontSize: '22px', fontWeight: 700 }}>
                                    ₹{queue.filter(i => i.status === 'paid' || i.status === 'closed').reduce((a, b) => a + Math.round(b.rawAmount * 0.05), 0).toLocaleString('en-IN')}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--gray-400)', marginTop: '4px' }}>Proof of Cash Received</div>
                            </div>
                            <div style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.15)', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                                <div style={{ color: 'var(--gray-400)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>Active Investments</div>
                                <div className="mono" style={{ color: 'var(--amber)', fontSize: '22px', fontWeight: 700 }}>{queue.filter(i => i.status === 'funded').length}</div>
                            </div>
                            <div style={{ background: 'rgba(139,92,246,.06)', border: '1px solid rgba(139,92,246,.15)', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                                <div style={{ color: 'var(--gray-400)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>Expected Returns</div>
                                <div className="mono" style={{ color: '#8B5CF6', fontSize: '22px', fontWeight: 700 }}>
                                    ₹{queue.filter(i => i.status === 'funded').reduce((a, b) => a + Math.round(b.rawAmount * 0.05), 0).toLocaleString('en-IN')}
                                </div>
                            </div>
                        </div>

                        {/* Funded invoices list */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
                            <div>
                                <h4 style={{ color: 'var(--gray-300)', fontSize: '13px', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '.5px' }}>Active Funding</h4>
                                {queue.filter(i => i.status === 'funded').length === 0 ? (
                                    <p style={{ color: 'var(--gray-400)', fontSize: '13px', padding: '20px 0', textAlign: 'center', background: 'rgba(255,255,255,.01)', borderRadius: '10px' }}>No active investments.</p>
                                ) : (
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                        {queue.filter(i => i.status === 'funded').map(inv => (
                                            <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(59,130,246,.03)', border: '1px solid rgba(59,130,246,.1)', borderRadius: '10px' }}>
                                                <div>
                                                    <div className="mono" style={{ color: 'var(--blue)', fontSize: '11px', fontWeight: 700 }}>{inv.id}</div>
                                                    <div style={{ color: 'var(--white)', fontSize: '13px', fontWeight: 500 }}>{inv.seller}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div className="mono" style={{ color: 'var(--white)', fontSize: '13px', fontWeight: 700 }}>{inv.amount}</div>
                                                    <div style={{ color: 'var(--amber)', fontSize: '10px' }}>Expected Profit: ₹{Math.round(inv.rawAmount * 0.05).toLocaleString('en-IN')}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <h4 style={{ color: 'var(--gray-300)', fontSize: '13px', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '.5px' }}>Settled Returns (Proof of Income)</h4>
                                {queue.filter(i => i.status === 'paid' || i.status === 'closed').length === 0 ? (
                                    <p style={{ color: 'var(--gray-400)', fontSize: '13px', padding: '20px 0', textAlign: 'center', background: 'rgba(255,255,255,.01)', borderRadius: '10px' }}>No repayments received yet.</p>
                                ) : (
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                        {queue.filter(i => i.status === 'paid' || i.status === 'closed').map(inv => (
                                            <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(34,197,94,.03)', border: '1px solid rgba(34,197,94,.1)', borderRadius: '10px' }}>
                                                <div>
                                                    <div className="mono" style={{ color: 'var(--blue)', fontSize: '11px', fontWeight: 700 }}>{inv.id}</div>
                                                    <div style={{ color: 'var(--white)', fontSize: '13px', fontWeight: 500 }}>{inv.buyer} (Paid)</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ color: 'var(--green)', fontSize: '13px', fontWeight: 700 }}>+₹{Math.round(inv.rawAmount * 0.05).toLocaleString('en-IN')}</div>
                                                    <div style={{ color: 'var(--gray-400)', fontSize: '10px' }}>Repayment Verified ✅</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ ANALYTICS SECTION ═══ */}
                <section id="section-analytics" style={{ marginBottom: '28px', scrollMarginTop: '20px' }} className={glowSection === 'analytics' ? 'section-glow' : ''}>
                    <div className="card" style={{ padding: '28px' }}>
                        <h2 className="card-title" style={{ marginBottom: '24px' }}>📈 Analytics</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            {/* Status Distribution */}
                            <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid var(--border-dim)', borderRadius: '12px', padding: '24px' }}>
                                <h4 style={{ color: 'var(--gray-300)', fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>Invoice Status Distribution</h4>
                                {[
                                    { label: 'Pending', count: queue.filter(i => i.status === 'pending').length, color: '#3B82F6', total: queue.length },
                                    { label: 'Approved', count: queue.filter(i => i.status === 'approved').length, color: '#F59E0B', total: queue.length },
                                    { label: 'Funded', count: queue.filter(i => i.status === 'funded').length, color: '#22C55E', total: queue.length },
                                    { label: 'Rejected', count: queue.filter(i => i.status === 'rejected').length, color: '#EF4444', total: queue.length },
                                ].map((s, i) => (
                                    <div key={i} style={{ marginBottom: '14px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ color: 'var(--gray-300)', fontSize: '13px' }}>{s.label}</span>
                                            <span className="mono" style={{ color: s.color, fontSize: '13px', fontWeight: 700 }}>{s.count}</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'rgba(255,255,255,.06)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: s.total ? `${(s.count / s.total) * 100}%` : '0%', height: '100%', background: s.color, borderRadius: '4px', transition: 'width .8s ease', minWidth: s.count > 0 ? '4px' : '0' }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Risk Score Distribution */}
                            <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid var(--border-dim)', borderRadius: '12px', padding: '24px' }}>
                                <h4 style={{ color: 'var(--gray-300)', fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>Risk Score Breakdown</h4>
                                {[
                                    { label: 'Low Risk (70+)', count: queue.filter(i => i.score > 70).length, color: '#22C55E', total: queue.length },
                                    { label: 'Medium Risk (50-70)', count: queue.filter(i => i.score >= 50 && i.score <= 70).length, color: '#F59E0B', total: queue.length },
                                    { label: 'High Risk (<50)', count: queue.filter(i => i.score < 50).length, color: '#EF4444', total: queue.length },
                                ].map((s, i) => (
                                    <div key={i} style={{ marginBottom: '14px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ color: 'var(--gray-300)', fontSize: '13px' }}>{s.label}</span>
                                            <span className="mono" style={{ color: s.color, fontSize: '13px', fontWeight: 700 }}>{s.count}</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'rgba(255,255,255,.06)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: s.total ? `${(s.count / s.total) * 100}%` : '0%', height: '100%', background: s.color, borderRadius: '4px', transition: 'width .8s ease', minWidth: s.count > 0 ? '4px' : '0' }}></div>
                                        </div>
                                    </div>
                                ))}

                                <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(59,130,246,.04)', borderRadius: '10px', border: '1px solid rgba(59,130,246,.1)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--gray-300)', fontSize: '13px' }}>Average Risk Score</span>
                                        <span className="mono" style={{ color: 'var(--blue)', fontSize: '20px', fontWeight: 700 }}>{stats.avgScore}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </main>

            {/* Fund Modal */}
            {fundModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }} onClick={() => setFundModal(null)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: '16px', padding: '32px', width: '420px', maxWidth: '90vw',
                        boxShadow: '0 20px 60px rgba(0,0,0,.5)'
                    }}>
                        <h2 style={{ color: 'var(--white)', fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                            💰 Fund Invoice
                        </h2>
                        <p style={{ color: 'var(--gray-400)', fontSize: '13px', marginBottom: '24px' }}>
                            {fundModal.id} — {fundModal.seller}
                        </p>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ color: 'var(--gray-300)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                                Invoice Amount
                            </label>
                            <div style={{ color: 'var(--white)', fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                                {fundModal.amount}
                            </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ color: 'var(--gray-300)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                                Funded Amount (₹)
                            </label>
                            <input
                                type="number"
                                value={fundAmount}
                                onChange={e => setFundAmount(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 14px', borderRadius: '8px',
                                    background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)',
                                    color: 'var(--white)', fontSize: '15px', fontFamily: 'var(--font-mono)',
                                    outline: 'none', boxSizing: 'border-box'
                                }}
                            />
                            <span style={{ color: 'var(--gray-400)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                                Default: 85% of invoice amount
                            </span>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: 'var(--gray-400)', fontSize: '12px' }}>Risk Label</span>
                                <span className={`badge risk-${getRateForRisk(fundModal.score).label.toLowerCase()}`}>{getRateForRisk(fundModal.score).label}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: 'var(--gray-400)', fontSize: '12px' }}>Interest Rate</span>
                                <span style={{ color: 'var(--white)', fontWeight: 600 }}>{getRateForRisk(fundModal.score).rate}% / month</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: 'var(--gray-400)', fontSize: '12px' }}>Advance Amount (85%)</span>
                                <span style={{ color: 'var(--white)', fontWeight: 600 }}>₹{parseFloat(fundAmount).toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: 'var(--gray-400)', fontSize: '12px' }}>Estimated Interest</span>
                                <span style={{ color: 'var(--amber)', fontWeight: 600 }}>
                                    ₹{Math.round(parseFloat(fundAmount) * (getRateForRisk(fundModal.score).rate / 100) * ((Math.ceil((new Date(fundModal.due) - new Date()) / (1000 * 60 * 60 * 24)) || 1) / 30)).toLocaleString('en-IN')}
                                </span>
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid var(--border-dim)', margin: '12px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--white)', fontSize: '13px', fontWeight: 600 }}>Estimated Total Repayment</span>
                                <span style={{ color: 'var(--white)', fontWeight: 700 }}>₹{(parseFloat(fundAmount) + Math.round(parseFloat(fundAmount) * (getRateForRisk(fundModal.score).rate / 100) * ((Math.ceil((new Date(fundModal.due) - new Date()) / (1000 * 60 * 60 * 24)) || 1) / 30))).toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={handleFund}
                                disabled={actionLoading === fundModal.id}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                                    background: 'var(--green)', color: '#fff', fontSize: '14px',
                                    fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-head)',
                                    transition: 'all .2s ease'
                                }}
                            >
                                {actionLoading === fundModal.id ? 'Processing...' : '✓ Confirm Fund'}
                            </button>
                            <button
                                onClick={() => setFundModal(null)}
                                style={{
                                    padding: '12px 20px', borderRadius: '10px',
                                    background: 'transparent', border: '1px solid var(--border)',
                                    color: 'var(--gray-300)', fontSize: '14px', cursor: 'pointer',
                                    fontFamily: 'var(--font-head)'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Funding Summary Modal */}
            {fundingSummary && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
                }}>
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--green)',
                        borderRadius: '20px', padding: '40px', width: '480px', maxWidth: '90vw',
                        textAlign: 'center', boxShadow: '0 0 40px rgba(34,197,94,.2)'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>💰</div>
                        <h2 style={{ color: 'var(--white)', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>
                            Funding Transferred Successfully
                        </h2>
                        
                        <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: '12px', padding: '24px', marginBottom: '24px', textAlign: 'left' }}>
                            <div style={{ marginBottom: '12px', color: 'var(--gray-300)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Seller Receives (Early):</span>
                                <span style={{ color: 'var(--white)', fontWeight: 600 }}>₹{fundingSummary.principal.toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ marginBottom: '12px', color: 'var(--gray-400)', fontSize: '13px', fontStyle: 'italic' }}>
                                ⮕ {fundingSummary.seller} gets working capital now.
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid var(--border-dim)', margin: '16px 0' }} />
                            <div style={{ marginBottom: '12px', color: 'var(--gray-300)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Buyer Pays (at Due Date):</span>
                                <span style={{ color: 'var(--white)', fontWeight: 600 }}>₹{fundingSummary.buyerPays.toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ color: 'var(--green)', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '18px', marginTop: '16px' }}>
                                <span>Your Expected Profit:</span>
                                <span>+₹{fundingSummary.profit.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setFundingSummary(null)}
                            style={{
                                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                                background: 'var(--green)', color: '#fff', fontSize: '16px',
                                fontWeight: 700, cursor: 'pointer'
                            }}
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}

            {/* Settle Summary Modal */}
            {settleSummary && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
                }}>
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--blue)',
                        borderRadius: '20px', padding: '40px', width: '480px', maxWidth: '90vw',
                        textAlign: 'center', boxShadow: '0 0 40px rgba(59,130,246,.2)'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🤝</div>
                        <h2 style={{ color: 'var(--white)', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>
                            Invoice Settled Successfully
                        </h2>
                        
                        <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: '12px', padding: '24px', marginBottom: '24px', textAlign: 'left' }}>
                            <div style={{ marginBottom: '12px', color: 'var(--gray-300)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Principal (Advance):</span>
                                <span style={{ color: 'var(--white)', fontWeight: 600 }}>₹{settleSummary.principal.toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ marginBottom: '12px', color: 'var(--gray-300)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Duration:</span>
                                <span style={{ color: 'var(--white)', fontWeight: 600 }}>{settleSummary.daysElapsed} Days</span>
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid var(--border-dim)', margin: '16px 0' }} />
                            <div style={{ marginBottom: '12px', color: 'var(--green)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Interest Earned (3%/mo):</span>
                                <span style={{ fontWeight: 700 }}>+₹{settleSummary.interest.toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ color: 'var(--gray-400)', display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '8px' }}>
                                <span>Seller Profit:</span>
                                <span>₹{settleSummary.profit.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setSettleSummary(null)}
                            style={{
                                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                                background: 'var(--blue)', color: '#fff', fontSize: '16px',
                                fontWeight: 700, cursor: 'pointer'
                            }}
                        >
                            Complete Settlement
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
