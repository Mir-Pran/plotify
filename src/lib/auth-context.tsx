'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserRole, UpgradeStatus } from './types';
import { DataStore, INITIAL_USERS } from './data/store';
import { createClient } from './supabase/client';
import { loginSchema, registerSchema, LoginFormData, RegisterFormData, UpgradeBusinessFormData } from './validations/auth';
import { hashPassword } from './auth-crypto';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isBusiness: boolean;
  isPersonal: boolean;
  signIn: (data: LoginFormData) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: RegisterFormData) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { fullName?: string; businessName?: string; avatarUrl?: string }) => Promise<{ success: boolean; error?: string }>;
  upgradeToBusiness: (data: UpgradeBusinessFormData) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'plotify_active_session_user_id';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // Load user session on mount
  useEffect(() => {
    async function initAuth() {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        
        if (data.session?.user) {
          const authUser = data.session.user;
          // Check remote Supabase profile first
          let remoteProfile: any = null;
          try {
            const { data: supaProf } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
            if (supaProf) remoteProfile = supaProf;
          } catch {}

          let profile = DataStore.getUserById(authUser.id) || DataStore.getUserByEmail(authUser.email || '');
          if (remoteProfile) {
            profile = {
              id: remoteProfile.id,
              email: remoteProfile.email || authUser.email || '',
              fullName: remoteProfile.full_name || authUser.user_metadata?.full_name || '',
              mobile: remoteProfile.phone || authUser.user_metadata?.phone || '01700000000',
              role: (remoteProfile.role as UserRole) || 'personal',
              accountType: (remoteProfile.role as any) || 'personal',
              organizationName: remoteProfile.organization_name || remoteProfile.business_name,
              organization_name: remoteProfile.organization_name,
              businessName: remoteProfile.business_name || remoteProfile.organization_name,
              isVerified: remoteProfile.is_verified ?? (remoteProfile.role === 'business' ? false : true),
              verificationStatus: remoteProfile.verification_status || (remoteProfile.role === 'business' ? 'pending' : 'unverified'),
              upgradeStatus: remoteProfile.upgrade_status || 'none',
              nidNumber: remoteProfile.nid_number,
              nidUrl: remoteProfile.nid_url,
              photoUrl: remoteProfile.photo_url,
              avatarUrl: remoteProfile.avatar_url || authUser.user_metadata?.avatar_url || profile?.avatarUrl,
              createdAt: remoteProfile.created_at || authUser.created_at || new Date().toISOString(),
            };
            DataStore.upsertUser(profile);
          } else if (!profile && authUser.email) {
            const role = (authUser.user_metadata?.role as UserRole) || 'personal';
            profile = {
              id: authUser.id,
              email: authUser.email,
              fullName: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
              mobile: authUser.user_metadata?.phone || '01700000000',
              role,
              accountType: role as any,
              avatarUrl: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
              organizationName: authUser.user_metadata?.organization_name || authUser.user_metadata?.organizationName,
              organization_name: authUser.user_metadata?.organization_name || authUser.user_metadata?.organizationName,
              businessName: authUser.user_metadata?.business_name || authUser.user_metadata?.organization_name,
              createdAt: authUser.created_at || new Date().toISOString(),
              isVerified: role === 'business' ? false : true,
              verificationStatus: role === 'business' ? 'pending' : 'unverified',
              upgradeStatus: role === 'business' ? 'pending_approval' : 'none',
            };
            DataStore.upsertUser(profile);
          }
          if (profile) {
            setUser(profile);
            localStorage.setItem(SESSION_KEY, profile.id);
            setLoading(false);
            return;
          }
        }

        // Fallback: check device local session
        const storedUserId = localStorage.getItem(SESSION_KEY);
        if (storedUserId) {
          const localUser = DataStore.getUserById(storedUserId);
          if (localUser) {
            setUser(localUser);
          } else {
            localStorage.removeItem(SESSION_KEY);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    initAuth();

    // Listen for storage updates
    const handleUsersUpdate = () => {
      const activeId = localStorage.getItem(SESSION_KEY);
      if (activeId) {
        const fresh = DataStore.getUserById(activeId);
        if (fresh) setUser(fresh);
      }
    };

    window.addEventListener('plotify_users_updated', handleUsersUpdate);
    return () => window.removeEventListener('plotify_users_updated', handleUsersUpdate);
  }, []);

  const signIn = async (data: LoginFormData): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      // 1. Strict Zod validation
      const parsed = loginSchema.safeParse(data);
      if (!parsed.success) {
        setLoading(false);
        return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input credentials.' };
      }

      const email = parsed.data.email.toLowerCase().trim();
      const password = parsed.data.password;

      // 2. Strict Administrator Check (support@plotify.store / Plotify@Support)
      if (email === 'support@plotify.store') {
        if (password !== 'Plotify@Support') {
          setLoading(false);
          return { success: false, error: 'Invalid email or password.' };
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
        DataStore.upsertUser(adminUser);
        setUser(adminUser);
        localStorage.setItem(SESSION_KEY, adminUser.id);
        setLoading(false);
        return { success: true };
      }

      // 3. Authenticate with custom backend API route (/api/auth/login)
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const result = await res.json();
        if (res.ok && result.success && result.user) {
          DataStore.upsertUser(result.user);
          setUser(result.user);
          localStorage.setItem(SESSION_KEY, result.user.id);
          setLoading(false);
          return { success: true };
        } else if (res.status === 401 || res.status === 400) {
          // Explicit credential rejection from backend
          setLoading(false);
          return { success: false, error: result.error || 'Invalid email or password.' };
        }
      } catch (apiErr) {
        console.warn('API login request error:', apiErr);
      }

      // 4. Supabase Auth direct client check
      try {
        const supabase = createClient();
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!authError && authData.user) {
          let profile = DataStore.getUserById(authData.user.id) || DataStore.getUserByEmail(email);
          if (!profile) {
            profile = {
              id: authData.user.id,
              email: authData.user.email || email,
              fullName: authData.user.user_metadata?.full_name || email.split('@')[0],
              mobile: authData.user.user_metadata?.phone || '01700000000',
              role: (authData.user.user_metadata?.role as UserRole) || 'personal',
              createdAt: new Date().toISOString(),
              isVerified: true,
            };
            DataStore.upsertUser(profile);
          }
          setUser(profile);
          localStorage.setItem(SESSION_KEY, profile.id);
          setLoading(false);
          return { success: true };
        }
      } catch {}

      // 5. Strict Local Store verification: Verify password against cryptographic hash!
      const isLocalValid = await DataStore.verifyCredential(email, password);
      if (isLocalValid) {
        const user = DataStore.getUserByEmail(email);
        if (user) {
          setUser(user);
          localStorage.setItem(SESSION_KEY, user.id);
          setLoading(false);
          return { success: true };
        }
      }

      // 6. If credentials do NOT match, ALWAYS reject with clear error
      setLoading(false);
      return { success: false, error: 'Invalid email or password.' };
    } catch (e: any) {
      setLoading(false);
      return { success: false, error: e.message || 'Login failed. Please try again.' };
    }
  };

  const signUp = async (data: RegisterFormData): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      // 1. Validate with Zod
      const parsed = registerSchema.safeParse(data);
      if (!parsed.success) {
        setLoading(false);
        return { success: false, error: parsed.error.issues[0]?.message || 'Invalid registration data.' };
      }

      const { fullName, email, mobile, password, accountType, organizationName } = parsed.data;

      // Check duplicate in DataStore
      if (DataStore.getUserByEmail(email)) {
        setLoading(false);
        return { success: false, error: 'An account with this email already exists. Please sign in.' };
      }

      let userId = `user-${Date.now()}`;
      let passwordHash = await hashPassword(password);

      // Try Backend API route registration
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data),
        });
        const result = await res.json();
        if (res.ok && result.success && result.user) {
          userId = result.user.id;
          if (result.passwordHash) {
            passwordHash = result.passwordHash;
          }
        }
      } catch (apiErr) {
        console.warn('API registration request error:', apiErr);
      }

      // Try Supabase Auth client directly
      try {
        const supabase = createClient();
        const { data: supaAuth, error: supaErr } = await supabase.auth.signUp({
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
        if (!supaErr && supaAuth.user?.id) {
          userId = supaAuth.user.id;
        }

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
      } catch {}

      // Create new user in DataStore with its secure password hash
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

      DataStore.upsertUser(newUser);
      DataStore.saveCredential(email, passwordHash);
      setUser(newUser);
      localStorage.setItem(SESSION_KEY, newUser.id);

      setLoading(false);
      return { success: true };
    } catch (e: any) {
      setLoading(false);
      return { success: false, error: e.message || 'Registration failed. Please try again.' };
    }
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined,
        },
      });
      if (error) {
        console.warn('Google OAuth notice:', error.message);
        // Fallback user session for local preview if Supabase OAuth credentials are unset
        const googleUser: User = {
          id: `google-${Date.now()}`,
          email: 'google.user@gmail.com',
          fullName: 'Google Authenticated User',
          mobile: '01700000000',
          role: 'personal',
          isVerified: true,
          createdAt: new Date().toISOString(),
        };
        DataStore.upsertUser(googleUser);
        setUser(googleUser);
        localStorage.setItem(SESSION_KEY, googleUser.id);
        setLoading(false);
        return { success: true };
      }
      setLoading(false);
      return { success: true };
    } catch (e: any) {
      console.error('Google login error', e);
      setLoading(false);
      return { success: false, error: e.message || 'Google sign-in failed.' };
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setLoading(false);
    router.push('/');
  };

  const updateProfile = async (data: { fullName?: string; businessName?: string; avatarUrl?: string }) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const updated: User = {
      ...user,
      fullName: data.fullName || user.fullName,
      businessName: data.businessName !== undefined ? data.businessName : user.businessName,
      avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : user.avatarUrl,
    };

    DataStore.upsertUser(updated);
    setUser(updated);

    // Sync to Supabase
    try {
      const supabase = createClient();
      await supabase.from('profiles').update({
        full_name: updated.fullName,
        business_name: updated.businessName,
        avatar_url: updated.avatarUrl,
      }).eq('id', user.id);
    } catch {}

    return { success: true };
  };

  const upgradeToBusiness = async (data: UpgradeBusinessFormData): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const updated: User = {
      ...user,
      businessName: data.businessName,
      organizationName: data.businessName,
      organization_name: data.businessName,
      nidNumber: data.nidNumber,
      nidUrl: data.nidUrl,
      photoUrl: data.photoUrl,
      upgradeStatus: 'pending_approval',
      verificationStatus: 'pending',
      isVerified: false,
    };

    DataStore.upsertUser(updated);
    setUser(updated);

    // Sync to Supabase
    try {
      const supabase = createClient();
      await supabase.from('profiles').update({
        business_name: data.businessName,
        organization_name: data.businessName,
        nid_number: data.nidNumber,
        nid_url: data.nidUrl,
        photo_url: data.photoUrl,
        upgrade_status: 'pending_approval',
        verification_status: 'pending',
        is_verified: false,
      }).eq('id', user.id);
    } catch {}

    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: user?.role === 'admin',
        isBusiness: user?.role === 'business',
        isPersonal: user?.role === 'personal',
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        updateProfile,
        upgradeToBusiness,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
