import { NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validations/auth';
import { createClient } from '@/lib/supabase/server';
import { hashPassword } from '@/lib/auth-crypto';
import { User } from '@/lib/types';
import { saveServerUser } from '@/lib/server-auth-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Strict Zod validation
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Invalid registration data.',
        },
        { status: 400 }
      );
    }

    const { fullName, email, mobile, password, accountType, organizationName } = parsed.data;

    let userId = `user-${Date.now()}`;

    // 2. Try Supabase Auth Registration
    try {
      const supabase = await createClient();
      const { data: supaData, error: supaError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: mobile,
            role: accountType,
            organization_name: organizationName || null,
            business_name: organizationName || null,
            is_verified: false,
            verification_status: accountType === 'business' ? 'pending' : 'unverified',
          },
        },
      });

      if (!supaError && supaData.user?.id) {
        userId = supaData.user.id;
      }

      // Upsert profile in Supabase table
      await supabase.from('profiles').upsert({
        id: userId,
        email,
        full_name: fullName,
        phone: mobile,
        role: accountType,
        organization_name: organizationName || null,
        business_name: organizationName || null,
        is_verified: false,
        verification_status: accountType === 'business' ? 'pending' : 'unverified',
        upgrade_status: accountType === 'business' ? 'pending_approval' : 'none',
        updated_at: new Date().toISOString(),
      });
    } catch (supaErr) {
      console.warn('Supabase Auth error during registration:', supaErr);
    }

    // 3. Compute secure password hash
    const passwordHash = await hashPassword(password);

    const newUser: User = {
      id: userId,
      email,
      fullName,
      mobile,
      role: accountType,
      accountType,
      organizationName: organizationName || undefined,
      organization_name: organizationName || undefined,
      businessName: organizationName || undefined,
      upgradeStatus: accountType === 'business' ? 'pending_approval' : 'none',
      verificationStatus: accountType === 'business' ? 'pending' : 'unverified',
      createdAt: new Date().toISOString(),
      isVerified: false,
    };

    // 4. Save to server store
    saveServerUser(newUser, passwordHash);

    return NextResponse.json({
      success: true,
      user: newUser,
      passwordHash,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Registration processing error.' },
      { status: 500 }
    );
  }
}
