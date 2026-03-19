import { Link } from 'react-router-dom';
import '../styles/legal.css';

export default function TermsOfServicePage() {
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
                <h1>Terms of Service</h1>
                <p className="legal-updated">Last updated: March 19, 2026</p>

                <div className="legal-section">
                    <h2>Acceptance of Terms</h2>
                    <p>By accessing or using the InvoiceFlow platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service.</p>
                    <p>These Terms constitute a legally binding agreement between you (whether an individual or an entity) and InvoiceFlow Technologies Pvt. Ltd. ("InvoiceFlow", "we", "our", or "us"). We reserve the right to update these Terms at any time, and your continued use of the Service after such changes constitutes acceptance of the updated Terms.</p>
                    <p>If you are using the Service on behalf of a business or organization, you represent and warrant that you have the authority to bind that entity to these Terms.</p>
                </div>

                <div className="legal-section">
                    <h2>Use of Service</h2>
                    <p>InvoiceFlow provides an AI-powered invoice factoring platform that enables businesses to upload outstanding invoices, receive risk assessments, and obtain early funding from registered finance partners. The Service includes:</p>
                    <ul>
                        <li>Secure invoice upload and management dashboard</li>
                        <li>AI-driven risk scoring and creditworthiness assessment</li>
                        <li>Matching with registered finance partners for invoice funding</li>
                        <li>Real-time transaction tracking and reporting</li>
                        <li>Communication tools between business owners and finance partners</li>
                    </ul>
                    <p>You may use the Service only for lawful purposes and in accordance with these Terms. You agree not to use the Service in any way that could damage, disable, or impair the platform or interfere with any other party's use.</p>
                </div>

                <div className="legal-section">
                    <h2>User Responsibilities</h2>
                    <p>As a user of InvoiceFlow, you agree to the following responsibilities:</p>
                    <ul>
                        <li><strong>Accurate Information:</strong> You must provide accurate, current, and complete information during registration and for all invoices submitted through the platform.</li>
                        <li><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.</li>
                        <li><strong>Legitimate Invoices:</strong> All invoices submitted must be genuine, legally valid, and represent actual goods or services delivered. Submitting fraudulent invoices is strictly prohibited and may result in legal action.</li>
                        <li><strong>Compliance:</strong> You must comply with all applicable local, state, and national laws and regulations, including but not limited to GST regulations, income tax laws, and RBI guidelines.</li>
                        <li><strong>Timely Communication:</strong> You must respond promptly to any verification requests or communications from InvoiceFlow or finance partners related to your transactions.</li>
                    </ul>
                </div>

                <div className="legal-section">
                    <h2>Intellectual Property</h2>
                    <p>All content, features, and functionality of the InvoiceFlow platform — including but not limited to the user interface, design, logos, AI models, algorithms, text, graphics, and software — are the exclusive property of InvoiceFlow Technologies Pvt. Ltd. and are protected by intellectual property laws.</p>
                    <p>You are granted a limited, non-exclusive, non-transferable, revocable license to access and use the Service for its intended purpose. You may not:</p>
                    <ul>
                        <li>Copy, modify, distribute, or create derivative works based on our platform or any part thereof.</li>
                        <li>Reverse engineer, decompile, or disassemble any software or technology used in the Service.</li>
                        <li>Use our trademarks, logos, or branding without prior written consent.</li>
                        <li>Scrape, data-mine, or otherwise extract data from the platform through automated means.</li>
                    </ul>
                </div>

                <div className="legal-section">
                    <h2>Disclaimers & Limitation of Liability</h2>
                    <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.</p>
                    <p>InvoiceFlow does not guarantee:</p>
                    <ul>
                        <li>That the Service will be uninterrupted, error-free, or completely secure.</li>
                        <li>Approval or funding for any specific invoice submission.</li>
                        <li>The accuracy of AI risk scores — these are advisory and should not be the sole basis for financial decisions.</li>
                        <li>The performance, reliability, or solvency of any finance partner on the platform.</li>
                    </ul>
                    <p>To the maximum extent permitted by law, InvoiceFlow shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising out of or in connection with your use of the Service.</p>
                </div>

                <div className="legal-section">
                    <h2>Termination</h2>
                    <p>We reserve the right to suspend or terminate your account and access to the Service at our sole discretion, with or without notice, for conduct that we determine violates these Terms or is harmful to other users, the platform, or third parties.</p>
                    <p>You may terminate your account at any time by contacting our support team. Upon termination:</p>
                    <ul>
                        <li>All pending transactions must be settled before account closure.</li>
                        <li>Your data will be retained as required by applicable regulations (see our Privacy Policy).</li>
                        <li>Any outstanding fees or obligations owed to InvoiceFlow or finance partners remain enforceable.</li>
                        <li>Provisions of these Terms that by their nature should survive termination shall remain in effect.</li>
                    </ul>
                </div>

                <div className="legal-section">
                    <h2>Governing Law</h2>
                    <p>These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.</p>
                    <p>Any disputes arising out of or relating to these Terms or the Service shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka, India.</p>
                    <p>If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that the remaining Terms remain in full force and effect.</p>
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
