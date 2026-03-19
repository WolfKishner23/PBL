import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import '../styles/landing.css';

export default function LandingPage() {
    useEffect(() => {
        // Intersection Observer for fade-in animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

        // Navbar scroll effect
        const navbar = document.getElementById('navbar');
        const handleScroll = () => {
            if (window.scrollY > 30) {
                navbar?.classList.add('scrolled');
            } else {
                navbar?.classList.remove('scrolled');
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <>
            {/* NAVBAR */}
            <nav id="navbar" className="navbar">
                <div className="nav-container">
                    <Link to="/" className="logo" aria-label="InvoiceFlow home">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <rect width="28" height="28" rx="6" fill="#3B82F6" />
                            <path d="M8 8h12v2H8zm0 5h8v2H8zm0 5h10v2H8z" fill="#fff" />
                        </svg>
                        <span>InvoiceFlow</span>
                    </Link>
                    <ul className="nav-links" id="navLinks">
                        <li><a href="#features">Features</a></li>
                    </ul>
                    <div className="nav-actions">
                        <Link to="/login" className="btn-ghost">Sign In</Link>
                        <Link to="/register" className="btn-primary btn-sm">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* HERO */}
            <section id="hero" className="hero">
                {/* Animated gradient mesh background */}
                <div className="hero-mesh"></div>
                {/* Noise/grain texture overlay */}
                <div className="hero-noise"></div>
                {/* Floating particles */}
                <div className="hero-particles">
                    <div className="particle"></div>
                    <div className="particle"></div>
                    <div className="particle"></div>
                    <div className="particle"></div>
                    <div className="particle"></div>
                    <div className="particle"></div>
                    <div className="particle"></div>
                    <div className="particle"></div>
                </div>
                <div className="hero-glow"></div>
                <div className="container hero-content">
                    <div className="hero-badge fade-in">
                        <span className="badge-dot"></span>
                        AI-Powered Invoice Factoring
                    </div>
                    <h1 className="hero-heading fade-in">
                        Get Paid <span className="text-gradient">Today.</span><br />
                        Not in 90 Days.
                    </h1>
                    <p className="hero-sub fade-in">
                        Upload your invoices. Our AI assesses risk in seconds.<br />
                        Get funded within 48 hours — no collateral, no hassle.
                    </p>
                    <div className="hero-ctas fade-in">
                        <Link to="/register" className="btn-primary">
                            Start for Free
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </Link>
                        <Link to="/dashboard" className="btn-outline">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l5 4-5 4V4z" fill="currentColor" /></svg>
                            View Demo
                        </Link>
                    </div>

                </div>
                <div className="hero-grid-bg"></div>
            </section>


            {/* HOW IT WORKS */}
            <section id="features" className="how-it-works">
                <div className="container">
                    <div className="section-header fade-in">
                        <span className="section-tag">How It Works</span>
                        <h2 className="section-heading">Three steps to <span className="text-gradient">instant funding</span></h2>
                        <p className="section-sub">From invoice upload to cash in your account — powered by AI, completed in hours.</p>
                    </div>
                    <div className="steps-grid">
                        <div className="step-card fade-in">
                            <div className="step-number">01</div>
                            <div className="step-icon">
                                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                    <rect x="6" y="4" width="20" height="24" rx="3" stroke="#3B82F6" strokeWidth="2" />
                                    <path d="M12 12h8M12 16h6M12 20h4" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
                                    <path d="M18 4v6h6" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3 className="step-title">Upload Invoice</h3>
                            <p className="step-desc">Upload your outstanding invoices via our secure dashboard. Supports PDF, CSV, and direct ERP integrations.</p>
                            <div className="step-line"></div>
                        </div>
                        <div className="step-card fade-in">
                            <div className="step-number">02</div>
                            <div className="step-icon">
                                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                    <circle cx="16" cy="16" r="11" stroke="#3B82F6" strokeWidth="2" />
                                    <path d="M16 10v6l4 3" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="24" cy="8" r="4" fill="#3B82F6" opacity="0.3" />
                                    <path d="M23 7l1 1 2-2" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3 className="step-title">AI Risk Score</h3>
                            <p className="step-desc">Our proprietary AI engine scores buyer creditworthiness, invoice validity, and fraud risk in under 60 seconds.</p>
                            <div className="step-line"></div>
                        </div>
                        <div className="step-card fade-in">
                            <div className="step-number">03</div>
                            <div className="step-icon">
                                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                    <rect x="4" y="10" width="24" height="14" rx="3" stroke="#3B82F6" strokeWidth="2" />
                                    <path d="M4 15h24" stroke="#3B82F6" strokeWidth="2" />
                                    <rect x="8" y="19" width="6" height="2" rx="1" fill="#3B82F6" opacity="0.5" />
                                </svg>
                            </div>
                            <h3 className="step-title">Get Funded</h3>
                            <p className="step-desc">Receive up to 90% of your invoice value directly to your bank account within 48 hours. No hidden fees.</p>
                        </div>
                    </div>
                </div>
            </section>



            {/* FOOTER */}
            <footer id="blog" className="footer">
                <div className="container footer-inner">
                    <div className="footer-left">
                        <Link to="/" className="logo" aria-label="InvoiceFlow home">
                            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                                <rect width="28" height="28" rx="6" fill="#3B82F6" />
                                <path d="M8 8h12v2H8zm0 5h8v2H8zm0 5h10v2H8z" fill="#fff" />
                            </svg>
                            <span>InvoiceFlow</span>
                        </Link>
                        <p className="footer-copy">© 2026 InvoiceFlow Technologies Pvt. Ltd. All rights reserved.</p>
                    </div>
                    <div className="footer-links">
                        <Link to="/privacy">Privacy Policy</Link>
                        <Link to="/terms">Terms of Service</Link>
                        <Link to="/contact">Contact</Link>
                    </div>
                </div>
            </footer>
        </>
    );
}
