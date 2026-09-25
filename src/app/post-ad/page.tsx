'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { Building2, PlusCircle, ShieldAlert, ArrowRight, CheckCircle2, Lock, ShieldCheck, AlertCircle } from 'lucide-react';

export default function PostAdRoutingPage() {
  const router = useRouter();
  const { user, loading, isBusiness, isAdmin } = useAuth();
  const { lang } = useLanguage();

  useEffect(() => {
    // Only verified business users or admins can access property ad creation
    if (!loading && user && ((isBusiness && user.isVerified) || isAdmin)) {
      router.replace('/dashboard/add-property');
    }
  }, [user, loading, isBusiness, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white dark:bg-dark-800/80 border border-slate-200 dark:border-white/10 rounded-3xl p-8 text-center shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-5">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {lang === 'BN' ? 'সম্পত্তি পোস্ট করতে সাইন ইন করুন' : 'Sign In to Post Property'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {lang === 'BN' 
              ? 'প্লটিফাইতে বিনামূল্যে বিজ্ঞাপন দিতে অথবা ব্যবসা পরিচালনা করতে একটি বিজনেস অ্যাকাউন্ট প্রয়োজন।'
              : 'To list verified properties on Plotify, please log in with your Business Account.'}
          </p>

          <div className="mt-8 space-y-3">
            <Link
              href="/auth/login?redirect=/dashboard/add-property"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 hover:scale-[1.02] transition-transform"
            >
              {lang === 'BN' ? 'লগইন করুন' : 'Log In to Plotify'}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/register"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
            >
              {lang === 'BN' ? 'নতুন অ্যাকাউন্ট খুলুন' : 'Create Free Account'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Business Account but NOT verified by admin (Requirement 2)
  if ((isBusiness || user.role === 'business') && !user.isVerified && !isAdmin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full bg-white dark:bg-dark-800/90 border border-amber-500/30 rounded-3xl p-8 text-center shadow-xl animate-fade-in space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 inline-block">
              Verification Required
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {lang === 'BN' ? 'ব্যবসায়িক অ্যাকাউন্ট যাচাইকরণ আবশ্যক' : 'Business Account Verification Required'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {user.upgradeStatus === 'pending_approval' || user.verificationStatus === 'pending'
                ? 'Your verification documents are currently pending review by our administrator team. Ad posting will be enabled as soon as your account is approved.'
                : 'To maintain listing quality and safety, all Business accounts must submit their National ID (NID) and photo verification for admin review before posting ads.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-left text-xs text-amber-800 dark:text-amber-200 space-y-1.5">
            <div className="font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Status: {user.isVerified ? 'Verified' : (user.verificationStatus?.toUpperCase() || 'PENDING APPROVAL')}</span>
            </div>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 pl-6">
              Organization: <strong>{user.organizationName || user.businessName || 'Business Organization'}</strong>
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              {user.nidUrl ? 'View Verification Status on Dashboard' : 'Complete Verification on Dashboard'}
            </Link>
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-dark-600 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-dark-700 transition-all"
            >
              Go to Dashboard Overview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Logged in as Personal
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white dark:bg-dark-800/80 border border-slate-200 dark:border-white/10 rounded-3xl p-8 text-center shadow-lg">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-5">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          {lang === 'BN' ? 'বিজনেস অ্যাকাউন্টে আপগ্রেড প্রয়োজন' : 'Business Account Required'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          {lang === 'BN' 
            ? 'আপনার বর্তমান অ্যাকাউন্টটি একটি ব্যক্তিগত অ্যাকাউন্ট। সম্পত্তি তালিকাভুক্ত করতে অনুগ্রহ করে আপনার এনআইডি ও ছবি জমা দিয়ে বিজনেস অ্যাকাউন্টে আপগ্রেড করুন।'
            : 'You are currently logged in with a Personal Account. To list properties, please upgrade to a Business Account by submitting your NID.'}
        </p>

        <div className="mt-8 space-y-3">
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:scale-[1.02] transition-transform"
          >
            {lang === 'BN' ? 'ড্যাশবোর্ডে আপগ্রেড করুন' : 'Upgrade on Dashboard'}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/properties"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
          >
            {lang === 'BN' ? 'সম্পত্তি ব্রাউজ করুন' : 'Browse Properties'}
          </Link>
        </div>
      </div>
    </div>
  );
}
