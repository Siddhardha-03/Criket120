const nodemailer = require('nodemailer');
const path = require('path');
const ejs = require('ejs');
const { v4: uuidv4 } = require('uuid');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendVerificationEmail(user, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const templatePath = path.join(__dirname, '../templates/verification-email.ejs');
    
    const html = await ejs.renderFile(templatePath, {
      username: user.email.split('@')[0],
      verificationUrl,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@cricket120.com',
    });

    await this.sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address',
      html,
    });
  }

  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const templatePath = path.join(__dirname, '../templates/reset-password-email.ejs');
    
    const html = await ejs.renderFile(templatePath, {
      username: user.email.split('@')[0],
      resetUrl,
      expiryHours: 1, // Link expires in 1 hour
    });

    await this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html,
    });
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      await this.transporter.sendMail({
        from: `"Cricket120" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text: text || html.replace(/<[^>]*>?/gm, ''), // Fallback text version
        html,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }
}

module.exports = new EmailService();
