import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/* ── Admin accounts config ── */
const ADMINS = {
  Shrawani: {
    password: "12345678",
    role: "Admin-1",
    avatar: "SR",
    color: "#ec4899",
    bg: "rgba(236,72,153,.18)",
  },
  Rohan: {
    password: "1234567",
    role: "Admin-2",
    avatar: "RN",
    color: "#3B82F6",
    bg: "rgba(59,130,246,.18)",
  },
  Krishna: {
    password: "123456",
    role: "Admin-3",
    avatar: "KH",
    color: "#22c55e",
    bg: "rgba(34,197,94,.18)",
  },
  Chaitanya: {
    password: "12345",
    role: "Admin-4",
    avatar: "CH",
    color: "#f59e0b",
    bg: "rgba(245,158,11,.18)",
  },
};

export default function AdminLoginPage() {
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function selectAdmin(name) {
    setSelectedAdmin(name);
    setPassword("");
    setError("");
  }

  function doLogin(e) {
    e.preventDefault();
    if (!selectedAdmin) {
      setError("Please select an admin account.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (password !== ADMINS[selectedAdmin].password) {
      setError("Incorrect password. Please try again.");
      setPassword("");
      return;
    }

    setLoading(true);
    localStorage.setItem("invoiceflow_admin", selectedAdmin);
    localStorage.setItem("invoiceflow_admin_role", ADMINS[selectedAdmin].role);
    localStorage.setItem(
      "invoiceflow_admin_avatar",
      ADMINS[selectedAdmin].avatar,
    );
    localStorage.setItem(
      "invoiceflow_admin_color",
      ADMINS[selectedAdmin].color,
    );
    navigate("/admin", { replace: true });
  }

  const admin = selectedAdmin ? ADMINS[selectedAdmin] : null;

  return (
    <div style={styles.body}>
      {/* Background glows */}
      <div
        style={{
          ...styles.glow,
          background: "radial-gradient(circle,#3B82F6,transparent)",
          top: "-200px",
          left: "-200px",
        }}
      />
      <div
        style={{
          ...styles.glow,
          background: "radial-gradient(circle,#a855f7,transparent)",
          bottom: "-150px",
          right: "-150px",
        }}
      />
      <div style={styles.grid} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <rect
                width="28"
                height="28"
                rx="6"
                fill="rgba(255,255,255,.12)"
              />
              <path d="M8 8h12v2H8zm0 5h8v2H8zm0 5h10v2H8z" fill="#fff" />
            </svg>
          </div>
          <span style={styles.logoText}>InvoiceFlow</span>
          <span style={styles.logoBadge}>Admin Portal</span>
        </div>

        <h1 style={styles.heading}>Administrator Login</h1>
        <p style={styles.subtext}>
          Select your account and enter your password to access the dashboard.
        </p>

        {/* Admin pick grid */}
        <p style={styles.sectionLabel}>Select Admin Account</p>
        <div style={styles.pickGrid}>
          {Object.entries(ADMINS).map(([name, info]) => {
            const isSelected = selectedAdmin === name;
            return (
              <div
                key={name}
                onClick={() => selectAdmin(name)}
                style={{
                  ...styles.pickCard,
                  borderColor: isSelected
                    ? info.color
                    : "rgba(255,255,255,.07)",
                  background: isSelected
                    ? `${info.bg}`
                    : "rgba(255,255,255,.03)",
                  boxShadow: isSelected
                    ? `0 0 0 1px ${info.color}55, 0 8px 24px rgba(0,0,0,.3)`
                    : "none",
                  transform: isSelected ? "translateY(-2px)" : "translateY(0)",
                }}
                tabIndex={0}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") && selectAdmin(name)
                }
                role="button"
                aria-pressed={isSelected}
              >
                <div
                  style={{
                    ...styles.pickAvatar,
                    background: info.bg,
                    color: info.color,
                  }}
                >
                  {info.avatar}
                </div>
                <div style={styles.pickInfo}>
                  <div style={styles.pickName}>{name}</div>
                  <div style={styles.pickRole}>{info.role}</div>
                </div>
                <div
                  style={{
                    ...styles.pickCheck,
                    background: isSelected ? info.color : "transparent",
                    borderColor: isSelected
                      ? info.color
                      : "rgba(255,255,255,.2)",
                    color: "#fff",
                  }}
                >
                  {isSelected && "✓"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Password */}
        <form onSubmit={doLogin}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel} htmlFor="adminPw">
              Password
              {admin && (
                <span style={styles.hintPill}>
                  {admin.password.length} characters
                </span>
              )}
            </label>
            <div style={{ position: "relative" }}>
              <span style={styles.inputIcon}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect
                    x="3"
                    y="7"
                    width="10"
                    height="8"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                  <path
                    d="M5.5 7V5a2.5 2.5 0 015 0v2"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <input
                id="adminPw"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter your password"
                disabled={!selectedAdmin}
                style={{
                  ...styles.formInput,
                  borderColor: error ? "#ef4444" : "rgba(255,255,255,.08)",
                  opacity: selectedAdmin ? 1 : 0.5,
                  cursor: selectedAdmin ? "text" : "not-allowed",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                style={styles.eyeBtn}
                aria-label="Toggle password"
                tabIndex={-1}
              >
                {showPw ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6b7280"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6b7280"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && <div style={styles.errorBox}>⚠ {error}</div>}

          {/* Submit */}
          <button
            type="submit"
            disabled={!selectedAdmin || !password || loading}
            style={{
              ...styles.loginBtn,
              opacity: !selectedAdmin || !password || loading ? 0.55 : 1,
              cursor:
                !selectedAdmin || !password || loading
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {loading ? (
              <>
                <span style={styles.spinner} /> Signing in…
              </>
            ) : (
              "Enter Admin Dashboard"
            )}
          </button>
        </form>

        {/* Back to user login */}
        <Link to="/login" style={styles.backLink}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M8.5 3L4.5 7l4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to User Login
        </Link>
      </div>

      <style>{`
                @keyframes glowDrift {
                    from { transform: translate(0,0); }
                    to   { transform: translate(30px,30px); }
                }
                @keyframes cardIn {
                    from { opacity:0; transform:translateY(24px) scale(.98); }
                    to   { opacity:1; transform:translateY(0) scale(1); }
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .pick-card-hover:hover {
                    transform: translateY(-2px) !important;
                    box-shadow: 0 8px 24px rgba(0,0,0,.3) !important;
                }
            `}</style>
    </div>
  );
}

/* ── Styles ── */
const styles = {
  body: {
    fontFamily: "'Sora', sans-serif",
    background: "#08090d",
    color: "#f0f1ff",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  glow: {
    position: "fixed",
    width: "550px",
    height: "550px",
    borderRadius: "50%",
    filter: "blur(100px)",
    opacity: 0.14,
    animation: "glowDrift 12s ease-in-out infinite alternate",
    pointerEvents: "none",
  },
  grid: {
    position: "fixed",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px)",
    backgroundSize: "60px 60px",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    zIndex: 10,
    width: "100%",
    maxWidth: "520px",
    margin: "24px",
    background: "rgba(15,16,26,.88)",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: "16px",
    padding: "40px",
    backdropFilter: "blur(24px)",
    boxShadow: "0 32px 80px rgba(0,0,0,.6)",
    animation: "cardIn .6s cubic-bezier(.4,0,.2,1) both",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "32px",
  },
  logoIcon: {
    width: "40px",
    height: "40px",
    background: "linear-gradient(135deg,#3B82F6,#a855f7)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 20px rgba(99,102,241,.4)",
    flexShrink: 0,
  },
  logoText: { fontSize: "18px", fontWeight: 700, letterSpacing: "-.3px" },
  logoBadge: {
    marginLeft: "auto",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    fontWeight: 600,
    color: "#818cf8",
    background: "rgba(99,102,241,.12)",
    border: "1px solid rgba(99,102,241,.25)",
    padding: "3px 10px",
    borderRadius: "20px",
    letterSpacing: ".5px",
    textTransform: "uppercase",
  },
  heading: {
    fontSize: "24px",
    fontWeight: 700,
    letterSpacing: "-.4px",
    marginBottom: "6px",
  },
  subtext: { fontSize: "13px", color: "#9ca3af", marginBottom: "28px" },
  sectionLabel: {
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: ".8px",
    color: "#6b7280",
    marginBottom: "12px",
  },
  pickGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "24px",
  },
  pickCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    border: "1.5px solid",
    borderRadius: "10px",
    padding: "12px 14px",
    cursor: "pointer",
    transition: "all .2s cubic-bezier(.4,0,.2,1)",
    outline: "none",
  },
  pickAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    fontWeight: 700,
    flexShrink: 0,
  },
  pickInfo: { flex: 1, minWidth: 0 },
  pickName: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#f0f1ff",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  pickRole: {
    fontSize: "10px",
    color: "#6b7280",
    fontFamily: "'JetBrains Mono', monospace",
    marginTop: "2px",
  },
  pickCheck: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    border: "1.5px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: 700,
    transition: "all .2s cubic-bezier(.4,0,.2,1)",
    flexShrink: 0,
  },
  formGroup: { marginBottom: "20px" },
  formLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#9ca3af",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: ".5px",
  },
  hintPill: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    color: "#6b7280",
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.08)",
    padding: "2px 8px",
    borderRadius: "20px",
    marginLeft: "auto",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#6b7280",
    pointerEvents: "none",
    display: "flex",
  },
  formInput: {
    width: "100%",
    padding: "13px 44px",
    background: "#13141f",
    border: "1px solid",
    borderRadius: "10px",
    color: "#f0f1ff",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "14px",
    fontWeight: 500,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color .2s",
  },
  eyeBtn: {
    position: "absolute",
    right: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
  },
  errorBox: {
    fontSize: "12px",
    color: "#ef4444",
    background: "rgba(239,68,68,.08)",
    border: "1px solid rgba(239,68,68,.2)",
    borderRadius: "8px",
    padding: "10px 14px",
    marginBottom: "16px",
    fontFamily: "'JetBrains Mono', monospace",
  },
  loginBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg,#6366f1,#a855f7)",
    border: "none",
    borderRadius: "10px",
    color: "#fff",
    fontFamily: "'Sora', sans-serif",
    fontSize: "15px",
    fontWeight: 700,
    boxShadow: "0 4px 24px rgba(99,102,241,.35)",
    transition: "opacity .2s, transform .2s, box-shadow .2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  spinner: {
    display: "inline-block",
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin .7s linear infinite",
  },
  backLink: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    marginTop: "20px",
    fontSize: "13px",
    color: "#6b7280",
    textDecoration: "none",
    transition: "color .2s",
  },
};
