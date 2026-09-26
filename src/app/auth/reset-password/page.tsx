'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, ArrowLeft, ArrowRight, Loader, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { lang } = useLanguage();

  const [checking, setChecking] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [tokenError, setTokenError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Validate token on load
  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setTokenValid(false);
        setTokenError(
          lang === 'BN'
            ? 'পাসওয়ার্ড রিসেট লিংকে কোনো বৈধ সিকিউরিটি টোকেন পাওয়া যায়নি।'
            : 'Password reset link is missing a valid security token.'
        );
        setChecking(false);
        return;
      }

      try {
        const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (res.ok && data.valid) {
          setTokenValid(true);
          if (data.email) setUserEmail(data.email);
        } else {
          setTokenValid(false);
          setTokenError(
            data.error ||
              (lang === 'BN'
                ? 'এই পাসওয়ার্ড রিসেট লিংকটি অবৈধ অথবা মেয়াদোত্তীর্ণ হয়ে গেছে।'
                : 'This password reset link is invalid or has expired.')
          );
        }
      } catch {
        setTokenValid(false);
        setTokenError(
          lang === 'BN'
            ? 'সিকিউরিটি টোকেন যাচাই করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।'
            : 'Failed to verify security token. Please check your connection.'
        );
      } finally {
        setChecking(false);
      }
    }

    checkToken();
  }, [token, lang]);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newPassword || !confirmNewPassword) {
      setFormError(lang === 'BN' ? 'উভয় পাসওয়ার্ড পূরণ করুন।' : 'Please fill in both password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setFormError(
        lang === 'BN' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters long.'
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setFormError(lang === 'BN' ? 'উভয় পাসওয়ার্ড মেলেনি।' : 'Passwords do not match. Please re-check.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword,
          confirmNewPassword,
        }),
      });

      const data = await res.json();
      setSubmitting(false);

      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        setFormError(
          data.error ||
            (lang === 'BN'
              ? 'পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।'
              : 'Failed to reset password. Please try again.')
        );
      }
    } catch (err: any) {
      setSubmitting(false);
      setFormError(err?.message || (lang === 'BN' ? 'নেটওয়ার্ক ত্রুটি হয়েছে।' : 'A network error occurred. Please try again.'));
    }
  };

  // Checking state
  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
        <Loader className="w-8 h-8 animate-spin text-brand-500" />
        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
          {lang === 'BN' ? 'সিকিউরিটি টোকেন যাচাই করা হচ্ছে...' : 'Verifying reset security token...'}
        </p>
      </div>
    );
  }

  // Token invalid or expired state
  if (!tokenValid) {
    return (
      <div className="space-y-6 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {lang === 'BN' ? 'রিসেট লিংক মেয়াদোত্তীর্ণ' : 'Reset Link Expired'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            {tokenError}
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/auth/forgot-password"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-glow-sm hover:shadow-glow"
          >
            {lang === 'BN' ? 'নতুন রিসেট লিংক চান' : 'Request New Reset Link'}
          </Link>
          <Link
            href="/auth/login"
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold transition-all"
          >
            {lang === 'BN' ? 'সাইন ইন পেজে ফিরুন' : 'Back to Sign In'}
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="space-y-6 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {lang === 'BN' ? 'পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!' : 'Password Updated!'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            {lang === 'BN'
              ? 'আপনার নতুন পাসওয়ার্ড সেট করা সম্পন্ন হয়েছে। কয়েক সেকেন্ডের মধ্যে আপনাকে সাইন ইন পেজে নিয়ে যাওয়া হবে।'
              : 'Your password has been changed successfully. You will be redirected to the sign in page shortly.'}
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-glow-sm hover:shadow-glow"
          >
            <span>{lang === 'BN' ? 'এখনই সাইন ইন করুন' : 'Sign in now'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Icon Badge */}
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-500/15 to-teal-500/10 border border-brand-500/25 flex items-center justify-center mx-auto text-brand-600 dark:text-brand-400 shadow-glow-sm">
        <Lock className="w-6 h-6 stroke-[2.2]" />
      </div>

      {/* Heading */}
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {lang === 'BN' ? 'নতুন পাসওয়ার্ড দিন' : 'Set new password'}
          <span className="text-brand-500">.</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
          {userEmail ? (
            <>
              {lang === 'BN' ? 'অ্যাকাউন্ট: ' : 'Resetting password for '}
              <strong className="text-brand-600 dark:text-brand-400 font-semibold">{userEmail}</strong>
            </>
          ) : (
            lang === 'BN'
              ? 'আপনার অ্যাকাউন্টের জন্য একটি শক্তিশালী নতুন পাসওয়ার্ড তৈরি করুন।'
              : 'Enter your new password below to regain access to your account.'
          )}
        </p>
      </div>

      {/* Error message */}
      {formError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Reset Form */}
      <form onSubmit={handleResetSubmit} className="space-y-4">
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {lang === 'BN' ? 'নতুন পাসওয়ার্ড' : 'New Password'}
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type={showPass ? 'text' : 'password'}
              value={newPassword}
              onChange={e => {
                setNewPassword(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder={lang === 'BN' ? 'কমপক্ষে ৬ অক্ষর' : 'At least 6 characters'}
              required
              className="w-full min-h-[46px] bg-slate-50/80 dark:bg-dark-700/60 border border-slate-200 dark:border-dark-500/60 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl pl-10 pr-12 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition-all shadow-sm dark:shadow-none"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              aria-label={showPass ? 'Hide password' : 'Show password'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-dark-600 transition-colors cursor-pointer"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5 text-left">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {lang === 'BN' ? 'নতুন পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'}
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmNewPassword}
              onChange={e => {
                setConfirmNewPassword(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder={lang === 'BN' ? 'পুনরায় পাসওয়ার্ড লিখুন' : 'Re-enter your new password'}
              required
              className="w-full min-h-[46px] bg-slate-50/80 dark:bg-dark-700/60 border border-slate-200 dark:border-dark-500/60 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl pl-10 pr-12 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition-all shadow-sm dark:shadow-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-dark-600 transition-colors cursor-pointer"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Primary Emerald Button matching Plotify */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[48px] py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-glow-sm hover:shadow-glow transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          {submitting ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>{lang === 'BN' ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Update password'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="pt-2 border-t border-slate-100 dark:border-dark-500/40 text-center">
        <Link
          href="/auth/login"
          className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{lang === 'BN' ? 'সাইন ইন পেজে ফিরুন' : 'Back to Sign In'}</span>
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { lang } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-dark-900 bg-grid transition-colors duration-200">
      <div className="flex-1 flex flex-col lg:flex-row items-stretch">
        {/* Left Brand Showcase Panel — matching Login & Register */}
        <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-dark-800 to-dark-900 border-r border-slate-200 dark:border-dark-500/40 p-12 relative overflow-hidden text-white shrink-0">
          <div className="absolute inset-0 hero-glow pointer-events-none" />
          <div className="absolute top-20 -right-20 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl animate-blob" />
          <div className="absolute bottom-20 -left-20 w-80 h-80 bg-teal-600/8 rounded-full blur-3xl animate-blob delay-300" />

          {/* Top Logo */}
          <Link href="/" className="flex items-center gap-3 z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-400 flex items-center justify-center text-white font-black text-lg shadow-glow-sm">
              P
            </div>
            <div>
              <div className="text-xl font-black text-white">
                Plotify<span className="text-brand-400">.</span>
              </div>
              <div className="text-xs text-slate-400">
                {lang === 'BN' ? 'বাংলাদেশ রিয়েল এস্টেট মার্কেটপ্লেস' : 'Bangladesh Real Estate'}
              </div>
            </div>
          </Link>

          {/* Central Hero Message */}
          <div className="z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-xs font-bold text-brand-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{lang === 'BN' ? 'পাসওয়ার্ড আপডেট' : 'Secure Account Update'}</span>
            </div>

            <h2 className="text-4xl font-black text-white leading-tight">
              {lang === 'BN' ? (
                <>
                  নতুন পাসওয়ার্ড দিয়ে<br />
                  <span className="text-gradient">লগইন করুন</span>
                </>
              ) : (
                <>
                  Secure your account<br />
                  <span className="text-gradient">with Plotify</span>
                </>
              )}
            </h2>

            <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
              {lang === 'BN'
                ? 'একটি শক্তিশালী এবং নিরাপদ পাসওয়ার্ড নির্বাচন করুন যা আপনার অ্যাকাউন্টকে সর্বদা সুরক্ষিত রাখবে।'
                : 'Choose a strong, memorable password to protect your listings and personal details across our platform.'}
            </p>

            {/* Platform Stats Pills */}
            <div className="grid grid-cols-3 gap-3">
              {[
                lang === 'BN' ? '১,৫০০+ লিস্টিং' : '1,500+ Listings',
                lang === 'BN' ? '৬৪ জেলা' : '64 Districts',
                lang === 'BN' ? '৫০K+ ব্যবহারকারী' : '50K+ Users',
              ].map(s => (
                <div key={s} className="bg-dark-700/60 border border-dark-500/40 rounded-xl p-3 text-center">
                  <div className="text-xs font-bold text-brand-300">{s}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Security Assurance */}
          <div className="z-10 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0" />
            <span>
              {lang === 'BN'
                ? 'bcrypt ক্রিপ্টোগ্রাফিক সল্টিং ও হ্যাশিং দ্বারা সুরক্ষিত'
                : 'Secured with bcrypt cryptographic salting & hashing'}
            </span>
          </div>
        </div>

        {/* Right Form Container */}
        <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-10 lg:py-12 relative">
          <div className="w-full max-w-md flex items-center justify-between mb-4">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300 transition-colors group min-h-[36px] py-1 px-1.5 -ml-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>{lang === 'BN' ? 'লগইন পেজে ফিরুন' : 'Back to Sign In'}</span>
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-md backdrop-blur-xl bg-white/90 dark:bg-dark-800/90 border border-slate-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-glass-card hover:shadow-glass-card-hover transition-all"
          >
            {/* Mobile Header Logo */}
            <Link href="/" className="flex lg:hidden items-center gap-2.5 justify-center mb-6">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-400 flex items-center justify-center text-white font-black text-base shadow-glow-sm">
                P
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                Plotify<span className="text-brand-500">.</span>
              </span>
            </Link>

            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center p-12 space-y-3">
                  <Loader className="w-8 h-8 animate-spin text-brand-500" />
                  <p className="text-xs text-slate-500">
                    {lang === 'BN' ? 'লোড হচ্ছে...' : 'Loading reset form...'}
                  </p>
                </div>
              }
            >
              <ResetPasswordForm />
            </Suspense>
          </motion.div>
        </div>
      </div>

      {/* Clean, dedicated authentication footer matching Login & Register */}
      <footer className="w-full py-4 px-6 border-t border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-dark-900/80 backdrop-blur-md text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-10">
        <div>© 2026 Plotify Bangladesh. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors">
            Privacy Policy
          </Link>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <Link href="/terms" className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors">
            Terms of Service
          </Link>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <Link href="/refunds" className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors">
            Refund Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
