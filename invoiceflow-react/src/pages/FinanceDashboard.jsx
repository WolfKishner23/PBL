import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/dashboard.css';
import '../styles/finance.css';

const queueData = [
    { id: 'INV-2024-101', company: 'Tata Steel', amount: '₹4,85,000', days: '45', score: 82, debtor: 88, payment: 76, validity: 92, industry: 70, status: 'pending' },
    { id: 'INV-2024-102', company: 'Infosys Ltd', amount: '₹1,27,500', days: '30', score: 75, debtor: 72, payment: 80, validity: 85, industry: 65, status: 'pending' },
    { id: 'INV-2024-103', company: 'HDFC Bank', amount: '₹3,45,000', days: '60', score: 45, debtor: 40, payment: 55, validity: 60, industry: 30, status: 'pending' },
    { id: 'INV-2024-104', company: 'Wipro Ltd', amount: '₹2,10,000', days: '35', score: 68, debtor: 70, payment: 65, validity: 78, industry: 58, status: 'pending' },
    { id: 'INV-2024-105', company: 'Reliance Retail', amount: '₹6,30,000', days: '25', score: 91, debtor: 95, payment: 88, validity: 94, industry: 85, status: 'pending' },
];

function getScoreColor(score) {
    if (score > 70) return 'green';
    if (score >= 50) return 'amber';
    return 'red';
}

export default function FinanceDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [tab, setTab] = useState('all');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [queue, setQueue] = useState(queueData);

    const filtered = queue.filter(inv => {
        const matchTab = tab === 'all' || inv.status === tab;
        const matchSearch = inv.company.toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase());
        return matchTab && matchSearch;
    });

    function handleAction(id, action) {
        setQueue(prev => prev.map(inv => inv.id === id ? { ...inv, status: action } : inv));
        setSelected(null);
    }

    return (
        <>
            <Sidebar variant="finance" activeSection="finance" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="main">
                <header className="header-bar">
                    <div className="header-left">
                        <button className="mobile-sidebar-btn" onClick={() => setSidebarOpen(true)} aria-label="Toggle sidebar">
                            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        </button>
                        <div>
                            <h1 className="header-greeting">Finance Dashboard</h1>
                            <p className="header-date">Invoice Queue & Portfolio</p>
                        </div>
                    </div>
                </header>

                {/* Stats */}
                <section className="stat-cards">
                    {[
                        { label: 'Queue Size', value: queue.filter(i => i.status === 'pending').length, accent: 'blue' },
                        { label: 'Approved', value: queue.filter(i => i.status === 'approved').length, accent: 'green' },
                        { label: 'Rejected', value: queue.filter(i => i.status === 'rejected').length, accent: 'red' },
                        { label: 'Avg Score', value: Math.round(queue.reduce((a, b) => a + b.score, 0) / queue.length), accent: 'amber' },
                    ].map((s, i) => (
                        <div className="stat-card" data-accent={s.accent} key={i}>
                            <div className="stat-card-top"><span className="stat-card-label">{s.label}</span></div>
                            <div className="stat-card-value">{s.value}</div>
                        </div>
                    ))}
                </section>

                <div className="finance-layout">
                    {/* Invoice Queue */}
                    <section className="card table-card">
                        <div className="table-header">
                            <div className="table-header-left">
                                <h2 className="card-title">Invoice Queue</h2>
                                <div className="table-tabs">
                                    {['all', 'pending', 'approved', 'rejected'].map(t => (
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
                                        <th>Company</th>
                                        <th>Amount</th>
                                        <th>Days</th>
                                        <th>Risk Score</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(inv => (
                                        <tr key={inv.id} onClick={() => setSelected(inv)} style={{ cursor: 'pointer', background: selected?.id === inv.id ? 'rgba(59,130,246,.08)' : '' }}>
                                            <td className="td-id">{inv.id}</td>
                                            <td>{inv.company}</td>
                                            <td className="td-amount">{inv.amount}</td>
                                            <td>{inv.days}d</td>
                                            <td><span className={`badge risk-${getScoreColor(inv.score) === 'green' ? 'low' : getScoreColor(inv.score) === 'amber' ? 'medium' : 'high'}`}>{inv.score}</span></td>
                                            <td><span className={`badge ${inv.status === 'approved' ? 'status-approved' : inv.status === 'rejected' ? 'status-rejected' : 'status-review'}`}>{inv.status}</span></td>
                                            <td>
                                                {inv.status === 'pending' ? (
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <button className="btn-ghost-sm" style={{ color: 'var(--green)' }} onClick={e => { e.stopPropagation(); handleAction(inv.id, 'approved'); }}>✓</button>
                                                        <button className="btn-ghost-sm" style={{ color: 'var(--red)' }} onClick={e => { e.stopPropagation(); handleAction(inv.id, 'rejected'); }}>✕</button>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Detail Panel */}
                    {selected && (
                        <aside className="card detail-panel" style={{ padding: '24px' }}>
                            <h3 className="card-title" style={{ marginBottom: '16px' }}>{selected.id}</h3>
                            <p style={{ color: 'var(--gray-200)', marginBottom: '20px' }}>{selected.company}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <div><span style={{ color: 'var(--gray-400)', fontSize: '12px' }}>Amount</span><br /><span className="mono" style={{ color: 'var(--white)' }}>{selected.amount}</span></div>
                                <div><span style={{ color: 'var(--gray-400)', fontSize: '12px' }}>Risk Score</span><br /><span className={`mono ${getScoreColor(selected.score)}-text`} style={{ fontSize: '24px', fontWeight: 700 }}>{selected.score}</span></div>
                                <div><span style={{ color: 'var(--gray-400)', fontSize: '12px' }}>Days Outstanding</span><br /><span className="mono" style={{ color: 'var(--white)' }}>{selected.days}</span></div>
                                <div><span style={{ color: 'var(--gray-400)', fontSize: '12px' }}>Status</span><br /><span className={`badge ${selected.status === 'approved' ? 'status-approved' : selected.status === 'rejected' ? 'status-rejected' : 'status-review'}`}>{selected.status}</span></div>
                            </div>
                            <h4 style={{ color: 'var(--gray-200)', fontSize: '13px', marginBottom: '12px' }}>AI Breakdown</h4>
                            {[
                                { label: 'Debtor Credit', value: selected.debtor },
                                { label: 'Payment History', value: selected.payment },
                                { label: 'Invoice Validity', value: selected.validity },
                                { label: 'Industry Risk', value: selected.industry },
                            ].map((f, i) => (
                                <div key={i} style={{ marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ color: 'var(--gray-400)', fontSize: '12px' }}>{f.label}</span>
                                        <span className={`mono ${getScoreColor(f.value)}-text`} style={{ fontSize: '12px' }}>{f.value}</span>
                                    </div>
                                    <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px' }}>
                                        <div style={{ width: `${f.value}%`, height: '100%', background: `var(--${getScoreColor(f.value)})`, borderRadius: '2px', transition: 'width .6s ease' }}></div>
                                    </div>
                                </div>
                            ))}
                            {selected.status === 'pending' && (
                                <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                                    <button className="btn-primary" onClick={() => handleAction(selected.id, 'approved')}>Approve</button>
                                    <button className="btn-ghost-sm" style={{ color: 'var(--red)', padding: '8px 16px' }} onClick={() => handleAction(selected.id, 'rejected')}>Reject</button>
                                </div>
                            )}
                        </aside>
                    )}
                </div>
            </main>
        </>
    );
}
