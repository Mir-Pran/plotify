import { NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validations/auth';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_CREDENTIALS, verifyPassword } from '@/lib/auth-crypto';
import { INITIAL_USERS } from '@/lib/data/store';
import { User } from '@/lib/types';
import { getServerCredentialHash, getServerUserByEmail } from '@/lib/server-auth-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Strict Zod validation
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Invalid input credentials.',
        },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase().trim();
    const password = parsed.data.password;

    // 2. Strict Administrator Authentication
    if (email === 'support@plotify.store') {
      const adminUpdatedHash = getServerCredentialHash(email);
      let isValidAdmin = false;
      if (adminUpdatedHash) {
        isValidAdmin = await verifyPassword(password, adminUpdatedHash);
      } else {
        isValidAdmin = password === 'Plotify@Support';
      }

      if (!isValidAdmin) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password.' },
          { status: 401 }
        );
      }

      const adminUser: User = {
        id: 'user-admin-01',
        email: 'support@plotify.store',
        fullName: 'Plotify Super Admin',
        mobile: '01700000000',
        role: 'admin',
        createdAt: '2026-01-01T00:00:00Z',
        isVerified: true,
      };

      return NextResponse.json({ success: true, user: adminUser });
    }

    // 3. Supabase Auth Verification
    try {
      const supabase = await createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!authError && authData.user) {
        let remoteProfile: any = null;
        try {
          const { data: supaProf } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();
          if (supaProf) remoteProfile = supaProf;
        } catch {}

        const userRole = remoteProfile?.role || authData.user.user_metadata?.role || 'personal';
        const isVerifiedStatus = remoteProfile?.is_verified === true || authData.user.user_metadata?.is_verified === true;

        const userProfile: User = {
          id: authData.user.id,
          email: authData.user.email || email,
          fullName: remoteProfile?.full_name || authData.user.user_metadata?.full_name || email.split('@')[0],
          mobile: remoteProfile?.phone || authData.user.user_metadata?.phone || '01700000000',
          role: userRole,
          accountType: userRole,
          organizationName: remoteProfile?.organization_name || remoteProfile?.business_name,
          organization_name: remoteProfile?.organization_name,
          businessName: remoteProfile?.business_name || remoteProfile?.organization_name,
          createdAt: remoteProfile?.created_at || authData.user.created_at || new Date().toISOString(),
          isVerified: isVerifiedStatus,
          verificationStatus: remoteProfile?.verification_status || authData.user.user_metadata?.verification_status || (isVerifiedStatus ? 'verified' : 'unverified'),
          upgradeStatus: remoteProfile?.upgrade_status || authData.user.user_metadata?.upgrade_status || 'none',
          nidNumber: remoteProfile?.nid_number,
          nidUrl: remoteProfile?.nid_url,
          photoUrl: remoteProfile?.photo_url,
        };

        return NextResponse.json({ success: true, user: userProfile });
      }
    } catch (supaErr) {
      console.warn('Supabase Auth error during login check:', supaErr);
    }

    // 4. Fallback Server Registry & Default Seed Credentials (Strict SHA-256 Hash Verification)
    const expectedHash = getServerCredentialHash(email) || DEFAULT_CREDENTIALS[email];
    if (expectedHash) {
      const isMatch = await verifyPassword(password, expectedHash);
      if (isMatch) {
        const matchedUser = getServerUserByEmail(email) || INITIAL_USERS.find(u => u.email.toLowerCase() === email);
        if (matchedUser) {
          return NextResponse.json({ success: true, user: matchedUser });
        }
      }
    }

    // 5. If credentials do not strictly match, ALWAYS REJECT
    return NextResponse.json(
      { success: false, error: 'Invalid email or password.' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Authentication error.' },
      { status: 500 }
    );
  }
}
