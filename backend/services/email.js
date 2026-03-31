const nodemailer = require('nodemailer');

// ─── Setup Nodemailer Transporter ─────────────────────────────────────────────
// In development: auto-creates an Ethereal test account (no real email needed)
// In production: uses Gmail SMTP from .env
const createTransporter = async () => {
  if (process.env.NODE_ENV !== 'production') {
    // Auto-create a free Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    console.log('📧 Ethereal test account created:');
    console.log('   User:', testAccount.user);
    console.log('   Pass:', testAccount.pass);

    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // Production: use real Gmail SMTP from .env
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send email using Nodemailer
 * @param {Object} options - { to, subject, html }
 * @returns {Object} - Nodemailer send result
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: '"InvoiceFlow" <noreply@invoiceflow.dev>',
      to,
      subject,
      html,
    };

    const result = await transporter.sendMail(mailOptions);

    // In development, log the Ethereal preview URL so you can view the email
    const previewUrl = nodemailer.getTestMessageUrl(result);
    if (previewUrl) {
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📬 OTP EMAIL PREVIEW (Ethereal Test Inbox):');
      console.log('   ' + previewUrl);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
    } else {
      console.log(`📧 Email sent to ${to} | MessageID: ${result.messageId}`);
    }

    return result;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw error;
  }
};

/**
 * Send welcome email to new user
 */
const sendWelcomeEmail = async (user) => {
  const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #6C63FF;">Welcome to InvoiceFlow! 🎉</h2>
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>Your account has been created successfully as a <strong>${user.role}</strong>.</p>
            <p>You can now log in and start using our B2B Invoice Factoring platform.</p>
            <hr />
            <p style="color: #888; font-size: 12px;">— The InvoiceFlow Team</p>
        </div>
    `;

  return sendEmail({
    to: user.email,
    subject: 'Welcome to InvoiceFlow',
    html,
  });
};

/**
 * Send invoice status update email
 */
const sendInvoiceStatusEmail = async (user, invoice, status) => {
  const statusColors = {
    approved: '#28a745',
    rejected: '#dc3545',
    funded: '#17a2b8',
    review: '#ffc107',
  };

  const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #6C63FF;">Invoice Status Update</h2>
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>Your invoice <strong>#${invoice.invoiceNumber}</strong> has been updated:</p>
            <p style="font-size: 18px;">
                Status: <span style="color: ${statusColors[status] || '#333'}; font-weight: bold;">
                    ${status.toUpperCase()}
                </span>
            </p>
            ${invoice.rejectionReason ? `<p><strong>Reason:</strong> ${invoice.rejectionReason}</p>` : ''}
            <hr />
            <p style="color: #888; font-size: 12px;">— The InvoiceFlow Team</p>
        </div>
    `;

  return sendEmail({
    to: user.email,
    subject: `Invoice #${invoice.invoiceNumber} — ${status.toUpperCase()}`,
    html,
  });
};

module.exports = { sendEmail, sendWelcomeEmail, sendInvoiceStatusEmail };
