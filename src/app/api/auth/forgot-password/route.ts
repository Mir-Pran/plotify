import { NextResponse } from 'next/server';
import { forgotPasswordSchema } from '@/lib/validations/auth';
import { createClient } from '@/lib/supabase/server';
import {
  getServerUserByEmail,
  getServerCredentialHash,
  createPasswordResetToken,
} from '@/lib/server-auth-store';
import { INITIAL_USERS } from '@/lib/data/store';
import { DEFAULT_CREDENTIALS } from '@/lib/auth-crypto';
import { sendPasswordResetEmail } from '@/lib/email-service';

// Helper to resolve the correct live or local domain for the password reset URL
function resolveBaseUrl(request: Request, clientOrigin?: string): { baseUrl: string; originSource: string } {
  // 1. Client origin passed directly from frontend window.location.origin
  if (clientOrigin && typeof clientOrigin === 'string' && clientOrigin.startsWith('http')) {
    return {
      baseUrl: clientOrigin.replace(/\/+$/, ''),
      originSource: 'client-window-origin',
    };
  }

  // 2. Explicit Environment Variables (Production & Live URLs)
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    process.env.SITE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    const trimmed = envUrl.trim();
    const formatted = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    return {
      baseUrl: formatted.replace(/\/+$/, ''),
      originSource: 'environment-variable',
    };
  }

  // 3. Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return {
      baseUrl: `https://${process.env.VERCEL_URL}`.replace(/\/+$/, ''),
      originSource: 'vercel-url',
    };
  }

  // 4. Request Origin Header
  const reqOrigin = request.headers.get('origin');
  if (reqOrigin && reqOrigin.startsWith('http')) {
    return {
      baseUrl: reqOrigin.replace(/\/+$/, ''),
      originSource: 'request-origin-header',
    };
  }

  // 5. Reverse proxy / forwarded headers (x-forwarded-host & x-forwarded-proto)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    return {
      baseUrl: `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, ''),
      originSource: 'x-forwarded-host',
    };
  }

  // 6. Referer header
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const parsedReferer = new URL(referer);
      return {
        baseUrl: parsedReferer.origin.replace(/\/+$/, ''),
        originSource: 'request-referer-header',
      };
    } catch {
      // ignore malformed referer
    }
  }

  // 7. Host header
  const host = request.headers.get('host');
  if (host) {
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const proto = isLocal ? 'http' : 'https';
    return {
      baseUrl: `${proto}://${host}`.replace(/\/+$/, ''),
      originSource: 'request-host-header',
    };
  }

  // 8. Default fallback
  return {
    baseUrl: 'http://localhost:3000',
    originSource: 'default-fallback',
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Zod validation
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Please provide a valid email address.',
        },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase().trim();

    // 2. Check if user exists in the database
    let userExists = false;
    let userName = '';

    // Check A: Admin Account
    if (email === 'support@plotify.store') {
      userExists = true;
      userName = 'Plotify Administrator';
    }

    // Check B: Server Auth Store & Seed Users
    if (!userExists) {
      const serverUser = getServerUserByEmail(email);
      if (serverUser) {
        userExists = true;
        userName = serverUser.fullName;
      }
    }

    if (!userExists) {
      const seedUser = INITIAL_USERS.find(u => u.email.toLowerCase() === email);
      if (seedUser) {
        userExists = true;
        userName = seedUser.fullName;
      }
    }

    if (!userExists && (DEFAULT_CREDENTIALS[email] || getServerCredentialHash(email))) {
      userExists = true;
      userName = email.split('@')[0];
    }

    // Check C: Supabase database
    let supabaseClient: any = null;
    try {
      supabaseClient = await createClient();
      const { data: supaProfile } = await supabaseClient
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', email)
        .maybeSingle();

      if (supaProfile) {
        userExists = true;
        userName = supaProfile.full_name || userName || email.split('@')[0];
      }
    } catch (supaErr) {
      console.warn('[Forgot Password] Supabase query note:', supaErr);
    }

    // If user does not exist in any database
    if (!userExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'No account found with this email address. Please check your spelling or create an account.',
        },
        { status: 404 }
      );
    }

    // 3. Generate secure, time-limited reset token (valid for 60 minutes)
    const { token, expiresAt } = createPasswordResetToken(email, 60);

    // Save token in Supabase profiles table if possible
    if (supabaseClient) {
      try {
        await supabaseClient
          .from('profiles')
          .update({
            reset_token: token,
            reset_token_expires_at: new Date(expiresAt).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('email', email);
      } catch {
        // Optional column in Supabase
      }
    }

    // 4. Construct reset password link with robust domain resolution
    const { baseUrl, originSource } = resolveBaseUrl(request, parsed.data.origin);
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    console.log(`[Forgot Password] 🌐 Resolved Domain [Source: ${originSource}]: ${baseUrl}`);
    console.log(`[Forgot Password] 🔑 Generated reset token for ${email}. Reset URL: ${resetUrl}`);

    // 5. Send password reset email via Nodemailer with try-catch & error inspection
    let emailResult;
    try {
      emailResult = await sendPasswordResetEmail({
        to: email,
        name: userName,
        resetUrl,
      });
    } catch (unexpectedEmailErr: any) {
      console.error('====================================================');
      console.error(`[Forgot Password] ❌ Unexpected error executing sendPasswordResetEmail for ${email}:`);
      console.error(unexpectedEmailErr);
      console.error('====================================================');
      emailResult = {
        success: false,
        error: unexpectedEmailErr?.message || 'Unexpected email transmission failure',
      };
    }

    // If email sending failed, return error to client and log details
    if (!emailResult.success) {
      console.error(`[Forgot Password] ❌ Failed to dispatch password reset email to ${email}. Reason: ${emailResult.error}`);

      return NextResponse.json(
        {
          success: false,
          error: `Could not send reset email (${emailResult.error}). Please check your mail server configuration or server terminal logs.`,
          debugResetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset link sent! Please check your email inbox and spam folder for instructions.',
      previewUrl: emailResult.previewUrl,
      resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined,
    });
  } catch (error: any) {
    console.error('====================================================');
    console.error('[Forgot Password] ❌ Critical Server Error:', error);
    console.error('====================================================');
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred while processing your request.' },
      { status: 500 }
    );
  }
}
