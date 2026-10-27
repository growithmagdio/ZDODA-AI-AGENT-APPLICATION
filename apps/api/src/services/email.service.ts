import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST || 'localhost';
const port = parseInt(process.env.SMTP_PORT || '1025', 10);

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: false,
  ignoreTLS: true,
});

export const emailService = {
  async sendVerificationEmail(to: string, token: string, name: string) {
    const webUrl = process.env.WEB_APP_URL || 'http://localhost:5173';
    const verifyLink = `${webUrl}/verify-email?token=${token}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #15153B; font-size: 22px;">Welcome to Zdoda, ${name}!</h2>
        <p style="color: #4A4A6A; font-size: 15px; line-height: 1.5;">Please confirm your email address to activate your account and deploy your first AI agent.</p>
        <div style="margin: 28px 0;">
          <a href="${verifyLink}" style="background-color: #6538F5; color: white; padding: 12px 24px; border-radius: 10px; font-weight: 600; text-decoration: none; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="color: #6B6B88; font-size: 13px;">If you didn't create a Zdoda account, you can safely disregard this email.</p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Zdoda AI" <noreply@zdoda.app>',
        to,
        subject: 'Verify your Zdoda account',
        html,
      });
      console.log(`[EmailService] Verification email sent to ${to}`);
    } catch (err) {
      console.warn(`[EmailService] Failed to send verification email (Mailpit offline?):`, err);
    }
  },

  async sendPasswordResetEmail(to: string, token: string) {
    const webUrl = process.env.WEB_APP_URL || 'http://localhost:5173';
    const resetLink = `${webUrl}/reset-password?token=${token}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #15153B; font-size: 22px;">Reset your Zdoda password</h2>
        <p style="color: #4A4A6A; font-size: 15px; line-height: 1.5;">You recently requested to reset your password. This link is valid for 30 minutes.</p>
        <div style="margin: 28px 0;">
          <a href="${resetLink}" style="background-color: #6538F5; color: white; padding: 12px 24px; border-radius: 10px; font-weight: 600; text-decoration: none; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #6B6B88; font-size: 13px;">If you didn't request a password reset, please ignore this email.</p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Zdoda AI" <noreply@zdoda.app>',
        to,
        subject: 'Reset your Zdoda password',
        html,
      });
      console.log(`[EmailService] Password reset email sent to ${to}`);
    } catch (err) {
      console.warn(`[EmailService] Failed to send reset email:`, err);
    }
  },
};
