import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { adminAPI } from "../services/api";
import "../styles/dashboard.css";
import "../styles/admin.css";

/* ─── Static data ─── */
const FINANCE_PARTNERS = [
  {
    name: "HDFC Bank Ltd",
    email: "credit@hdfc.com",
    portfolio: "₹12.4Cr",
    roi: "3.8%",
    status: "Active",
    invoices: 48,
    joined: "Jan 3",
  },
  {
    name: "ICICI Ventures",
    email: "deals@icici.com",
    portfolio: "₹9.1Cr",
    roi: "4.1%",
    status: "Active",
    invoices: 31,
    joined: "Jan 7",
  },
  {
    name: "CapitalFund IN",
    email: "rohan@capitalfund.in",
    portfolio: "₹6.8Cr",
    roi: "3.5%",
    status: "Active",
    invoices: 22,
    joined: "Jan 18",
  },
  {
    name: "Aditya Birla FC",
    email: "aditya@abfinance.com",
    portfolio: "₹5.3Cr",
    roi: "3.2%",
    status: "Active",
    invoices: 17,
    joined: "Feb 2",
  },
  {
    name: "Axis Growth Cap",
    email: "growth@axis.com",
    portfolio: "₹4.7Cr",
    roi: "2.9%",
    status: "Paused",
    invoices: 12,
    joined: "Feb 10",
  },
  {
    name: "FinancePro IN",
    email: "krishna@financepro.in",
    portfolio: "₹3.9Cr",
    roi: "3.6%",
    status: "Active",
    invoices: 19,
    joined: "Jan 8",
  },
  {
    name: "Kotak AIF",
    email: "aif@kotak.com",
    portfolio: "₹7.2Cr",
    roi: "4.0%",
    status: "Active",
    invoices: 27,
    joined: "Jan 22",
  },
  {
    name: "Bajaj Finserv",
    email: "trade@bajaj.com",
    portfolio: "₹2.1Cr",
    roi: "2.4%",
    status: "Inactive",
    invoices: 5,
    joined: "Mar 1",
  },
];

const BUSINESS_OWNERS = [
  {
    name: "Rohan Natekar",
    email: "rohan@tatasteel.com",
    company: "Tata Steel Ltd",
    invoices: 12,
    funded: "₹4.8L",
    status: "Active",
  },
  {
    name: "Shravani Kotawar",
    email: "shravani@wipro.com",
    company: "Wipro Technologies",
    invoices: 3,
    funded: "₹1.2L",
    status: "Suspended",
  },
  {
    name: "Chaitanya Ranade",
    email: "chaitanya@hdfc.com",
    company: "HDFC Merchants",
    invoices: 7,
    funded: "₹3.1L",
    status: "Active",
  },
  {
    name: "Priya Sharma",
    email: "priya@infosys.com",
    company: "Infosys BPO",
    invoices: 9,
    funded: "₹6.4L",
    status: "Active",
  },
  {
    name: "Amit Patel",
    email: "amit@mahindra.com",
    company: "Mahindra Agri",
    invoices: 15,
    funded: "₹8.9L",
    status: "Active",
  },
  {
    name: "Sneha Kulkarni",
    email: "sneha@reliance.com",
    company: "Reliance Retail",
    invoices: 6,
    funded: "₹2.7L",
    status: "Active",
  },
  {
    name: "Vikram Desai",
    email: "vikram@bajaj.com",
    company: "Bajaj Auto Ancillary",
    invoices: 4,
    funded: "₹1.5L",
    status: "Active",
  },
  {
    name: "Neha Joshi",
    email: "neha@startupind.com",
    company: "StartupInd Pvt Ltd",
    invoices: 2,
    funded: "₹0.8L",
    status: "Inactive",
  },
  {
    name: "Rajesh Kumar",
    email: "rajesh@msme.in",
    company: "Kumar MSME Works",
    invoices: 11,
    funded: "₹5.2L",
    status: "Active",
  },
  {
    name: "Ananya Singh",
    email: "ananya@textiles.com",
    company: "Singh Textiles Pvt",
    invoices: 8,
    funded: "₹4.0L",
    status: "Active",
  },
];

const ALL_TRANSACTIONS = [
  {
    id: "TXN-001",
    customer: "Rohan Natekar",
    partner: "HDFC Bank Ltd",
    amount: "₹4,85,000",
    type: "Funded",
    status: "Completed",
    date: "Jan 12",
    risk: 88,
  },
  {
    id: "TXN-002",
    customer: "Priya Sharma",
    partner: "ICICI Ventures",
    amount: "₹2,10,000",
    type: "Funded",
    status: "Completed",
    date: "Jan 15",
    risk: 79,
  },
  {
    id: "TXN-003",
    customer: "Amit Patel",
    partner: "CapitalFund IN",
    amount: "₹6,50,000",
    type: "Funded",
    status: "Completed",
    date: "Jan 18",
    risk: 91,
  },
  {
    id: "TXN-004",
    customer: "Shravani Kotawar",
    partner: "FinancePro IN",
    amount: "₹1,20,000",
    type: "Pending",
    status: "Pending",
    date: "Jan 20",
    risk: 62,
  },
  {
    id: "TXN-005",
    customer: "Chaitanya Ranade",
    partner: "Kotak AIF",
    amount: "₹3,10,000",
    type: "Funded",
    status: "Completed",
    date: "Jan 22",
    risk: 84,
  },
  {
    id: "TXN-006",
    customer: "Sneha Kulkarni",
    partner: "Aditya Birla FC",
    amount: "₹2,70,000",
    type: "Funded",
    status: "Completed",
    date: "Jan 25",
    risk: 76,
  },
  {
    id: "TXN-007",
    customer: "Vikram Desai",
    partner: "Axis Growth Cap",
    amount: "₹1,50,000",
    type: "Rejected",
    status: "Rejected",
    date: "Jan 28",
    risk: 41,
  },
  {
    id: "TXN-008",
    customer: "Rajesh Kumar",
    partner: "HDFC Bank Ltd",
    amount: "₹5,20,000",
    type: "Funded",
    status: "Completed",
    date: "Feb 1",
    risk: 87,
  },
  {
    id: "TXN-009",
    customer: "Neha Joshi",
    partner: "FinancePro IN",
    amount: "₹80,000",
    type: "Pending",
    status: "Pending",
    date: "Feb 4",
    risk: 55,
  },
  {
    id: "TXN-010",
    customer: "Ananya Singh",
    partner: "ICICI Ventures",
    amount: "₹4,00,000",
    type: "Funded",
    status: "Completed",
    date: "Feb 6",
    risk: 82,
  },
  {
    id: "TXN-011",
    customer: "Rohan Natekar",
    partner: "Kotak AIF",
    amount: "₹3,60,000",
    type: "Funded",
    status: "Completed",
    date: "Feb 10",
    risk: 90,
  },
  {
    id: "TXN-012",
    customer: "Priya Sharma",
    partner: "Bajaj Finserv",
    amount: "₹55,000",
    type: "Rejected",
    status: "Rejected",
    date: "Feb 12",
    risk: 38,
  },
  {
    id: "TXN-013",
    customer: "Amit Patel",
    partner: "HDFC Bank Ltd",
    amount: "₹2,30,000",
    type: "Pending",
    status: "Pending",
    date: "Feb 14",
    risk: 71,
  },
  {
    id: "TXN-014",
    customer: "Chaitanya Ranade",
    partner: "CapitalFund IN",
    amount: "₹1,80,000",
    type: "Funded",
    status: "Completed",
    date: "Feb 18",
    risk: 78,
  },
  {
    id: "TXN-015",
    customer: "Sneha Kulkarni",
    partner: "Aditya Birla FC",
    amount: "₹3,90,000",
    type: "Funded",
    status: "Completed",
    date: "Feb 22",
    risk: 83,
  },
];

const healthServices = [
  { name: "API Gateway", status: "Healthy", uptime: "99.99%", latency: "42ms" },
  { name: "Database", status: "Healthy", uptime: "99.98%", latency: "8ms" },
  { name: "AI Engine", status: "Healthy", uptime: "99.95%", latency: "180ms" },
  {
    name: "Queue Worker",
    status: "Warning",
    uptime: "98.20%",
    latency: "320ms",
  },
  { name: "Storage", status: "Healthy", uptime: "99.99%", latency: "15ms" },
  {
    name: "Email Service",
    status: "Healthy",
    uptime: "99.97%",
    latency: "95ms",
  },
];

const AVATAR_COLORS = [
  { bg: "rgba(59,130,246,.2)", color: "#3B82F6" },
  { bg: "rgba(34,197,94,.2)", color: "#22c55e" },
  { bg: "rgba(168,85,247,.2)", color: "#a855f7" },
  { bg: "rgba(245,158,11,.2)", color: "#f59e0b" },
  { bg: "rgba(239,68,68,.2)", color: "#ef4444" },
];

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* ─── Status badge helper ─── */
function StatusBadge({ status }) {
  const map = {
    Active: {
      bg: "rgba(34,197,94,.12)",
      color: "#22c55e",
      border: "rgba(34,197,94,.25)",
    },
    Completed: {
      bg: "rgba(34,197,94,.12)",
      color: "#22c55e",
      border: "rgba(34,197,94,.25)",
    },
    Funded: {
      bg: "rgba(99,102,241,.12)",
      color: "#818cf8",
      border: "rgba(99,102,241,.25)",
    },
    Pending: {
      bg: "rgba(245,158,11,.12)",
      color: "#f59e0b",
      border: "rgba(245,158,11,.25)",
    },
    Paused: {
      bg: "rgba(245,158,11,.12)",
      color: "#f59e0b",
      border: "rgba(245,158,11,.25)",
    },
    Rejected: {
      bg: "rgba(239,68,68,.12)",
      color: "#ef4444",
      border: "rgba(239,68,68,.25)",
    },
    Suspended: {
      bg: "rgba(239,68,68,.12)",
      color: "#ef4444",
      border: "rgba(239,68,68,.25)",
    },
    Inactive: {
      bg: "rgba(107,114,128,.12)",
      color: "#9ca3af",
      border: "rgba(107,114,128,.25)",
    },
    Warning: {
      bg: "rgba(245,158,11,.12)",
      color: "#f59e0b",
      border: "rgba(245,158,11,.25)",
    },
    Healthy: {
      bg: "rgba(34,197,94,.12)",
      color: "#22c55e",
      border: "rgba(34,197,94,.25)",
    },
  };
  const s = map[status] || map.Inactive;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 600,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

/* ─── User Overview Card ─── */
function UserCard({ item, type, index }) {
  const ac = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <div
      style={{
        background: "rgba(255,255,255,.02)",
        border: "1px solid rgba(255,255,255,.07)",
        borderRadius: "12px",
        padding: "18px 20px",
        transition: "all .2s",
        position: "relative",
        overflow: "hidden",
        animationDelay: `${index * 0.05}s`,
      }}
    >
      {/* top accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background:
            type === "finance"
              ? "linear-gradient(90deg,#a855f7,#3B82F6)"
              : "linear-gradient(90deg,#3B82F6,#22c55e)",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: ac.bg,
            color: ac.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12px",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initials(item.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: "14px",
              color: "#f0f1ff",
              marginBottom: "2px",
            }}
          >
            {item.name}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#6b7280",
              fontFamily: "'JetBrains Mono', monospace",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.email}
          </div>
        </div>
        <StatusBadge status={item.status} />
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          paddingTop: "12px",
          borderTop: "1px solid rgba(255,255,255,.06)",
        }}
      >
        {type === "finance" ? (
          <>
            <Pill highlight>📊 {item.portfolio}</Pill>
            <Pill>ROI: {item.roi}</Pill>
            <Pill>Invoices: {item.invoices}</Pill>
            <Pill>Joined: {item.joined}</Pill>
          </>
        ) : (
          <>
            <Pill>🏢 {item.company}</Pill>
            <Pill highlight>Funded: {item.funded}</Pill>
            <Pill>Invoices: {item.invoices}</Pill>
          </>
        )}
      </div>
    </div>
  );
}

function Pill({ children, highlight }) {
  return (
    <span
      style={{
        fontSize: "11px",
        fontFamily: "'JetBrains Mono', monospace",
        background: highlight ? "rgba(34,197,94,.07)" : "rgba(255,255,255,.04)",
        border: `1px solid ${highlight ? "rgba(34,197,94,.2)" : "rgba(255,255,255,.07)"}`,
        color: highlight ? "#22c55e" : "#9ca3af",
        borderRadius: "20px",
        padding: "3px 10px",
      }}
    >
      {children}
    </span>
  );
}

/* ══════════════ MAIN COMPONENT ══════════════ */
export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState("finance");
  const [txnFilter, setTxnFilter] = useState("all");
  const [txnSearch, setTxnSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /* ── Synchronous guard — checked before ANY render ── */
  const [adminName, setAdminName] = useState(null);
  const [adminRole, setAdminRole] = useState("Administrator");
  const [adminAvatar, setAdminAvatar] = useState("AD");
  const [adminColor, setAdminColor] = useState("#6366f1");

  useEffect(() => {
    const name = localStorage.getItem("invoiceflow_admin");
    const role = localStorage.getItem("invoiceflow_admin_role");
    const avatar = localStorage.getItem("invoiceflow_admin_avatar");
    const color = localStorage.getItem("invoiceflow_admin_color");

    setAdminName(name);
    if (role) setAdminRole(role);
    if (avatar) setAdminAvatar(avatar);
    if (color) setAdminColor(color);
  }, []);

  /* ── Fetch real users from API (with demo fallback) ── */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, statsRes] = await Promise.all([
          adminAPI.getUsers(),
          adminAPI.getStats(),
        ]);
        setUsers(
          (usersRes.data.users || []).map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
            status: u.isSuspended ? "Suspended" : "Active",
            invoices: u.invoiceCount || 0,
            joined: new Date(u.createdAt).toLocaleDateString("en-IN", {
              month: "short",
              year: "numeric",
            }),
          })),
        );
        setStats(statsRes.data);
      } catch {
        /* demo — no backend needed */
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (adminName === null) {
    return <div>Loading...</div>;
  }

  if (!adminName) {
    return <Navigate to="/admin-login" replace />;
  }
  const avatarGrad =
    {
      "#ec4899": "linear-gradient(135deg,#ec4899,#a855f7)",
      "#3B82F6": "linear-gradient(135deg,#3B82F6,#6366f1)",
      "#22c55e": "linear-gradient(135deg,#22c55e,#16a34a)",
      "#f59e0b": "linear-gradient(135deg,#f59e0b,#ef4444)",
    }[adminColor] || "linear-gradient(135deg,#6366f1,#a855f7)";


  /* ── Logout ── */
  function handleLogout() {
    [
      "invoiceflow_admin",
      "invoiceflow_admin_role",
      "invoiceflow_admin_avatar",
      "invoiceflow_admin_color",
    ].forEach((k) => localStorage.removeItem(k));
    navigate("/admin-login");
  }

  /* ── Filtered transactions ── */
  const filteredTxns = ALL_TRANSACTIONS.filter((t) => {
    const matchFilter =
      txnFilter === "all" ||
      t.type.toLowerCase() === txnFilter ||
      t.status.toLowerCase() === txnFilter;
    const matchSearch =
      !txnSearch ||
      Object.values(t)
        .join(" ")
        .toLowerCase()
        .includes(txnSearch.toLowerCase());
    return matchFilter && matchSearch;
  });

  const TABS = ["finance", "business", "transactions", "health"];
  const TAB_LABELS = {
    finance: "Finance Partners",
    business: "Business Owners",
    transactions: "All Transactions",
    health: "System Health",
  };

  return (
    <>
      <style>{`
                .uoc-card:hover { border-color: rgba(255,255,255,.14) !important; transform: translateY(-2px) !important; }
                .txn-filter-btn:hover { color: #f0f1ff !important; border-color: rgba(255,255,255,.15) !important; }
                .admin-tab-btn:hover { color: #c7d2fe !important; }
                @keyframes fadeUp { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
            `}</style>

      <Sidebar
        variant="admin"
        activeSection="admin"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main">
        {/* ── Header ── */}
        <header className="header-bar">
          <div className="header-left">
            <button
              className="mobile-sidebar-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle sidebar"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path
                  d="M3 6h16M3 11h16M3 16h16"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <div>
              <h1 className="header-greeting">Welcome, {adminName}!</h1>
              <p className="header-date">{adminRole} · Full platform access</p>
            </div>
          </div>
          <div
            className="header-right"
            style={{ display: "flex", alignItems: "center", gap: "12px" }}
          >
            {/* Status pill */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                background: "rgba(34,197,94,.08)",
                border: "1px solid rgba(34,197,94,.18)",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 600,
                color: "#22c55e",
                fontFamily: "'JetBrains Mono',monospace",
                letterSpacing: ".4px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  display: "inline-block",
                }}
              />
              All Systems Operational
            </span>
            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "8px",
                background: "rgba(239,68,68,.08)",
                border: "1px solid rgba(239,68,68,.2)",
                color: "#ef4444",
                fontFamily: "'Sora',sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all .2s",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M5 1H2a1 1 0 00-1 1v10a1 1 0 001 1h3M9 10l4-3-4-3M13 7H5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Logout
            </button>
          </div>
        </header>

        {/* ── Welcome Banner ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            background:
              "linear-gradient(135deg,rgba(99,102,241,.1),rgba(168,85,247,.07))",
            border: "1px solid rgba(99,102,241,.2)",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: avatarGrad,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: "13px",
              fontWeight: 700,
              flexShrink: 0,
              border: "2px solid rgba(99,102,241,.4)",
            }}
          >
            {adminAvatar}
          </div>
          <div>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#f0f1ff" }}>
              Welcome back,{" "}
              <span
                style={{
                  background: "linear-gradient(135deg,#818cf8,#a855f7)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {adminName}
              </span>
              !
            </h3>
            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
              Logged in as {adminRole}. You have full visibility of Finance
              Partners, Business Owners &amp; all Transactions.
            </p>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <section className="stat-cards">
          {[
            {
              label: "Total Customers",
              value: stats?.totalUsers?.toString() || "2,412",
              change: "↑ 124 this month",
              accent: "blue",
            },
            {
              label: "Total Transactions",
              value: "₹48.6Cr",
              change: "↑ 18% this quarter",
              accent: "green",
            },
            {
              label: "Finance Partners",
              value: "38",
              change: "↑ 6 new this month",
              accent: "amber",
            },
            {
              label: "Business Owners",
              value: "186",
              change: "↑ 22 this month",
              accent: "purple",
            },
          ].map((s, i) => (
            <div className="stat-card" data-accent={s.accent} key={i}>
              <div className="stat-card-top">
                <span className="stat-card-label">{s.label}</span>
              </div>
              <div className="stat-card-value">{s.value}</div>
              <span className="stat-card-trend up">{s.change}</span>
            </div>
          ))}
        </section>

        {/* ── Tab Card ── */}
        <section className="card" style={{ overflow: "hidden" }}>
          {/* Tab Bar */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid rgba(255,255,255,.06)",
              padding: "0 24px",
            }}
          >
            {TABS.map((t) => (
              <button
                key={t}
                className="admin-tab-btn"
                onClick={() => setTab(t)}
                style={{
                  padding: "15px 18px",
                  background: "none",
                  border: "none",
                  fontFamily: "'Sora',sans-serif",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: tab === t ? "#f0f1ff" : "#6b7280",
                  cursor: "pointer",
                  position: "relative",
                  transition: "color .2s",
                  whiteSpace: "nowrap",
                }}
              >
                {TAB_LABELS[t]}
                {tab === t && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: "-1px",
                      left: 0,
                      right: 0,
                      height: "2px",
                      background: "linear-gradient(90deg,#6366f1,#a855f7)",
                      borderRadius: "2px 2px 0 0",
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* ── Finance Partners ── */}
          {tab === "finance" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
                gap: "16px",
                padding: "24px",
              }}
            >
              {FINANCE_PARTNERS.map((p, i) => (
                <div
                  key={i}
                  className="uoc-card"
                  style={{
                    background: "rgba(255,255,255,.02)",
                    border: "1px solid rgba(255,255,255,.07)",
                    borderRadius: "12px",
                    padding: "18px 20px",
                    transition: "all .2s",
                    position: "relative",
                    overflow: "hidden",
                    animation: `fadeUp .4s ease ${i * 0.05}s both`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "2px",
                      background: "linear-gradient(90deg,#a855f7,#3B82F6)",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: AVATAR_COLORS[i % 5].bg,
                        color: AVATAR_COLORS[i % 5].color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: "12px",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {initials(p.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "14px",
                          color: "#f0f1ff",
                          marginBottom: "2px",
                        }}
                      >
                        {p.name}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#6b7280",
                          fontFamily: "'JetBrains Mono',monospace",
                        }}
                      >
                        {p.email}
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      paddingTop: "12px",
                      borderTop: "1px solid rgba(255,255,255,.06)",
                    }}
                  >
                    <Pill highlight>📊 {p.portfolio}</Pill>
                    <Pill>ROI: {p.roi}</Pill>
                    <Pill>Invoices: {p.invoices}</Pill>
                    <Pill>Joined: {p.joined}</Pill>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Business Owners ── */}
          {tab === "business" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
                gap: "16px",
                padding: "24px",
              }}
            >
              {BUSINESS_OWNERS.map((b, i) => (
                <div
                  key={i}
                  className="uoc-card"
                  style={{
                    background: "rgba(255,255,255,.02)",
                    border: "1px solid rgba(255,255,255,.07)",
                    borderRadius: "12px",
                    padding: "18px 20px",
                    transition: "all .2s",
                    position: "relative",
                    overflow: "hidden",
                    animation: `fadeUp .4s ease ${i * 0.05}s both`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "2px",
                      background: "linear-gradient(90deg,#3B82F6,#22c55e)",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: AVATAR_COLORS[i % 5].bg,
                        color: AVATAR_COLORS[i % 5].color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: "12px",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {initials(b.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "14px",
                          color: "#f0f1ff",
                          marginBottom: "2px",
                        }}
                      >
                        {b.name}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#6b7280",
                          fontFamily: "'JetBrains Mono',monospace",
                        }}
                      >
                        {b.email}
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      paddingTop: "12px",
                      borderTop: "1px solid rgba(255,255,255,.06)",
                    }}
                  >
                    <Pill>🏢 {b.company}</Pill>
                    <Pill highlight>Funded: {b.funded}</Pill>
                    <Pill>Invoices: {b.invoices}</Pill>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── All Transactions ── */}
          {tab === "transactions" && (
            <div>
              {/* Filter Bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "16px 24px 12px",
                  flexWrap: "wrap",
                }}
              >
                {["all", "funded", "pending", "rejected"].map((f) => (
                  <button
                    key={f}
                    className="txn-filter-btn"
                    onClick={() => setTxnFilter(f)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      border: "1px solid",
                      borderColor:
                        txnFilter === f
                          ? "rgba(99,102,241,.45)"
                          : "rgba(255,255,255,.07)",
                      background:
                        txnFilter === f
                          ? "rgba(99,102,241,.12)"
                          : "rgba(255,255,255,.03)",
                      color: txnFilter === f ? "#a5b4fc" : "#6b7280",
                      fontFamily: "'Sora',sans-serif",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all .2s",
                      textTransform: "capitalize",
                    }}
                  >
                    {f === "all"
                      ? "All"
                      : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
                {/* Search */}
                <div
                  style={{
                    marginLeft: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(255,255,255,.04)",
                    border: "1px solid rgba(255,255,255,.07)",
                    borderRadius: "8px",
                    padding: "6px 12px",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <circle
                      cx="5.5"
                      cy="5.5"
                      r="4"
                      stroke="#6b7280"
                      strokeWidth="1.3"
                    />
                    <path
                      d="M8.5 8.5L11 11"
                      stroke="#6b7280"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                  </svg>
                  <input
                    value={txnSearch}
                    onChange={(e) => setTxnSearch(e.target.value)}
                    placeholder="Search transactions…"
                    style={{
                      background: "none",
                      border: "none",
                      outline: "none",
                      color: "#f0f1ff",
                      fontFamily: "'Sora',sans-serif",
                      fontSize: "13px",
                      width: "180px",
                    }}
                  />
                </div>
              </div>

              {/* Table */}
              <div className="table-scroll">
                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th>Txn ID</th>
                      <th>Customer</th>
                      <th>Finance Partner</th>
                      <th>Amount</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Risk Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTxns.length === 0 ? (
                      <tr>
                        <td
                          colSpan="8"
                          style={{
                            textAlign: "center",
                            padding: "32px",
                            color: "#6b7280",
                          }}
                        >
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      filteredTxns.map((t, i) => {
                        const riskColor =
                          t.risk >= 80
                            ? "#22c55e"
                            : t.risk >= 60
                              ? "#f59e0b"
                              : "#ef4444";
                        return (
                          <tr key={i}>
                            <td>
                              <span
                                style={{
                                  fontFamily: "'JetBrains Mono',monospace",
                                  fontSize: "12px",
                                  color: "#9ca3af",
                                }}
                              >
                                {t.id}
                              </span>
                            </td>
                            <td>
                              <strong
                                style={{ color: "#f0f1ff", fontSize: "13px" }}
                              >
                                {t.customer}
                              </strong>
                            </td>
                            <td style={{ fontSize: "12px", color: "#9ca3af" }}>
                              {t.partner}
                            </td>
                            <td>
                              <span
                                style={{
                                  fontFamily: "'JetBrains Mono',monospace",
                                  fontWeight: 700,
                                  color: "#22c55e",
                                }}
                              >
                                {t.amount}
                              </span>
                            </td>
                            <td>
                              <StatusBadge status={t.type} />
                            </td>
                            <td>
                              <StatusBadge status={t.status} />
                            </td>
                            <td style={{ color: "#6b7280", fontSize: "12px" }}>
                              {t.date}
                            </td>
                            <td>
                              <span
                                style={{
                                  fontFamily: "'JetBrains Mono',monospace",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  color: riskColor,
                                }}
                              >
                                {t.risk}/100
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── System Health ── */}
          {tab === "health" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: "16px",
                padding: "24px",
              }}
            >
              {healthServices.map((s, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(255,255,255,.02)",
                    border: `1px solid ${s.status === "Warning" ? "rgba(245,158,11,.2)" : "rgba(255,255,255,.07)"}`,
                    borderRadius: "12px",
                    padding: "20px",
                    position: "relative",
                    overflow: "hidden",
                    animation: `fadeUp .4s ease ${i * 0.05}s both`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "2px",
                      background:
                        s.status === "Healthy" ? "#22c55e" : "#f59e0b",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <span
                      style={{
                        color: "#f0f1ff",
                        fontWeight: 600,
                        fontSize: "14px",
                      }}
                    >
                      {s.name}
                    </span>
                    <StatusBadge status={s.status} />
                  </div>
                  <div style={{ display: "flex", gap: "20px" }}>
                    <div>
                      <span
                        style={{
                          color: "#6b7280",
                          fontSize: "11px",
                          display: "block",
                        }}
                      >
                        Uptime
                      </span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          color: "#f0f1ff",
                          fontSize: "13px",
                        }}
                      >
                        {s.uptime}
                      </span>
                    </div>
                    <div>
                      <span
                        style={{
                          color: "#6b7280",
                          fontSize: "11px",
                          display: "block",
                        }}
                      >
                        Latency
                      </span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          color: "#f0f1ff",
                          fontSize: "13px",
                        }}
                      >
                        {s.latency}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
