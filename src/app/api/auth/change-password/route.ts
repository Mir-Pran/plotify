import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hashPasswordBcrypt, verifyPassword, DEFAULT_CREDENTIALS } from '@/lib/auth-crypto';
import { getServerCredentialHash, updateServerCredential } from '@/lib/server-auth-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword, confirmNewPassword } = body;
    let email = (body.email || '').toLowerCase().trim();

    // 1. Validate inputs
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password, new password, and confirmation are required.' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmNewPassword) {
      return NextResponse.json(
        { success: false, error: 'New password and confirm password do not match.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, error: 'New password must be different from current password.' },
        { status: 400 }
      );
    }

    // 2. Identify user from Supabase session if email not provided
    const supabase = await createClient();
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.email && !email) {
        email = authData.user.email.toLowerCase().trim();
      }
    } catch {
      // Supabase session check optional
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'User email is required or user is not signed in.' },
        { status: 401 }
      );
    }

    // 3. Verify current password
    let isCurrentPasswordValid = false;

    // A) Admin Account verification
    if (email === 'support@plotify.store') {
      const adminUpdatedHash = getServerCredentialHash(email);
      if (adminUpdatedHash) {
        isCurrentPasswordValid = await verifyPassword(currentPassword, adminUpdatedHash);
      } else {
        isCurrentPasswordValid = currentPassword === 'Plotify@Support';
      }
    }

    // B) Supabase Auth verification
    if (!isCurrentPasswordValid) {
      try {
        const { data: supaSignData, error: supaSignError } = await supabase.auth.signInWithPassword({
          email,
          password: currentPassword,
        });
        if (!supaSignError && supaSignData?.user) {
          isCurrentPasswordValid = true;
        }
      } catch (err) {
        console.warn('[Change Password] Supabase sign-in check warning:', err);
      }
    }

    // C) Server Auth Store / Seed Registry verification
    if (!isCurrentPasswordValid) {
      const expectedHash = getServerCredentialHash(email) || DEFAULT_CREDENTIALS[email];
      if (expectedHash) {
        isCurrentPasswordValid = await verifyPassword(currentPassword, expectedHash);
      }
    }

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect.' },
        { status: 400 }
      );
    }

    // 4. Hash the new password securely using bcrypt
    const newPasswordHash = await hashPasswordBcrypt(newPassword);

    // 5. Update password in database
    // A) Supabase Auth password update
    try {
      await supabase.auth.updateUser({ password: newPassword });
    } catch (supaUpdateErr) {
      console.warn('[Change Password] Supabase auth.updateUser warning:', supaUpdateErr);
    }

    // B) Supabase profiles table update
    try {
      await supabase
        .from('profiles')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('email', email);
    } catch (dbErr) {
      console.warn('[Change Password] Supabase profiles update warning:', dbErr);
    }

    // C) Server Auth Store registry update
    updateServerCredential(email, newPasswordHash);

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully.',
      passwordHash: newPasswordHash,
    });
  } catch (error: any) {
    console.error('[Change Password] Server error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update password.' },
      { status: 500 }
    );
  }
}
