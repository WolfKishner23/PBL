import React, { useState, useEffect, useRef, Fragment } from 'react';
import Sidebar from '../components/Sidebar';
import WalletOverview from '../components/WalletOverview';
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

    useEffect(() => {
        function handleClickOutside(e) {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function handleSectionClick(section) {
        setActiveSection(section);
        const el = document.getElementById(`section-${section}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setGlowSection(section);
            setTimeout(() => setGlowSection(null), 1500);
        }
    }

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

    const stats = {
        queueSize: queue.filter(i => i.status === 'pending' || i.status === 'confirmed').length,
        approved: queue.filter(i => i.status === 'approved').length,
        funded: queue.filter(i => ['funded', 'paid', 'closed', 'settled'].includes(i.status)).length,
        rejected: queue.filter(i => i.status === 'rejected').length,
        avgScore: queue.length ? Math.round(queue.reduce((a, b) => a + b.score, 0) / queue.length) : 0
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
        setFundAmount(Math.round(inv.rawAmount * 1.0).toString());
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
        if (inv.status === 'confirmed') {
            return (
                <div style={{ display: 'flex', gap: isDetail ? '8px' : '4px', flexDirection: isDetail ? 'column' : 'row' }}>
                    <button className={isDetail ? 'btn-detail-approve' : 'btn-approve'} disabled={isLoading} onClick={e => { e.stopPropagation(); handleApprove(inv); }} style={{ background: 'var(--green)', color: '#fff' }}>
                        {isLoading ? '...' : '✓ Approve'}
                    </button>
                    <button className={isDetail ? 'btn-detail-reject' : 'btn-reject'} disabled={isLoading} onClick={e => { e.stopPropagation(); handleReject(inv); }}>
                        {isLoading ? '...' : '✕ Reject'}
                    </button>
                </div>
            );
        }
        if (inv.status === 'pending') {
            return <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span style={{ fontSize: '10px', color: 'var(--gray-400)', fontStyle: 'italic' }}>Awaiting Buyer Confirmation</span></div>;
        }
        if (inv.status === 'approved') {
            return <button className={isDetail ? 'btn-detail-approve' : 'btn-fund'} disabled={isLoading} onClick={e => { e.stopPropagation(); openFundModal(inv); }} style={{ background: 'var(--blue)', color: '#fff' }}>💰 Fund</button>;
        }
        if (['funded', 'paid'].includes(inv.status) && inv.rawStatus !== 'paid') {
            return <span className="badge status-funded">✓ Funded</span>;
        }
        if (inv.rawStatus === 'paid') {
            return <button className={isDetail ? 'btn-detail-approve' : 'btn-fund'} disabled={isLoading} onClick={e => { e.stopPropagation(); handleSettle(inv); }} style={{ background: 'var(--green)', color: '#fff' }}>{isLoading ? '...' : '🤝 Close Invoice'}</button>;
        }
        if (inv.status === 'settled') {
            return <span className="badge status-approved" style={{ background: 'rgba(34,197,94,.1)', color: 'var(--green)' }}>✓ Settled</span>;
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
                            <button className="icon-btn notification-btn" onClick={(e) => { e.stopPropagation(); setNotifOpen(!notifOpen); }}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2a5 5 0 00-5 5v3l-1.3 2.6a.5.5 0 00.45.7h11.7a.5.5 0 00.45-.7L15 10V7a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.5" /><path d="M8 15a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                {notifications.length > 0 && !notifCleared && <span className="notification-dot"></span>}
                            </button>
                            {notifOpen && (
                                <div className="notif-dropdown open">
                                    <div className="notif-header">
                                        <span className="notif-title">Notifications</span>
                                        <button className="notif-clear" onClick={async () => { await notificationAPI.clear(); setNotifications([]); setNotifCleared(true); }}>Clear all</button>
                                    </div>
                                    <ul className="notif-list">
                                        {notifications.map((n, i) => (
                                            <li className="notif-item" key={i} onClick={async () => { if (!n.isRead) { await notificationAPI.markAsRead(n.id); setNotifications(notifications.map(no => no.id === n.id ? { ...no, isRead: true } : no)); } }}>
                                                <span className="notif-icon">{n.type === 'success' ? '✅' : '🔔'}</span>
                                                <div className="notif-body"><span className="notif-msg">{n.message}</span><span className="notif-time">{new Date(n.createdAt).toLocaleDateString()}</span></div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="dashboard-content">
                    <WalletOverview />

                    <section id="section-stats" className="stat-cards">
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

                    <div id="section-queue" style={{ marginBottom: '28px' }}>
                        <section className="card table-card">
                            <div className="table-header">
                                <h2 className="card-title">Invoice Queue</h2>
                                <div className="table-tabs">
                                    {['all', 'pending', 'approved', 'funded', 'settled', 'rejected'].map(t => (
                                        <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t.toUpperCase()}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="table-scroll">
                                <table className="invoice-table">
                                    <thead><tr><th>ID</th><th>Seller</th><th>Buyer</th><th>Amount</th><th>Status</th><th>Score</th><th>Action</th></tr></thead>
                                    <tbody>
                                        {filtered.map(inv => (
                                            <tr key={inv.id} onClick={() => setSelected(inv)} style={{ background: selected?.id === inv.id ? 'rgba(59,130,246,.08)' : '' }}>
                                                <td className="mono">{inv.id}</td><td>{inv.seller}</td><td>{inv.buyer}</td><td className="mono">{inv.amount}</td><td>{inv.status}</td><td>{inv.score}</td><td>{getActionButtons(inv)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>

                    {selected && (
                        <section className="card" style={{ padding: '24px', marginBottom: '28px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <h3>{selected.id} — Details</h3>
                                <button onClick={() => setSelected(null)}>✕</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '16px' }}>
                                <div className="metric-box"><span>Amount</span><br/><strong>{selected.amount}</strong></div>
                                <div className="metric-box"><span>Score</span><br/><strong>{selected.score}</strong></div>
                                <div className="metric-box"><span>Days</span><br/><strong>{selected.days}</strong></div>
                                <div className="metric-box"><span>Status</span><br/><strong>{selected.status}</strong></div>
                            </div>
                            <div style={{ marginTop: '20px' }}>{getActionButtons(selected, true)}</div>
                        </section>
                    )}

                    <section id="section-portfolio" style={{ marginBottom: '28px' }}>
                        <div className="card" style={{ padding: '24px' }}>
                            <h2 className="card-title">Portfolio Overview</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                <div className="stat-card"><span>Total Invested</span><br/><strong>₹{queue.filter(i => ['funded', 'paid', 'settled'].includes(i.status)).reduce((a, b) => a + b.rawAmount, 0).toLocaleString()}</strong></div>
                                <div className="stat-card"><span>Realized Profit</span><br/><strong>₹{queue.filter(i => i.status === 'settled').reduce((a, b) => a + (b.rawAmount * 0.05), 0).toLocaleString()}</strong></div>
                                <div className="stat-card"><span>Active</span><br/><strong>{queue.filter(i => i.status === 'funded').length}</strong></div>
                                <div className="stat-card"><span>Avg Risk</span><br/><strong>{stats.avgScore}</strong></div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {fundModal && (
                <div className="modal-overlay" onClick={() => setFundModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>💰 Fund Invoice</h2>
                        <p>{fundModal.id} — {fundModal.amount}</p>
                        <input type="number" value={fundAmount} onChange={e => setFundAmount(e.target.value)} />
                        <button onClick={handleFund}>Transfer Funds</button>
                        <button onClick={() => setFundModal(null)}>Cancel</button>
                    </div>
                </div>
            )}

            {fundingSummary && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Success</h2>
                        <p>Principal: ₹{fundingSummary.principal.toLocaleString()}</p>
                        <button onClick={() => setFundingSummary(null)}>Close</button>
                    </div>
                </div>
            )}

            {settleSummary && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Settled</h2>
                        <p>Interest: ₹{settleSummary.interest.toLocaleString()}</p>
                        <button onClick={() => setSettleSummary(null)}>Close</button>
                    </div>
                </div>
            )}
        </>
    );
}
