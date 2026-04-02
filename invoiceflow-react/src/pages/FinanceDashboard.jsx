import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { invoiceAPI } from '../services/api';
import '../styles/dashboard.css';
import '../styles/finance.css';

export default function FinanceDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [tab, setTab] = useState('available');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [activeSection, setActiveSection] = useState('finance');
    const [glowSection, setGlowSection] = useState(null);

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
    }, []);

    async function fetchInvoices() {
        try {
            setLoading(true);
            const res = await invoiceAPI.getAll();
            setInvoices(res.data.invoices || []);
        } catch (err) {
            console.error('Failed to fetch invoices:', err);
        } finally {
            setLoading(false);
        }
    }

    // Split invoices
    const availableInvoices = invoices.filter(i => i.status === 'debtor_confirmed');
    const fundedInvoices = invoices.filter(i => ['funded', 'paid', 'settled'].includes(i.status));

    const filtered = (tab === 'available' ? availableInvoices : fundedInvoices).filter(inv => {
        const searchStr = `${inv.creditorCompany || ''} ${inv.debtorCompanyName || inv.debtorCompany || ''} ${inv.invoiceNumber || ''}`.toLowerCase();
        return searchStr.includes(search.toLowerCase());
    });

    // Stats
    const totalFunded = fundedInvoices.reduce((sum, i) => sum + parseFloat(i.advanceAmount || 0), 0);
    const totalProfit = fundedInvoices.reduce((sum, i) => sum + parseFloat(i.discountFee || 0), 0);
    const avgRisk = availableInvoices.length ? Math.round(availableInvoices.reduce((a, b) => a + (b.riskScore || 0), 0) / availableInvoices.length) : 0;

    async function handleFund(inv) {
        setActionLoading(inv.id);
        try {
            await invoiceAPI.fund(inv.id);
            await fetchInvoices();
            if (selected?.id === inv.id) setSelected(null);
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
            const res = await invoiceAPI.settle(inv.id);
            alert(`Settlement complete!\nFP Profit: ₹${res.data.settlement.financePartnerProfit.toLocaleString('en-IN')}`);
            await fetchInvoices();
        } catch (err) {
            console.error('Settle failed:', err);
            alert('Failed to settle: ' + (err.response?.data?.error || err.message));
        } finally {
            setActionLoading(null);
        }
    }

    function getRiskColor(score) {
        if (score <= 40) return 'green';
        if (score <= 70) return 'amber';
        return 'red';
    }

    function formatAmount(amount) {
        return '₹' + parseFloat(amount || 0).toLocaleString('en-IN');
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
                            <h1 className="header-greeting">Finance Partner Dashboard</h1>
                            <p className="header-date">Fund confirmed invoices & earn returns</p>
                        </div>
                    </div>
                </header>

                {/* Stats */}
                <section className="stat-cards">
                    {[
                        { label: 'Available to Fund', value: availableInvoices.length, accent: 'blue' },
                        { label: 'My Funded', value: fundedInvoices.length, accent: 'green' },
                        { label: 'Total Invested', value: totalFunded > 100000 ? `₹${(totalFunded / 100000).toFixed(1)}L` : formatAmount(totalFunded), accent: 'green' },
                        { label: 'Total Profit (2%)', value: totalProfit > 100000 ? `₹${(totalProfit / 100000).toFixed(1)}L` : formatAmount(totalProfit), accent: 'amber' },
                        { label: 'Avg Risk Score', value: avgRisk || '—', accent: 'purple' },
                    ].map((s, i) => (
                        <div className="stat-card" data-accent={s.accent} key={i}>
                            <div className="stat-card-top"><span className="stat-card-label">{s.label}</span></div>
                            <div className="stat-card-value">{s.value}</div>
                        </div>
                    ))}
                </section>

                {/* Invoice Queue */}
                <div id="section-queue" style={{ marginBottom: '28px', scrollMarginTop: '20px' }} className={glowSection === 'queue' ? 'section-glow' : ''}>
                    <section className="card table-card">
                        <div className="table-header">
                            <div className="table-header-left">
                                <h2 className="card-title">Invoice Queue</h2>
                                <div className="table-tabs">
                                    <button className={`tab${tab === 'available' ? ' active' : ''}`} onClick={() => setTab('available')}>
                                        🟢 Ready to Fund ({availableInvoices.length})
                                    </button>
                                    <button className={`tab${tab === 'funded' ? ' active' : ''}`} onClick={() => setTab('funded')}>
                                        💰 My Funded ({fundedInvoices.length})
                                    </button>
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
                                        <th>Creditor</th>
                                        <th>Debtor</th>
                                        <th>Amount</th>
                                        <th>Advance (85%)</th>
                                        <th>Fee (2%)</th>
                                        <th>Risk</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="9" style={{ textAlign: 'center', color: '#64748B', padding: '32px' }}>Loading invoices...</td></tr>
                                    ) : filtered.length === 0 ? (
                                        <tr><td colSpan="9" style={{ textAlign: 'center', color: '#64748B', padding: '32px' }}>
                                            {tab === 'available' ? 'No invoices ready for funding. Wait for debtor confirmations.' : 'No funded invoices yet.'}
                                        </td></tr>
                                    ) : filtered.map(inv => (
                                        <tr key={inv.id} onClick={() => setSelected(inv)} style={{ cursor: 'pointer', background: selected?.id === inv.id ? 'rgba(59,130,246,.08)' : '' }}>
                                            <td className="td-id">{inv.invoiceNumber}</td>
                                            <td>{inv.creditorCompany || inv.creditorName || '—'}</td>
                                            <td>{inv.debtorCompanyName || inv.debtorCompany || '—'}</td>
                                            <td className="td-amount">{formatAmount(inv.amount)}</td>
                                            <td className="td-amount" style={{ color: '#3B82F6' }}>{formatAmount(inv.advanceAmount || parseFloat(inv.amount) * 0.85)}</td>
                                            <td className="td-amount" style={{ color: '#F59E0B' }}>{formatAmount(inv.discountFee || parseFloat(inv.amount) * 0.02)}</td>
                                            <td>
                                                <span className={`badge risk-${getRiskColor(inv.riskScore || 50) === 'green' ? 'low' : getRiskColor(inv.riskScore || 50) === 'amber' ? 'medium' : 'high'}`}>
                                                    {inv.riskLabel || '—'} {inv.riskScore ? `(${Math.round(inv.riskScore)})` : ''}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${inv.status === 'debtor_confirmed' ? 'status-approved' : inv.status === 'funded' ? 'status-funded' : inv.status === 'paid' ? 'status-approved' : inv.status === 'settled' ? 'status-funded' : 'status-review'}`}>
                                                    {inv.status === 'debtor_confirmed' ? 'Confirmed' : inv.status === 'funded' ? 'Funded' : inv.status === 'paid' ? 'Paid' : inv.status === 'settled' ? 'Settled' : inv.status}
                                                </span>
                                            </td>
                                            <td onClick={e => e.stopPropagation()}>
                                                {inv.status === 'debtor_confirmed' && (
                                                    <button
                                                        disabled={actionLoading === inv.id}
                                                        onClick={() => handleFund(inv)}
                                                        style={{
                                                            fontFamily: 'var(--font-head)', fontSize: '11px', fontWeight: 600,
                                                            color: '#fff', background: 'var(--blue)', border: '1px solid rgba(59,130,246,.3)',
                                                            padding: '5px 12px', borderRadius: '6px', cursor: 'pointer',
                                                            transition: 'all .2s var(--ease)',
                                                        }}
                                                    >
                                                        {actionLoading === inv.id ? '...' : '💰 Fund This Invoice'}
                                                    </button>
                                                )}
                                                {inv.status === 'paid' && (
                                                    <button
                                                        disabled={actionLoading === inv.id}
                                                        onClick={() => handleSettle(inv)}
                                                        style={{
                                                            fontFamily: 'var(--font-head)', fontSize: '11px', fontWeight: 600,
                                                            color: '#fff', background: 'var(--green)', border: '1px solid rgba(34,197,94,.3)',
                                                            padding: '5px 12px', borderRadius: '6px', cursor: 'pointer',
                                                        }}
                                                    >
                                                        {actionLoading === inv.id ? '...' : '🏦 Settle'}
                                                    </button>
                                                )}
                                                {inv.status === 'funded' && (
                                                    <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>Awaiting Payment</span>
                                                )}
                                                {inv.status === 'settled' && (
                                                    <span className="badge status-funded" style={{ background: 'rgba(34,197,94,.1)', color: 'var(--green)', border: '1px solid rgba(34,197,94,.2)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>✓ Settled</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* Detail Panel */}
                {selected && (
                    <section className="card" style={{ padding: '28px', marginBottom: '28px', animation: 'cardEnter .4s ease both' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <div>
                                <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--blue)' }}>{selected.invoiceNumber}</h3>
                                <p style={{ color: 'var(--gray-300)', fontSize: '14px', marginTop: '4px' }}>
                                    {selected.creditorCompany || selected.creditorName} → {selected.debtorCompanyName || selected.debtorCompany}
                                </p>
                            </div>
                            <button onClick={() => setSelected(null)} style={{
                                background: 'rgba(255,255,255,.04)', border: '1px solid var(--border-dim)',
                                borderRadius: '8px', color: 'var(--gray-400)', width: '32px', height: '32px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                            }}>✕</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
                            <div style={{ background: 'rgba(255,255,255,.025)', border: '1px solid var(--border-dim)', borderRadius: '10px', padding: '16px' }}>
                                <span style={{ color: 'var(--gray-400)', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.5px' }}>Invoice Amount</span><br />
                                <span className="mono" style={{ color: 'var(--white)', fontSize: '20px', fontWeight: 700 }}>{formatAmount(selected.amount)}</span>
                            </div>
                            <div style={{ background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.15)', borderRadius: '10px', padding: '16px' }}>
                                <span style={{ color: 'var(--gray-400)', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.5px' }}>Advance (85%)</span><br />
                                <span className="mono" style={{ color: 'var(--blue)', fontSize: '20px', fontWeight: 700 }}>{formatAmount(selected.advanceAmount || parseFloat(selected.amount) * 0.85)}</span>
                            </div>
                            <div style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.15)', borderRadius: '10px', padding: '16px' }}>
                                <span style={{ color: 'var(--gray-400)', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.5px' }}>Your Profit (2%)</span><br />
                                <span className="mono" style={{ color: 'var(--amber)', fontSize: '20px', fontWeight: 700 }}>{formatAmount(selected.discountFee || parseFloat(selected.amount) * 0.02)}</span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,.025)', border: '1px solid var(--border-dim)', borderRadius: '10px', padding: '16px' }}>
                                <span style={{ color: 'var(--gray-400)', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.5px' }}>Risk Score</span><br />
                                <span className={`mono ${getRiskColor(selected.riskScore || 50)}-text`} style={{ fontSize: '28px', fontWeight: 700 }}>{selected.riskScore ? Math.round(selected.riskScore) : '—'}</span>
                                <span style={{ fontSize: '12px', color: 'var(--gray-400)', marginLeft: '6px' }}>{selected.riskLabel || ''}</span>
                            </div>
                        </div>

                        {/* Risk Details */}
                        {selected.riskDetails && (
                            <div style={{ marginBottom: '20px' }}>
                                <h4 style={{ color: 'var(--gray-300)', fontSize: '13px', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '.5px' }}>Risk Breakdown</h4>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    {Object.entries(selected.riskDetails).map(([key, val]) => (
                                        <div key={key} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--border-dim)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px' }}>
                                            <span style={{ color: 'var(--gray-400)' }}>{key}: </span>
                                            <span className="mono" style={{ color: typeof val === 'number' && val > 0 ? '#EF4444' : '#22C55E', fontWeight: 600 }}>{val > 0 ? `+${val}` : val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Fund button for detail panel */}
                        {selected.status === 'debtor_confirmed' && (
                            <button
                                disabled={actionLoading === selected.id}
                                onClick={() => handleFund(selected)}
                                style={{
                                    padding: '14px 28px', borderRadius: '10px', border: 'none',
                                    background: 'var(--blue)', color: '#fff', fontSize: '15px',
                                    fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-head)',
                                    transition: 'all .2s ease', width: '100%'
                                }}
                            >
                                {actionLoading === selected.id ? 'Processing...' : '💰 Fund This Invoice — Advance ' + formatAmount(selected.advanceAmount || parseFloat(selected.amount) * 0.85)}
                            </button>
                        )}
                    </section>
                )}

                {/* Portfolio Section */}
                <section id="section-portfolio" style={{ marginBottom: '28px', scrollMarginTop: '20px' }} className={glowSection === 'portfolio' ? 'section-glow' : ''}>
                    <div className="card" style={{ padding: '28px' }}>
                        <h2 className="card-title" style={{ marginBottom: '20px' }}>📊 Portfolio & Profit</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
                            <div style={{ background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.15)', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                                <div style={{ color: 'var(--gray-400)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>Total Invested</div>
                                <div className="mono" style={{ color: 'var(--blue)', fontSize: '22px', fontWeight: 700 }}>{formatAmount(totalFunded)}</div>
                            </div>
                            <div style={{ background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.15)', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                                <div style={{ color: 'var(--gray-400)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>Total Profit Earned</div>
                                <div className="mono" style={{ color: 'var(--green)', fontSize: '22px', fontWeight: 700 }}>{formatAmount(totalProfit)}</div>
                            </div>
                            <div style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.15)', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                                <div style={{ color: 'var(--gray-400)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>Active Investments</div>
                                <div className="mono" style={{ color: 'var(--amber)', fontSize: '22px', fontWeight: 700 }}>{fundedInvoices.filter(i => i.status === 'funded').length}</div>
                            </div>
                            <div style={{ background: 'rgba(139,92,246,.06)', border: '1px solid rgba(139,92,246,.15)', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                                <div style={{ color: 'var(--gray-400)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>Settled</div>
                                <div className="mono" style={{ color: '#8B5CF6', fontSize: '22px', fontWeight: 700 }}>{fundedInvoices.filter(i => i.status === 'settled').length}</div>
                            </div>
                        </div>

                        {/* Funded invoices list */}
                        <h4 style={{ color: 'var(--gray-300)', fontSize: '13px', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '.5px' }}>My Funded Invoices</h4>
                        {fundedInvoices.length === 0 ? (
                            <p style={{ color: 'var(--gray-400)', fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>No funded invoices yet. Fund invoices from the queue above.</p>
                        ) : (
                            <div style={{ display: 'grid', gap: '10px' }}>
                                {fundedInvoices.map(inv => (
                                    <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'rgba(255,255,255,.02)', border: '1px solid var(--border-dim)', borderRadius: '10px' }}>
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <span className="mono" style={{ color: 'var(--blue)', fontSize: '13px', fontWeight: 600 }}>{inv.invoiceNumber}</span>
                                            <span style={{ color: 'var(--gray-300)', fontSize: '13px' }}>{inv.creditorCompany || inv.creditorName} → {inv.debtorCompanyName || inv.debtorCompany}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                            <span className="mono" style={{ color: 'var(--white)', fontSize: '14px', fontWeight: 600 }}>{formatAmount(inv.amount)}</span>
                                            <span style={{ color: 'var(--green)', fontSize: '12px', fontWeight: 600 }}>+{formatAmount(inv.discountFee || parseFloat(inv.amount) * 0.02)} profit</span>
                                            <span className={`badge ${inv.status === 'settled' ? 'status-funded' : inv.status === 'paid' ? 'status-approved' : 'status-review'}`}>
                                                {inv.status === 'funded' ? 'Active' : inv.status === 'paid' ? 'Paid' : 'Settled'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

            </main>
        </>
    );
}
