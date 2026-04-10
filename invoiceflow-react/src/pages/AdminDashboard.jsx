import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { adminAPI } from '../services/api';
import '../styles/dashboard.css';
import '../styles/admin.css';

const healthServices = [
    { name: 'API Gateway', status: 'Healthy', uptime: '99.99%', latency: '42ms' },
    { name: 'Database', status: 'Healthy', uptime: '99.98%', latency: '8ms' },
    { name: 'AI Engine', status: 'Healthy', uptime: '99.95%', latency: '180ms' },
    { name: 'Queue Worker', status: 'Warning', uptime: '98.20%', latency: '320ms' },
    { name: 'Storage', status: 'Healthy', uptime: '99.99%', latency: '15ms' },
    { name: 'Email Service', status: 'Healthy', uptime: '99.97%', latency: '95ms' },
];

const SECTIONS = {
    users: { label: 'Users', icon: 'users' },
    business: { label: 'Business Owners', icon: 'business' },
    finance: { label: 'Finance Partners', icon: 'finance' },
    analytics: { label: 'Analytics', icon: 'analytics' },
    health: { label: 'System Health', icon: 'health' },
};

export default function AdminDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('users');
    const [roleFilter, setRoleFilter] = useState('');
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const adminName = localStorage.getItem('invoiceflow_admin') || 'Admin';

    const handleSectionClick = (section) => {
        if (section === 'users') {
            setRoleFilter('');
            setActiveSection('users');
        } else if (section === 'business') {
            setRoleFilter('business');
            setActiveSection('users');
        } else if (section === 'finance') {
            setRoleFilter('finance');
            setActiveSection('users');
        } else if (section === 'feedback') {
            setActiveSection('feedback');
        } else {
            setActiveSection(section);
        }
    };

    // Fetch users and stats from API
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                console.log('Fetching admin data, roleFilter:', roleFilter);
                const params = roleFilter ? { role: roleFilter } : {};
                console.log('API params:', params);
                
                const [usersRes, statsRes] = await Promise.all([
                    adminAPI.getUsers(params),
                    adminAPI.getStats()
                ]);
                
                console.log('Raw usersRes:', usersRes);
                console.log('Raw statsRes:', statsRes);
                console.log('usersRes.data:', usersRes.data);
                console.log('statsRes.data:', statsRes.data);
                
                const usersData = usersRes.data;
                const statsData = statsRes.data;
                
                setUsers((usersData.users || []).map(u => ({
                    id: u.id,
                    name: u.name,
                    initials: u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
                    email: u.email,
                    role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
                    status: u.isSuspended ? 'Suspended' : u.isVerified ? 'Active' : 'Pending',
                    invoices: u.invoiceCount || 0,
                    joined: new Date(u.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
                })));
                
                // Handle both stats.stats and stats direct
                setStats(statsData.stats || statsData);
            } catch (err) {
                console.error('Failed to fetch admin data:', err);
                setError(err.response?.data?.error || err.message || 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [roleFilter]);

    // Fetch feedbacks when feedback section is active
    useEffect(() => {
        if (activeSection === 'feedback') {
            adminAPI.getFeedbacks()
                .then(res => {
                    setFeedbacks(res.data.feedbacks || res.data || []);
                })
                .catch(err => console.error('Failed to fetch feedbacks:', err));
        }
    }, [activeSection]);

    async function toggleSuspend(index) {
        const user = users[index];
        if (!user) return;
        try {
            await adminAPI.suspendUser(user.id);
            setUsers(prev => prev.map((u, i) => i === index ? { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' } : u));
        } catch (err) {
            console.error('Failed to toggle suspend:', err);
            // Fallback for demo
            setUsers(prev => prev.map((u, i) => i === index ? { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' } : u));
        }
    }

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <Sidebar variant="admin" activeSection={activeSection} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onSectionClick={handleSectionClick} />
            <main className="main">
                <header className="header-bar">
                    <div className="header-left">
                        <button className="mobile-sidebar-btn" onClick={() => setSidebarOpen(true)} aria-label="Toggle sidebar">
                            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        </button>
                        <div>
                            <h1 className="header-greeting">Welcome back, {adminName}</h1>
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
                    {error && (
                        <div style={{ gridColumn: '1 / -1', padding: '16px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '8px', color: 'var(--red)', marginBottom: '16px' }}>
                            Error: {error}
                        </div>
                    )}
                    {[
                        { label: 'Total Users', value: stats?.totalUsers?.toString() || '0', accent: 'blue' },
                        { label: 'Total Invoices', value: stats?.totalInvoices?.toString() || '0', accent: 'green' },
                        { label: 'Pending Invoices', value: stats?.pendingInvoices?.toString() || '0', accent: 'amber' },
                        { label: 'Funded Invoices', value: stats?.fundedInvoices?.toString() || '0', accent: 'purple' },
                    ].map((s, i) => (
                        <div className="stat-card" data-accent={s.accent} key={i}>
                            <div className="stat-card-top"><span className="stat-card-label">{s.label}</span></div>
                            <div className="stat-card-value">{s.value}</div>
                        </div>
                    ))}
                </section>

                {/* Role Filter Tabs */}
                <div className="admin-tabs" style={{ display: 'flex', gap: '4px', marginBottom: '24px', flexWrap: 'nowrap', overflowX: 'auto' }}>
                    {[
                        { key: '', label: 'All Users' },
                        { key: 'business', label: 'Business Owners' },
                        { key: 'finance', label: 'Finance Partners' },
                    ].map(t => (
                        <button key={t.key} className={`tab${roleFilter === t.key ? ' active' : ''}`} onClick={() => { setRoleFilter(t.key); setActiveSection('users'); }} style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}>
                            {t.label}
                        </button>
                    ))}
                    <span style={{ width: '1px', background: 'var(--border-dim)', margin: '0 8px' }}></span>
                    {['analytics', 'health', 'feedback'].map(t => (
                        <button key={t} className={`tab${activeSection === t ? ' active' : ''}`} onClick={() => setActiveSection(t)} style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}>
                            {t === 'analytics' ? 'Analytics' : t === 'health' ? 'System Health' : 'Feedback'}
                        </button>
                    ))}
                </div>

                {/* Users Tab */}
                {activeSection === 'users' && (
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
                                    {loading ? (
                                        <tr><td colSpan="7" style={{ textAlign: 'center', color: '#64748B', padding: '32px' }}>Loading users...</td></tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr><td colSpan="7" style={{ textAlign: 'center', color: '#64748B', padding: '32px' }}>No users found</td></tr>
                                    ) : filteredUsers.map((u, i) => (
                                        <tr key={u.id || i}>
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
                {activeSection === 'analytics' && (
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
                {activeSection === 'health' && (
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

                {/* Feedback Tab */}
                {activeSection === 'feedback' && (
                    <section className="card table-card">
                        <div className="table-scroll">
                            <table className="invoice-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Subject</th>
                                        <th>Message</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {feedbacks.length === 0 ? (
                                        <tr><td colSpan="7" style={{ textAlign: 'center', color: '#64748B', padding: '32px' }}>No feedback yet</td></tr>
                                    ) : feedbacks.map((f, i) => (
                                        <tr key={f.id || i}>
                                            <td>{f.name}</td>
                                            <td style={{ color: 'var(--gray-400)' }}>{f.email}</td>
                                            <td><span className="badge status-review">{f.subject}</span></td>
                                            <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.message}</td>
                                            <td><span className={`badge ${f.isRead ? 'status-funded' : 'status-review'}`}>{f.isRead ? 'Read' : 'New'}</span></td>
                                            <td style={{ color: 'var(--gray-400)' }}>{new Date(f.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                            <td>
                                                <button className="btn-ghost-sm" onClick={() => {
                                                    if (!f.isRead) {
                                                        adminAPI.markFeedbackRead(f.id).then(() => {
                                                            setFeedbacks(prev => prev.map(item => item.id === f.id ? { ...item, isRead: true } : item));
                                                        });
                                                    }
                                                }}>
                                                    {f.isRead ? 'Mark Unread' : 'Mark Read'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </main>
        </>
    );
}
