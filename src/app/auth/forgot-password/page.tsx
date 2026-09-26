'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { KeyRound, Mail, ArrowLeft, ArrowRight, Loader, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';

export default function ForgotPasswordPage() {
  const { lang } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPreviewUrl(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError(lang === 'BN' ? 'অনুগ্রহ করে আপনার ইমেইল ঠিকানা দিন।' : 'Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const clientOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          origin: clientOrigin || undefined,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.success) {
        setSuccess(
          data.message ||
            (lang === 'BN'
              ? 'পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে! অনুগ্রহ করে আপনার ইমেইল ইনবক্স চেক করুন।'
              : 'Password reset link sent! Please check your email inbox.')
        );
        if (data.previewUrl) setPreviewUrl(data.previewUrl);
      } else {
        setError(
          data.error ||
            (lang === 'BN'
              ? 'রিসেট লিংক পাঠাতে ব্যর্থ হয়েছে। অনুগ্রহ করে আপনার ইমেইল যাচাই করুন।'
              : 'Failed to send reset link. Please check your email.')
        );
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || (lang === 'BN' ? 'নেটওয়ার্ক ত্রুটি হয়েছে। পুনরায় চেষ্টা করুন।' : 'A network error occurred. Please try again.'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-dark-900 bg-grid transition-colors duration-200">
      <div className="flex-1 flex flex-col lg:flex-row items-stretch">
        {/* Left Brand Showcase Panel — visible on lg+ displays, matching Login & Register */}
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
              <span>{lang === 'BN' ? 'নিরাপদ অ্যাকাউন্ট পুনরুদ্ধার' : 'Secure Account Recovery'}</span>
            </div>

            <h2 className="text-4xl font-black text-white leading-tight">
              {lang === 'BN' ? (
                <>
                  আপনার অ্যাকাউন্টের অ্যাক্সেস<br />
                  <span className="text-gradient">সহজেই ফিরে পান</span>
                </>
              ) : (
                <>
                  Recover access to<br />
                  <span className="text-gradient">your Plotify account</span>
                </>
              )}
            </h2>

            <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
              {lang === 'BN'
                ? 'আপনার সংরক্ষিত প্রপার্টি, বিজ্ঞাপন এবং চ্যাট হিস্ট্রিতে ফিরে যেতে একটি নিরাপদ পাসওয়ার্ড রিসেট লিংক গ্রহণ করুন।'
                : "Regain immediate access to your verified listings, saved properties, and dashboard inquiries across 64 districts in Bangladesh."}
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
                ? '১০০% এনক্রিপ্টেড এবং নিরাপদ এককালীন টোকেন ভেরিফিকেশন'
                : '100% encrypted, single-use token verification'}
            </span>
          </div>
        </div>

        {/* Right Form Container */}
        <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-10 lg:py-12 relative">
          {/* Top back navigation button */}
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
            className="w-full max-w-md backdrop-blur-xl bg-white/90 dark:bg-dark-800/90 border border-slate-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-glass-card hover:shadow-glass-card-hover transition-all space-y-6"
          >
            {/* Mobile Header Logo */}
            <Link href="/" className="flex lg:hidden items-center gap-2.5 justify-center mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-400 flex items-center justify-center text-white font-black text-base shadow-glow-sm">
                P
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                Plotify<span className="text-brand-500">.</span>
              </span>
            </Link>

            {/* Glowing Emerald Key Icon Badge */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-500/15 to-teal-500/10 border border-brand-500/25 flex items-center justify-center mx-auto text-brand-600 dark:text-brand-400 shadow-glow-sm">
              <KeyRound className="w-6 h-6 stroke-[2.2]" />
            </div>

            {/* Title & Subtitle */}
            <div className="text-center space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {lang === 'BN' ? 'পাসওয়ার্ড রিসেট' : 'Reset your password'}
                <span className="text-brand-500">.</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                {lang === 'BN'
                  ? 'আপনার অ্যাকাউন্টের ইমেইল ঠিকানা দিন, আমরা একটি নিরাপদ রিসেট লিংক পাঠাবো।'
                  : "Enter your registered email and we'll send you a secure link to reset your password."}
              </p>
            </div>

            {/* Error Notice */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success State */}
            {success ? (
              <div className="space-y-5 animate-fade-in">
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-200 space-y-2.5 text-xs backdrop-blur-sm">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{lang === 'BN' ? 'আপনার ইনবক্স চেক করুন' : 'Check your email'}</span>
                  </div>
                  <p className="leading-relaxed">
                    {lang === 'BN' ? (
                      <>আমরা <strong className="font-semibold text-slate-900 dark:text-white">{email}</strong> ঠিকানায় একটি পাসওয়ার্ড রিসেট লিংক পাঠিয়েছি। নতুন পাসওয়ার্ড সেট করতে অনুগ্রহ করে আপনার ইনবক্স (বা স্প্যাম ফোল্ডার) চেক করুন।</>
                    ) : (
                      <>We've dispatched a password reset link to <strong className="font-semibold text-slate-900 dark:text-white">{email}</strong>. Please check your inbox (and spam folder) to set your new password.</>
                    )}
                  </p>
                </div>

                {previewUrl && (
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-dark-700 text-xs text-slate-600 dark:text-slate-300 text-center border border-slate-200 dark:border-white/5">
                    <span>{lang === 'BN' ? 'লোকাল প্রিভিউ লিংক: ' : 'Development Email Preview: '}</span>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      {lang === 'BN' ? 'ইমেইল দেখুন ↗' : 'View Dispatched Email ↗'}
                    </a>
                  </div>
                )}

                <div className="pt-2 text-center space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSuccess(null);
                      setError(null);
                    }}
                    className="min-h-[44px] px-3 py-2 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer inline-flex items-center justify-center"
                  >
                    {lang === 'BN' ? 'ইমেইল পাননি? পুনরায় পাঠান' : "Didn't receive the email? Send again"}
                  </button>
                  <div>
                    <Link
                      href="/auth/login"
                      className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>{lang === 'BN' ? 'সাইন ইন পেজে ফিরে যান' : 'Return to Sign In'}</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              /* Reset Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {lang === 'BN' ? 'ইমেইল ঠিকানা' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="you@example.com"
                      required
                      className="w-full min-h-[48px] bg-slate-50/80 dark:bg-dark-700/60 border border-slate-200 dark:border-dark-500/60 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition-all shadow-sm dark:shadow-none"
                    />
                  </div>
                </div>

                {/* Primary Emerald Button matching Plotify */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-glow-sm hover:shadow-glow transition-all disabled:opacity-60 cursor-pointer active:scale-[0.99]"
                >
                  {loading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{lang === 'BN' ? 'রিসেট লিংক পাঠান' : 'Send reset link'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Bottom link: Remember your password? Log in */}
            <div className="pt-2 border-t border-slate-100 dark:border-dark-500/40 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'BN' ? 'পাসওয়ার্ড মনে আছে? ' : 'Remember your password? '}
                <Link
                  href="/auth/login"
                  className="font-bold text-brand-600 dark:text-brand-400 hover:underline transition-all"
                >
                  {lang === 'BN' ? 'লগইন করুন' : 'Log in'}
                </Link>
              </p>
            </div>
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
