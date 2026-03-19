import { Link } from 'react-router-dom';
import '../styles/legal.css';

export default function PrivacyPolicyPage() {
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
            <main className="legal-content">
                <h1>Privacy Policy</h1>
                <p className="legal-updated">Last updated: March 19, 2026</p>

                <div className="legal-section">
                    <h2>Information We Collect</h2>
                    <p>At InvoiceFlow, we collect information that helps us provide and improve our invoice factoring services. The types of information we collect include:</p>
                    <ul>
                        <li><strong>Personal Information:</strong> Name, email address, phone number, company name, and business registration details provided during account registration.</li>
                        <li><strong>Financial Data:</strong> Bank account details, invoice records, transaction history, and credit-related information necessary for risk assessment and funding.</li>
                        <li><strong>Usage Data:</strong> Information about how you interact with our platform, including pages visited, features used, time spent, and device/browser information.</li>
                        <li><strong>Verification Documents:</strong> Government-issued identification, GST certificates, and other business verification documents uploaded for KYC compliance.</li>
                    </ul>
                </div>

                <div className="legal-section">
                    <h2>How We Use Your Data</h2>
                    <p>We use the information we collect for the following purposes:</p>
                    <ul>
                        <li>To process invoice factoring applications and disburse funds to your account.</li>
                        <li>To perform AI-driven risk assessments and credit scoring on submitted invoices.</li>
                        <li>To verify your identity and comply with Know Your Customer (KYC) and Anti-Money Laundering (AML) regulations.</li>
                        <li>To communicate with you about your account, transactions, and platform updates.</li>
                        <li>To improve our platform's performance, user experience, and AI models.</li>
                        <li>To detect and prevent fraud, unauthorized access, and security threats.</li>
                    </ul>
                </div>

                <div className="legal-section">
                    <h2>Cookies & Tracking</h2>
                    <p>InvoiceFlow uses cookies and similar tracking technologies to enhance your experience on our platform. These include:</p>
                    <ul>
                        <li><strong>Essential Cookies:</strong> Required for core functionality such as authentication, session management, and security. These cannot be disabled.</li>
                        <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform so we can improve features and performance. These are anonymized.</li>
                        <li><strong>Preference Cookies:</strong> Store your settings and preferences (such as language and display options) for a personalized experience.</li>
                    </ul>
                    <p>You can manage your cookie preferences through your browser settings. Please note that disabling certain cookies may affect the functionality of our platform.</p>
                </div>

                <div className="legal-section">
                    <h2>Third-Party Sharing</h2>
                    <p>We do not sell your personal information to third parties. However, we may share your data with trusted partners under the following circumstances:</p>
                    <ul>
                        <li><strong>Finance Partners:</strong> Anonymized invoice and risk data shared with registered finance partners for funding evaluation and disbursement.</li>
                        <li><strong>Regulatory Authorities:</strong> When required by law, regulation, or legal process (e.g., RBI compliance, tax authorities).</li>
                        <li><strong>Service Providers:</strong> Third-party services that assist with payment processing, cloud hosting, analytics, and email communications, all bound by data protection agreements.</li>
                    </ul>
                </div>

                <div className="legal-section">
                    <h2>Data Retention</h2>
                    <p>We retain your personal and financial data for as long as your account is active and as required to fulfill the purposes outlined in this policy. Specifically:</p>
                    <ul>
                        <li>Account information is retained for the duration of your active subscription and for 5 years after account closure for regulatory compliance.</li>
                        <li>Transaction and invoice records are retained for 8 years as required under Indian financial regulations.</li>
                        <li>Usage and analytics data is retained in anonymized form indefinitely for platform improvement.</li>
                    </ul>
                    <p>You may request deletion of your data at any time, subject to regulatory retention requirements.</p>
                </div>

                <div className="legal-section">
                    <h2>User Rights</h2>
                    <p>Under applicable data protection laws, including the Digital Personal Data Protection Act, 2023, you have the following rights:</p>
                    <ul>
                        <li><strong>Right to Access:</strong> You may request a copy of all personal data we hold about you.</li>
                        <li><strong>Right to Correction:</strong> You may request correction of inaccurate or incomplete personal data.</li>
                        <li><strong>Right to Erasure:</strong> You may request deletion of your personal data, subject to legal retention obligations.</li>
                        <li><strong>Right to Data Portability:</strong> You may request your data in a structured, machine-readable format.</li>
                        <li><strong>Right to Withdraw Consent:</strong> You may withdraw consent for data processing at any time by contacting us.</li>
                    </ul>
                </div>

                <div className="legal-section">
                    <h2>Contact for Privacy Concerns</h2>
                    <p>If you have any questions, concerns, or requests regarding your privacy or this policy, please reach out to our Data Protection Officer:</p>
                    <p><strong>Email:</strong> <a href="mailto:privacy@invoiceflow.in">privacy@invoiceflow.in</a></p>
                    <p><strong>Address:</strong> InvoiceFlow Technologies Pvt. Ltd., 4th Floor, Technopark, Whitefield, Bengaluru, Karnataka 560066, India</p>
                    <p>We will respond to all privacy-related inquiries within 30 business days.</p>
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
