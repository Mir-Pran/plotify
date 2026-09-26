import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import fs from 'fs';
import path from 'path';

interface SendPasswordResetEmailParams {
  to: string;
  name?: string;
  resetUrl: string;
}

let cachedTransporter: Transporter | null = null;
let cachedCredentialsHash = '';
let cachedIsTest = false;

// Helper to safely read environment variables, with dynamic .env.local fallback
function getEnvVar(key: string): string {
  if (process.env[key] && process.env[key]!.trim()) {
    return process.env[key]!.trim();
  }

  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
        const [k, ...rest] = trimmed.split('=');
        if (k.trim() === key) {
          const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
          if (val) return val;
        }
      }
    }
  } catch {
    // fallback
  }

  return '';
}

function formatFromAddress(fromOverride: string | undefined, authEmail: string | undefined): string {
  // If an explicit EMAIL_FROM / SMTP_FROM is set, use it
  if (fromOverride && fromOverride.trim()) {
    const trimmed = fromOverride.trim();
    if (trimmed.includes('<') && trimmed.includes('>')) {
      return trimmed;
    }
    return `"Plotify" <${trimmed}>`;
  }

  // If we have an authenticated email address (e.g., process.env.EMAIL_USER or process.env.SMTP_USER), use it
  if (authEmail && authEmail.trim()) {
    return `"Plotify" <${authEmail.trim()}>`;
  }

  // Fallback default
  return '"Plotify Bangladesh" <support@plotify.store>';
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: SendPasswordResetEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  simulated?: boolean;
  error?: string;
  errorCode?: string;
}> {
  // 1. Resolve Authenticated Credentials from process.env or .env.local
  const authUser = (
    getEnvVar('EMAIL_USER') ||
    getEnvVar('SMTP_USER') ||
    getEnvVar('EMAIL_SERVER_USER') ||
    ''
  ).trim();

  let authPass = (
    getEnvVar('EMAIL_PASS') ||
    getEnvVar('EMAIL_PASSWORD') ||
    getEnvVar('SMTP_PASS') ||
    getEnvVar('EMAIL_SERVER_PASSWORD') ||
    ''
  ).trim();

  // If user pasted a 16-character Google App Password with spaces (e.g. "abcd efgh ijkl mnop"), strip inner spaces
  if (authPass && authUser.toLowerCase().includes('gmail.com') && authPass.includes(' ')) {
    authPass = authPass.replace(/\s+/g, '');
  }

  // 2. Resolve Host, Port, and Service
  const rawHost = (getEnvVar('SMTP_HOST') || getEnvVar('EMAIL_HOST') || '').trim();
  const isGmail =
    getEnvVar('EMAIL_SERVICE').toLowerCase() === 'gmail' ||
    rawHost.toLowerCase().includes('gmail') ||
    authUser.toLowerCase().endsWith('@gmail.com');

  const smtpHost = rawHost || (isGmail ? 'smtp.gmail.com' : undefined);
  const rawPort = (getEnvVar('SMTP_PORT') || getEnvVar('EMAIL_PORT') || '').trim();
  const smtpPort = rawPort ? parseInt(rawPort, 10) : (isGmail ? 465 : 587);
  const isSecure = getEnvVar('SMTP_SECURE') === 'true' || smtpPort === 465;

  // 3. Resolve From Address using authenticated user email
  const rawFrom = getEnvVar('EMAIL_FROM') || getEnvVar('SMTP_FROM');
  const fromAddress = formatFromAddress(rawFrom, authUser);

  let transporter: Transporter;
  let isTest = false;

  const currentCredentialsHash = `${authUser}:${authPass}:${smtpHost}:${smtpPort}:${isSecure}`;

  // 4. Initialize or retrieve cached transporter
  try {
    if (authUser && authPass) {
      if (!cachedTransporter || cachedIsTest || cachedCredentialsHash !== currentCredentialsHash) {
        console.log(`[Email Service] 🔧 Initializing Authenticated Transporter (${isGmail && !rawHost ? 'service: gmail' : `${smtpHost}:${smtpPort}`}, user: ${authUser})...`);
        
        if (isGmail && !rawHost) {
          cachedTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: authUser,
              pass: authPass,
            },
          });
        } else {
          cachedTransporter = nodemailer.createTransport({
            host: smtpHost || 'smtp.gmail.com',
            port: smtpPort,
            secure: isSecure,
            auth: {
              user: authUser,
              pass: authPass,
            },
            connectionTimeout: 15000,
            greetingTimeout: 10000,
            socketTimeout: 20000,
          });
        }

        cachedCredentialsHash = currentCredentialsHash;
        cachedIsTest = false;
      }
      transporter = cachedTransporter;
    } else {
      isTest = true;
      if (!cachedTransporter || !cachedIsTest) {
        try {
          console.log('[Email Service] ℹ️ No custom EMAIL_USER or SMTP_USER configured in .env. Creating Ethereal test mailer...');
          const testAccount = await nodemailer.createTestAccount();
          cachedTransporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          });
          cachedIsTest = true;
          console.log(`[Email Service] ✅ Ethereal test transporter ready (User: ${testAccount.user})`);
        } catch (etherealErr: any) {
          console.warn('[Email Service] ⚠️ Ethereal account creation failed, falling back to JSON transport:', etherealErr?.message);
          cachedTransporter = nodemailer.createTransport({
            jsonTransport: true,
          });
          cachedIsTest = true;
        }
      }
      transporter = cachedTransporter;
    }
  } catch (initErr: any) {
    console.error('====================================================');
    console.error('[Email Service] ❌ Transporter Initialization Failed!');
    console.error(`- Error: ${initErr?.message || initErr}`);
    console.error('====================================================');
    return {
      success: false,
      error: `Failed to initialize email transporter: ${initErr?.message || 'Configuration error'}`,
      errorCode: initErr?.code || 'INIT_ERROR',
    };
  }

  // 5. Prepare Email Body
  const greeting = name ? `Hello ${name},` : 'Hello,';
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset your Plotify password</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
        .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #0f172a; padding: 32px 24px; text-align: center; }
        .logo { font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; }
        .logo span { color: #10b981; }
        .badge { display: inline-block; background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; margin-top: 6px; }
        .body { padding: 36px 30px; }
        .h1 { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
        .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
        .btn-container { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background-color: #0f172a; color: #ffffff !important; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 12px; text-decoration: none; transition: background 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .note { font-size: 12px; color: #64748b; line-height: 1.5; padding: 16px; background-color: #f1f5f9; border-radius: 12px; margin-top: 24px; word-break: break-all; }
        .footer { padding: 24px 30px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; background: #fafafa; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Plotify<span>.</span></div>
          <div class="badge">Security Notification</div>
        </div>
        <div class="body">
          <h1 class="h1">Reset Your Password</h1>
          <p class="text">${greeting}</p>
          <p class="text">We received a request to reset the password for your Plotify account (<strong>${to}</strong>).</p>
          <p class="text">Click the button below to set a new password. For your security, this link is valid for <strong>1 hour</strong>.</p>
          <div class="btn-container">
            <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
          </div>
          <div class="note">
            <strong>Button not working?</strong> Copy and paste this URL into your browser:<br/>
            <a href="${resetUrl}" style="color: #0d9488; text-decoration: underline;">${resetUrl}</a>
          </div>
          <p class="text" style="font-size: 12px; color: #64748b; margin-top: 24px;">If you did not request a password reset, you can safely ignore this email. Your account remains completely secure.</p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Plotify Bangladesh. All rights reserved.<br/>
          Dhaka, Bangladesh · Bangladesh's trusted real estate marketplace
        </div>
      </div>
    </body>
    </html>
  `;

  // 6. Send Email with dedicated try-catch and diagnostic logging
  try {
    console.log(`[Email Service] 📤 Sending password reset email to: ${to}...`);
    console.log(`[Email Service] 👤 From: ${fromAddress}`);
    console.log(`[Email Service] 🔑 Reset Link: ${resetUrl}`);

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject: 'Reset your Plotify account password',
      text: `Hello,\n\nWe received a request to reset your Plotify password.\n\nPlease visit this link to set a new password:\n${resetUrl}\n\nThis link is valid for 1 hour.\n\nIf you did not request this, please ignore this email.`,
      html: htmlContent,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    console.log(`[Email Service] ✅ Email transmission succeeded! MessageId: ${info.messageId}`);
    if (previewUrl) {
      console.log(`[Email Service] 🔗 Development Preview URL: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
      simulated: isTest,
    };
  } catch (sendError: any) {
    // Invalidate cached transporter on auth or socket failure so future attempts re-connect
    if (sendError?.code === 'EAUTH' || sendError?.code === 'ESOCKET' || sendError?.code === 'ECONNRESET') {
      cachedTransporter = null;
      cachedCredentialsHash = '';
    }

    console.error('====================================================');
    console.error('[Email Service] ❌ Nodemailer sendMail Transmission Failed!');
    console.error(`- Recipient: ${to}`);
    console.error(`- Sender (From): ${fromAddress}`);
    console.error(`- Error Code: ${sendError?.code || 'NO_CODE'}`);
    console.error(`- Error Message: ${sendError?.message || sendError}`);
    if (sendError?.response) console.error(`- SMTP Response: ${sendError.response}`);
    if (sendError?.responseCode) console.error(`- SMTP Response Code: ${sendError.responseCode}`);
    if (sendError?.command) console.error(`- Failed SMTP Command: ${sendError.command}`);

    // Provide friendly diagnostic guidance in console
    if (sendError?.code === 'EAUTH') {
      console.error(`💡 Diagnostic Hint: Authentication failed for "${authUser}". Verify EMAIL_USER and EMAIL_PASS in your .env or .env.local file. If using Gmail, make sure to generate an App Password (16 characters, 2-Step Verification required) at https://myaccount.google.com/apppasswords`);
    } else if (sendError?.code === 'ETIMEDOUT' || sendError?.code === 'ECONNREFUSED' || sendError?.code === 'ENOTFOUND') {
      console.error(`💡 Diagnostic Hint: Connection to ${smtpHost}:${smtpPort} failed or timed out. Check SMTP_HOST, SMTP_PORT, and network connectivity.`);
    }

    if (sendError?.stack) {
      console.error(`- Stack Trace:\n${sendError.stack}`);
    }
    console.error('====================================================');

    return {
      success: false,
      error: sendError?.message || 'Failed to transmit reset email via email transporter.',
      errorCode: sendError?.code,
    };
  }
}
