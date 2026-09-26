import { NextResponse } from 'next/server';
import { resetPasswordSchema } from '@/lib/validations/auth';
import { createClient } from '@/lib/supabase/server';
import { hashPasswordBcrypt } from '@/lib/auth-crypto';
import {
  verifyPasswordResetToken,
  consumePasswordResetToken,
  updateServerCredential,
} from '@/lib/server-auth-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Reset token is missing.' },
        { status: 400 }
      );
    }

    const verification = verifyPasswordResetToken(token);
    if (!verification.valid) {
      return NextResponse.json(
        { valid: false, error: verification.error || 'Invalid or expired reset link.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: verification.email,
    });
  } catch (error: any) {
    return NextResponse.json(
      { valid: false, error: error.message || 'Error validating token.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Zod validation
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Invalid password reset data.',
        },
        { status: 400 }
      );
    }

    const { token, newPassword } = parsed.data;

    // 2. Verify token validity and expiration
    const verification = verifyPasswordResetToken(token);
    if (!verification.valid || !verification.email) {
      return NextResponse.json(
        {
          success: false,
          error: verification.error || 'Password reset link is invalid or has expired. Please request a new one.',
        },
        { status: 400 }
      );
    }

    const email = verification.email.toLowerCase().trim();

    // 3. Hash the new password securely using bcrypt
    const passwordHash = await hashPasswordBcrypt(newPassword);

    // 4. Update password in Supabase if user exists there
    try {
      const supabase = await createClient();
      await supabase.auth.updateUser({ password: newPassword });
      await supabase
        .from('profiles')
        .update({
          reset_token: null,
          reset_token_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('email', email);
    } catch (supaErr) {
      console.warn('[Reset Password] Supabase update notice:', supaErr);
    }

    // 5. Update password in Server Auth Store & seed registry
    updateServerCredential(email, passwordHash);

    // 6. Invalidate/consume the token so it cannot be used again
    consumePasswordResetToken(token);

    console.log(`[Reset Password] Password successfully reset for ${email}. Token consumed.`);

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully! You can now log in with your new password.',
    });
  } catch (error: any) {
    console.error('[Reset Password] Server error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reset password.' },
      { status: 500 }
    );
  }
}
