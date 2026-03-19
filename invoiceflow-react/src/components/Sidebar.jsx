import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';

const navItems = [
    { to: '/dashboard', icon: 'grid', label: 'Dashboard', section: 'dashboard' },
    { to: '/dashboard', icon: 'invoice', label: 'My Invoices', section: 'invoices' },
    { to: '/upload', icon: 'upload', label: 'Upload Invoice', section: 'upload' },
    { to: '/dashboard', icon: 'chart', label: 'Cash Flow', section: 'cashflow' },
];

const financeNavItems = [
    { to: '/finance', icon: 'grid', label: 'Finance Dashboard', section: 'finance' },
    { to: '/finance', icon: 'invoice', label: 'Invoice Queue', section: 'queue' },
    { to: '/finance', icon: 'chart', label: 'Portfolio', section: 'portfolio' },
    { to: '/finance', icon: 'analytics', label: 'Analytics', section: 'analytics' },
];

const adminNavItems = [
    { to: '/admin', icon: 'grid', label: 'Admin', section: 'admin' },
    { to: '/admin', icon: 'users', label: 'Users', section: 'users' },
    { to: '/admin', icon: 'invoice', label: 'Invoices', section: 'invoices' },
    { to: '/admin', icon: 'analytics', label: 'Analytics', section: 'analytics' },
];

const icons = {
    grid: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <rect x="11" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <rect x="2" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <rect x="11" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    ),
    invoice: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 6h6M7 9h4M7 12h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
    ),
    upload: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 13V4m0 0L7 7m3-3l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 13v2a2 2 0 002 2h10a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    ),
    chart: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 17l4-5 3 3 7-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    settings: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 2v2m0 12v2M2 10h2m12 0h2M4.2 4.2l1.4 1.4m8.8 8.8l1.4 1.4M15.8 4.2l-1.4 1.4M5.6 14.4l-1.4 1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    ),
    users: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 18c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    ),
    analytics: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="10" width="3" height="7" rx="1" stroke="currentColor" strokeWidth="1.3" />
            <rect x="8.5" y="6" width="3" height="11" rx="1" stroke="currentColor" strokeWidth="1.3" />
            <rect x="14" y="3" width="3" height="14" rx="1" stroke="currentColor" strokeWidth="1.3" />
        </svg>
    ),
    logout: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 17H4a1 1 0 01-1-1V4a1 1 0 011-1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M14 13l3-3-3-3M8 10h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
};

export default function Sidebar({ variant = 'business', activeSection, isOpen, onClose }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const items = variant === 'finance' ? financeNavItems : variant === 'admin' ? adminNavItems : navItems;

    const userName = user?.name || localStorage.getItem('invoiceflow_user') || (variant === 'admin' ? 'Super Admin' : 'User');
    const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const userRole = user?.role === 'finance' ? 'Finance Partner' : user?.role === 'admin' ? 'System Admin' : 'Business Owner';
    const userEmail = user?.email || 'user@invoiceflow.in';
    const businessName = user?.company || 'InvoiceFlow Business';

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function handleLogout() {
        setMenuOpen(false);
        logout();
        navigate('/login');
    }

    return (
        <>
            <aside className={`sidebar${isOpen ? ' open' : ''}`}>
                <div className="sidebar-top">
                    <Link to="/" className="sidebar-logo" aria-label="InvoiceFlow home">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <rect width="28" height="28" rx="6" fill="#3B82F6" />
                            <path d="M8 8h12v2H8zm0 5h8v2H8zm0 5h10v2H8z" fill="#fff" />
                        </svg>
                        <span>InvoiceFlow</span>
                    </Link>
                    <nav className="sidebar-nav">
                        {items.map((item, i) => {
                            const isActive = activeSection
                                ? item.section === activeSection
                                : item.to === location.pathname;
                            return (
                                <Link
                                    key={i}
                                    to={item.to}
                                    className={`nav-item${isActive ? ' active' : ''}`}
                                    data-section={item.section}
                                    onClick={(e) => {
                                        // If we're already on the same page, scroll to the section
                                        if (location.pathname === item.to || (location.pathname === '/dashboard' && item.to === '/dashboard')) {
                                            const sectionEl = document.getElementById(`section-${item.section}`);
                                            if (sectionEl) {
                                                e.preventDefault();
                                                sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }
                                        }
                                    }}
                                >
                                    {icons[item.icon]}
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="sidebar-bottom">
                    <hr className="sidebar-divider" />
                    <div className="user-card" ref={menuRef} style={{ position: 'relative' }}>
                        <div className={`user-avatar${variant === 'admin' ? ' admin-avatar' : ''}`}>{initials}</div>
                        <div className="user-info">
                            <span className="user-name">{userName}</span>
                            <span className="user-role">{userRole}</span>
                        </div>
                        <svg
                            className="user-more"
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            <circle cx="8" cy="3" r="1.2" fill="currentColor" />
                            <circle cx="8" cy="8" r="1.2" fill="currentColor" />
                            <circle cx="8" cy="13" r="1.2" fill="currentColor" />
                        </svg>

                        {/* Dropdown Menu */}
                        {menuOpen && (
                            <div className="user-dropdown">
                                <div className="user-dropdown-profile">
                                    <div className={`user-dropdown-avatar${variant === 'admin' ? ' admin-avatar' : ''}`}>{initials}</div>
                                    <div className="user-dropdown-details">
                                        <span className="user-dropdown-business">{businessName}</span>
                                        <span className="user-dropdown-name">{userName}</span>
                                        <span className="user-dropdown-email">{userEmail}</span>
                                    </div>
                                </div>
                                <div className="user-dropdown-divider"></div>
                                <button className="user-dropdown-logout" onClick={handleLogout}>
                                    {icons.logout}
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
            {isOpen && <div className="sidebar-overlay show" onClick={onClose}></div>}
        </>
    );
}
