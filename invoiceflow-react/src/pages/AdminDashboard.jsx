import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/dashboard.css';
import '../styles/admin.css';

const usersData = [
    { name: 'Rajesh Nair', initials: 'RN', email: 'rajesh@buildright.com', role: 'Business', status: 'Active', invoices: 42, joined: 'Jan 2024' },
    { name: 'Kavita Lal', initials: 'KL', email: 'kavita@novatech.io', role: 'Finance', status: 'Active', invoices: 0, joined: 'Mar 2024' },
    { name: 'Suresh Kumar', initials: 'SK', email: 'suresh@exportpro.in', role: 'Business', status: 'Suspended', invoices: 18, joined: 'Jun 2024' },
    { name: 'Chen Rui', initials: 'CR', email: 'chen@capitalfund.hk', role: 'Finance', status: 'Active', invoices: 0, joined: 'Sep 2024' },
];

const healthServices = [
    { name: 'API Gateway', status: 'Healthy', uptime: '99.99%', latency: '42ms' },
    { name: 'Database', status: 'Healthy', uptime: '99.98%', latency: '8ms' },
    { name: 'AI Engine', status: 'Healthy', uptime: '99.95%', latency: '180ms' },
    { name: 'Queue Worker', status: 'Warning', uptime: '98.20%', latency: '320ms' },
    { name: 'Storage', status: 'Healthy', uptime: '99.99%', latency: '15ms' },
    { name: 'Email Service', status: 'Healthy', uptime: '99.97%', latency: '95ms' },
];

export default function AdminDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [tab, setTab] = useState('users');
    const [users, setUsers] = useState(usersData);
    const [search, setSearch] = useState('');

    function toggleSuspend(index) {
        setUsers(prev => prev.map((u, i) => i === index ? { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' } : u));
    }

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <Sidebar variant="admin" activeSection="admin" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="main">
                <header className="header-bar">
                    <div className="header-left">
                        <button className="mobile-sidebar-btn" onClick={() => setSidebarOpen(true)} aria-label="Toggle sidebar">
                            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        </button>
                        <div>
                            <h1 className="header-greeting">Admin Dashboard</h1>
                            <span className="system-status-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: 'rgba(16,185,129,.1)', borderRadius: '20px', fontSize: '12px', color: 'var(--green)', fontWeight: 500, marginTop: '4px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }}></span>
                                All Systems Operational
                            </span>
                        </div>
                    </div>
                    <div className="header-right">
                        <div className="search-box">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" /><path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                            <input type="text" placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </div>
                </header>

                {/* Stat Cards */}
                <section className="stat-cards">
                    {[
                        { label: 'Total Users', value: '2,412', change: '↑ 124 this month', accent: 'blue' },
                        { label: 'Invoice Volume', value: '₹24Cr', change: '↑ this month', accent: 'green' },
                        { label: 'Approval Rate', value: '74%', change: '', accent: 'amber' },
                        { label: 'Default Rate', value: '1.2%', change: '↓ 0.3%', accent: 'purple' },
                    ].map((s, i) => (
                        <div className="stat-card" data-accent={s.accent} key={i}>
                            <div className="stat-card-top"><span className="stat-card-label">{s.label}</span></div>
                            <div className="stat-card-value">{s.value}</div>
                            {s.change && <div className="stat-card-change"><span className={`change-badge ${s.accent}`}>{s.change}</span></div>}
                        </div>
                    ))}
                </section>

                {/* Tabs */}
                <div className="admin-tabs" style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
                    {['users', 'analytics', 'health'].map(t => (
                        <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)} style={{ padding: '10px 20px' }}>
                            {t === 'users' ? 'Users' : t === 'analytics' ? 'Analytics' : 'System Health'}
                        </button>
                    ))}
                </div>

                {/* Users Tab */}
                {tab === 'users' && (
                    <section className="card table-card">
                        <div className="table-scroll">
                            <table className="invoice-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Invoices</th>
                                        <th>Joined</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((u, i) => (
                                        <tr key={i}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '11px' }}>{u.initials}</div>
                                                    <span>{u.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--gray-400)' }}>{u.email}</td>
                                            <td><span className={`badge ${u.role === 'Finance' ? 'status-approved' : 'status-review'}`}>{u.role}</span></td>
                                            <td><span className={`badge ${u.status === 'Active' ? 'status-funded' : 'status-rejected'}`}>{u.status}</span></td>
                                            <td className="mono">{u.invoices}</td>
                                            <td style={{ color: 'var(--gray-400)' }}>{u.joined}</td>
                                            <td>
                                                <button className="btn-ghost-sm" onClick={() => toggleSuspend(users.indexOf(u))}>
                                                    {u.status === 'Active' ? 'Suspend' : 'Restore'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* Analytics Tab */}
                {tab === 'analytics' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {[
                            { label: 'Monthly Invoice Volume', value: '₹3.2Cr', trend: '↑ 18%', progress: 72, color: 'var(--blue)' },
                            { label: 'Avg. Risk Score', value: '72/100', trend: '↑ 3pts', progress: 72, color: 'var(--green)' },
                            { label: 'Avg. Time to Fund', value: '36 hrs', trend: '↓ 4hrs', progress: 60, color: 'var(--amber)' },
                            { label: 'Portfolio ROI', value: '3.4%', trend: '↑ 0.2%', progress: 68, color: 'var(--purple)' },
                        ].map((m, i) => (
                            <div className="card" key={i} style={{ padding: '24px' }}>
                                <span style={{ color: 'var(--gray-400)', fontSize: '13px' }}>{m.label}</span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '8px 0' }}>
                                    <span className="mono" style={{ fontSize: '28px', color: 'var(--white)', fontWeight: 700 }}>{m.value}</span>
                                    <span style={{ fontSize: '12px', color: 'var(--green)' }}>{m.trend}</span>
                                </div>
                                <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px' }}>
                                    <div style={{ width: `${m.progress}%`, height: '100%', background: m.color, borderRadius: '2px', transition: 'width 1s ease' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* System Health Tab */}
                {tab === 'health' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        {healthServices.map((s, i) => (
                            <div className="card" key={i} style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <span style={{ color: 'var(--white)', fontWeight: 600, fontSize: '14px' }}>{s.name}</span>
                                    <span className={`badge ${s.status === 'Healthy' ? 'status-funded' : 'status-review'}`}>{s.status}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div><span style={{ color: 'var(--gray-400)', fontSize: '11px' }}>Uptime</span><br /><span className="mono" style={{ color: 'var(--white)', fontSize: '13px' }}>{s.uptime}</span></div>
                                    <div><span style={{ color: 'var(--gray-400)', fontSize: '11px' }}>Latency</span><br /><span className="mono" style={{ color: 'var(--white)', fontSize: '13px' }}>{s.latency}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </>
    );
}
