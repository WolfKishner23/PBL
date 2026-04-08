import { Link } from 'react-router-dom';
import { useState } from 'react';
import '../styles/legal.css';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 4000);
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <div className="legal-page">
            {/* Navbar */}
            <nav className="legal-navbar">
                <div className="legal-navbar-inner">
                    <Link to="/" className="legal-back-btn">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Back
                    </Link>
                    <Link to="/" className="legal-logo">
                        <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                            <rect width="28" height="28" rx="6" fill="#3B82F6" />
                            <path d="M8 8h12v2H8zm0 5h8v2H8zm0 5h10v2H8z" fill="#fff" />
                        </svg>
                        <span>InvoiceFlow</span>
                    </Link>
                </div>
            </nav>

            {/* Content */}
            <main className="legal-content" style={{ maxWidth: '1000px' }}>
                <h1>Contact Us</h1>
                <p className="legal-updated">We'd love to hear from you. Reach out through any of the channels below.</p>

                <div className="contact-grid">
                    {/* Left: Info Cards */}
                    <div className="contact-info">
                        <div className="contact-card">
                            <div className="contact-card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="4" width="20" height="16" rx="2" />
                                    <path d="M22 4L12 13 2 4" />
                                </svg>
                            </div>
                            <h3>Email</h3>
                            <p>support@invoiceflow.in</p>
                            <p>For general inquiries and support requests. We typically respond within 24 hours.</p>
                        </div>

                        <div className="contact-card">
                            <div className="contact-card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                                </svg>
                            </div>
                            <h3>Phone</h3>
                            <p>+91 80 4567 8900</p>
                            <p>Available Monday–Friday, 9:00 AM to 6:00 PM IST. Closed on national holidays.</p>
                        </div>

                        <div className="contact-card">
                            <div className="contact-card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                            </div>
                            <h3>Office Location</h3>
                            <p>4th Floor, Technopark Tower B</p>
                            <p>Whitefield, Bengaluru, Karnataka 560066, India</p>
                        </div>
                    </div>

                    {/* Right: Contact Form */}
                    <div className="contact-form-card">
                        <h2>Send a Message</h2>
                        {submitted && (
                            <div style={{
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: '10px',
                                padding: '14px 18px',
                                marginBottom: '20px',
                                color: '#10B981',
                                fontSize: '14px'
                            }}>
                                ✓ Your message has been sent successfully. We'll get back to you soon!
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="name">Full Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="subject">Subject</label>
                                <select
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="" disabled>Select a subject</option>
                                    <option value="general">General Inquiry</option>
                                    <option value="support">Technical Support</option>
                                    <option value="billing">Billing & Payments</option>
                                    <option value="partnership">Partnership Opportunity</option>
                                    <option value="feedback">Feedback & Suggestions</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="message">Message</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    placeholder="Tell us how we can help you..."
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <button type="submit" className="contact-submit-btn">
                                Send Message
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                        </form>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="legal-footer">
                <div className="legal-footer-inner">
                    <div className="legal-footer-left">
                        <Link to="/" className="legal-logo">
                            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                                <rect width="28" height="28" rx="6" fill="#3B82F6" />
                                <path d="M8 8h12v2H8zm0 5h8v2H8zm0 5h10v2H8z" fill="#fff" />
                            </svg>
                            <span>InvoiceFlow</span>
                        </Link>
                        <p className="legal-footer-copy">© 2026 InvoiceFlow Technologies Pvt. Ltd. All rights reserved.</p>
                    </div>
                    <div className="legal-footer-links">
                        <Link to="/privacy">Privacy Policy</Link>
                        <Link to="/terms">Terms of Service</Link>
                        <Link to="/contact">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
