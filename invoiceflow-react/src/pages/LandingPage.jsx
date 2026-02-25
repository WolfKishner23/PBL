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
        return () => observer.disconnect();
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
                        <li><a href="#pricing">Pricing</a></li>
                        <li><a href="#about">About</a></li>
                        <li><a href="#blog">Blog</a></li>
                    </ul>
                    <div className="nav-actions">
                        <Link to="/login" className="btn-ghost">Sign In</Link>
                        <Link to="/register" className="btn-primary btn-sm">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* HERO */}
            <section id="hero" className="hero">
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
                    <div className="hero-stats fade-in">
                        <div className="stat-pill"><span className="stat-number">₹500Cr+</span><span className="stat-label">Funded</span></div>
                        <div className="stat-divider"></div>
                        <div className="stat-pill"><span className="stat-number">2,400+</span><span className="stat-label">Businesses</span></div>
                        <div className="stat-divider"></div>
                        <div className="stat-pill"><span className="stat-number">48hr</span><span className="stat-label">Avg. Funding</span></div>
                    </div>
                </div>
                <div className="hero-grid-bg"></div>
            </section>

            {/* STATS BAR */}
            <section className="stats-bar">
                <div className="stats-track">
                    <div className="stats-track-inner">
                        {['82% SMBs face cash flow issues', '$3.8T global invoice factoring market', '8.2% annual growth rate', '₹50K Cr India market opportunity',
                            '82% SMBs face cash flow issues', '$3.8T global invoice factoring market', '8.2% annual growth rate', '₹50K Cr India market opportunity'].map((text, i) => {
                                const [highlight, ...rest] = text.split(' ');
                                return (
                                    <span key={i}>
                                        <div className="stat-item"><span className="stat-highlight">{highlight}</span> {rest.join(' ')}</div>
                                        {i < 7 && <div className="stat-sep">◆</div>}
                                    </span>
                                );
                            })}
                    </div>
                </div>
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

            {/* PRICING */}
            <section id="pricing" className="pricing">
                <div className="container">
                    <div className="section-header fade-in">
                        <span className="section-tag">Pricing</span>
                        <h2 className="section-heading">Simple, <span className="text-gradient">transparent</span> pricing</h2>
                        <p className="section-sub">Start free. Scale as you grow. No surprise charges.</p>
                    </div>
                    <div className="pricing-grid">
                        <div className="pricing-card fade-in">
                            <div className="pricing-tier">Starter</div>
                            <div className="pricing-price"><span className="price-amount">Free</span></div>
                            <p className="pricing-desc">Perfect for freelancers and micro-businesses getting started.</p>
                            <ul className="pricing-features">
                                {['Up to 3 invoices/month', 'Basic AI risk scoring', 'Email support', 'Dashboard access'].map((f, i) => (
                                    <li key={i}>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8l3 3 5-6" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <Link to="/register" className="btn-outline btn-full">Get Started</Link>
                        </div>
                        <div className="pricing-card featured fade-in">
                            <div className="featured-badge">Most Popular</div>
                            <div className="pricing-tier">Growth</div>
                            <div className="pricing-price"><span className="price-currency">₹</span><span className="price-amount">4,999</span><span className="price-period">/mo</span></div>
                            <p className="pricing-desc">For growing SMBs that need consistent cash flow.</p>
                            <ul className="pricing-features">
                                {['Unlimited invoices', 'Advanced AI + fraud detection', 'Priority funding (24hr)', 'ERP integrations (Tally, Zoho)', 'Dedicated account manager'].map((f, i) => (
                                    <li key={i}>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8l3 3 5-6" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <Link to="/register" className="btn-primary btn-full">Get Started</Link>
                        </div>
                        <div className="pricing-card fade-in">
                            <div className="pricing-tier">Enterprise</div>
                            <div className="pricing-price"><span className="price-amount">Custom</span></div>
                            <p className="pricing-desc">For large enterprises needing tailored solutions and SLAs.</p>
                            <ul className="pricing-features">
                                {['Everything in Growth', 'Custom API & webhooks', 'White-label dashboard', '99.99% SLA guarantee', 'On-premise deployment option'].map((f, i) => (
                                    <li key={i}>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8l3 3 5-6" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <a href="#" className="btn-outline btn-full">Contact Sales</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section id="about" className="testimonials">
                <div className="container">
                    <div className="section-header fade-in">
                        <span className="section-tag">Testimonials</span>
                        <h2 className="section-heading">Loved by <span className="text-gradient">businesses</span> across India</h2>
                        <p className="section-sub">Hear from founders who transformed their cash flow with InvoiceFlow.</p>
                    </div>
                    <div className="testimonials-grid">
                        {[
                            { quote: '"InvoiceFlow completely changed our cash flow game. We used to wait 60-90 days for payments — now we get funded in under 2 days. It\'s like having a CFO on autopilot."', name: 'Rajesh Kumar', company: 'CEO, BuildRight Infra', initials: 'RK' },
                            { quote: '"The AI scoring is incredibly accurate. We\'ve processed over ₹12 Cr through the platform with zero fraud incidents. The Tally integration saved our accounts team hours every week."', name: 'Priya Sharma', company: 'CFO, NovaTech Solutions', initials: 'PS' },
                            { quote: '"As a textile exporter, unpredictable cash flow was killing our growth. InvoiceFlow gave us the financial certainty we needed to scale from 50 to 200+ employees in a year."', name: 'Arjun Mehta', company: 'Founder, Weavewell Exports', initials: 'AM' },
                        ].map((t, i) => (
                            <div className="testimonial-card fade-in" key={i}>
                                <div className="stars">{[...Array(5)].map((_, j) => <svg key={j} width="16" height="16" viewBox="0 0 16 16" fill="#FBBF24"><path d="M8 1l2.2 4.6L15 6.3l-3.5 3.4.8 4.8L8 12.2 3.7 14.5l.8-4.8L1 6.3l4.8-.7z" /></svg>)}</div>
                                <p className="testimonial-quote">{t.quote}</p>
                                <div className="testimonial-author">
                                    <div className="author-avatar">{t.initials}</div>
                                    <div className="author-info">
                                        <span className="author-name">{t.name}</span>
                                        <span className="author-company">{t.company}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA BANNER */}
            <section className="cta-banner">
                <div className="container cta-content">
                    <div className="cta-glow"></div>
                    <h2 className="cta-heading fade-in">Stop Waiting. <span className="text-gradient">Start Growing.</span></h2>
                    <p className="cta-sub fade-in">Join 2,400+ businesses already using InvoiceFlow to unlock their working capital.</p>
                    <Link to="/register" className="btn-primary btn-lg fade-in">
                        Get Started — It's Free
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </Link>
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
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                        <a href="#">Contact</a>
                    </div>
                </div>
            </footer>
        </>
    );
}
