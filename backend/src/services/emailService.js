'use strict';

let ResendClient = null;
try {
  const { Resend } = require('resend');
  ResendClient = Resend;
} catch {
  // Resend optional fallback
}

/**
 * Generate responsive HTML email template for password reset
 */
function buildPasswordResetHtml({ recipientName, resetUrl, expiresInMinutes = 60 }) {
  const name = recipientName ? recipientName.split(' ')[0] : 'there';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your CareerLens Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F3F2EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #181818; line-height: 1.5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F3F2EF; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 540px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #E0DFDC; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0A66C2; padding: 24px 32px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: #ffffff; color: #0A66C2; font-weight: 900; font-size: 16px; width: 32px; height: 32px; line-height: 32px; text-align: center; border-radius: 6px; margin-right: 8px;">CL</span>
                    <span style="color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.3px; vertical-align: middle;">CareerLens</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body Content -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: rgba(0,0,0,0.9); line-height: 1.3;">
                Reset your password
              </h1>
              
              <p style="margin: 0 0 16px 0; font-size: 15px; color: rgba(0,0,0,0.7); line-height: 1.5;">
                Hi ${name},
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 15px; color: rgba(0,0,0,0.7); line-height: 1.5;">
                We received a request to reset the password for your CareerLens account. Click the button below to choose a new password:
              </p>

              <!-- Reset Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; background-color: #0A66C2; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 28px; box-shadow: 0 2px 4px rgba(10,102,194,0.3); letter-spacing: 0.2px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px; font-size: 13px; color: #475569;">
                <strong style="color: #1E293B;">Security Note:</strong> This reset link is single-use and will automatically expire in <strong>${expiresInMinutes} minutes</strong>.
              </div>

              <p style="margin: 0 0 12px 0; font-size: 13px; color: rgba(0,0,0,0.6); line-height: 1.5;">
                If the button above does not work, copy and paste this link into your browser:
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 12px; color: #0A66C2; word-break: break-all; line-height: 1.4;">
                <a href="${resetUrl}" style="color: #0A66C2; text-decoration: underline;">${resetUrl}</a>
              </p>

              <hr style="border: 0; border-top: 1px solid #E0DFDC; margin: 24px 0;" />

              <p style="margin: 0; font-size: 13px; color: rgba(0,0,0,0.5); line-height: 1.4;">
                If you didn't request a password reset, you can safely ignore this email — your account and password remain secure.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 16px 32px; border-top: 1px solid #E0DFDC; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: rgba(0,0,0,0.45);">
                &copy; ${new Date().getFullYear()} CareerLens. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Send Password Reset Email via Resend or dev console fallback
 *
 * @param {Object} options
 * @param {string} options.toEmail - Recipient email address
 * @param {string} [options.recipientName] - Recipient name
 * @param {string} options.resetUrl - Full password reset URL
 * @param {number} [options.expiresInMinutes=60] - Token expiration duration
 */
async function sendPasswordResetEmail({ toEmail, recipientName, resetUrl, expiresInMinutes = 60 }) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'CareerLens <onboarding@resend.dev>';
  const subject = 'Reset your CareerLens password';
  const html = buildPasswordResetHtml({ recipientName, resetUrl, expiresInMinutes });

  if (apiKey && ResendClient) {
    try {
      const resend = new ResendClient(apiKey);
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [toEmail],
        subject,
        html,
      });

      if (error) {
        console.error('[EmailService] Resend delivery error:', error);
        return { success: false, error: error.message };
      }

      console.log(`[EmailService] Password reset email sent via Resend to ${toEmail} (ID: ${data?.id})`);
      return { success: true, messageId: data?.id };
    } catch (err) {
      console.error('[EmailService] Exception while sending email with Resend:', err.message);
      return { success: false, error: err.message };
    }
  }

  // Fallback for development & test environments without active API keys
  console.log('════════════════════════════════════════════════════════════════');
  console.log(' [DEV / MOCK EMAIL] Password Reset Email Dispatched');
  console.log(` To      : ${toEmail}`);
  console.log(` Subject : ${subject}`);
  console.log(` Link    : ${resetUrl}`);
  console.log('════════════════════════════════════════════════════════════════');

  return { success: true, isMock: true };
}

module.exports = {
  sendPasswordResetEmail,
  buildPasswordResetHtml,
};
