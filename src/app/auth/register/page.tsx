'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Loader, Briefcase, Building2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { registerSchema } from '@/lib/validations/auth';
import type { AccountType } from '@/lib/types';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    organizationName: '',
    password: '',
    confirmPassword: '',
    accountType: 'personal' as AccountType,
    agreeTerms: false,
  });

  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (k: string, v: string | boolean) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[k];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Zod Validation
    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        const fieldName = issue.path[0] as string;
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const res = await signUp(result.data);
    setLoading(false);

    if (res.success) {
      router.push('/dashboard');
    } else {
      setErrors({ general: res.error || 'Registration failed. Please check your data.' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-dark-900 bg-grid transition-colors duration-200">
      <div className="flex-1 flex flex-col lg:flex-row items-stretch">
        {/* Left panel */}
        <div className="hidden lg:flex flex-col justify-between w-[40%] bg-gradient-to-br from-dark-800 to-dark-900 border-r border-slate-200 dark:border-dark-500/40 p-12 relative overflow-hidden text-white shrink-0">
          <div className="absolute inset-0 hero-glow pointer-events-none" />
          <div className="absolute top-20 -right-20 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl animate-blob" />

          <Link href="/" className="flex items-center gap-3 z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-400 flex items-center justify-center text-white font-black text-lg shadow-glow-sm">P</div>
            <div>
              <div className="text-xl font-black text-white">Plotify<span className="text-brand-400">.</span></div>
              <div className="text-xs text-slate-400">Bangladesh Real Estate</div>
            </div>
          </Link>

          <div className="z-10 space-y-6">
            <h2 className="text-4xl font-black text-white leading-tight">
              Join<br /><span className="text-gradient">Plotify</span><br />Bangladesh
            </h2>
            <div className="space-y-3">
              {[
                'Post and manage properties in minutes',
                'Direct contact with genuine buyers and tenants',
                '100% verified listings with instant GPS search',
                'AI assistant — Ploti AI 🤖',
              ].map(f => (
                <div key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          <div className="z-10 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-brand-400" />
            <span>Trusted by over 50,000 property seekers in Bangladesh</span>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md space-y-5"
        >
          <Link href="/" className="flex lg:hidden items-center gap-2.5 justify-center mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-400 flex items-center justify-center text-white font-black text-base shadow-glow-sm">P</div>
            <span className="text-xl font-black text-slate-900 dark:text-white">Plotify<span className="text-brand-500">.</span></span>
          </Link>

          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Create Account</h1>
            <p className="text-slate-500 text-sm mt-1">
              Already have an account? <Link href="/auth/login" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">Sign in</Link>
            </p>
          </div>

          {errors.general && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Account type selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">Choose Account Type</label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { val: 'personal', icon: User, label: 'Personal', desc: 'Browse, save, and inquire properties' },
                { val: 'business', icon: Briefcase, label: 'Business', desc: 'Post ads, manage listings & analytics' },
              ] as const).map(t => (
                <button
                  key={t.val}
                  type="button"
                  onClick={() => update('accountType', t.val)}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border text-center transition-all ${
                    form.accountType === t.val
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300 font-bold shadow-sm'
                      : 'border-slate-200 dark:border-dark-500/60 bg-white dark:bg-dark-700/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <t.icon className={`w-5 h-5 ${form.accountType === t.val ? 'text-brand-500' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-xs font-bold">{t.label} Account</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            {errors.accountType && <p className="text-[11px] text-rose-500 mt-1">{errors.accountType}</p>}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full name */}
            <div className="space-y-1">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.fullName}
                  onChange={e => update('fullName', e.target.value)}
                  placeholder="Full Name (e.g., Tahmina Akter)"
                  className={`w-full bg-white dark:bg-dark-700/60 border ${
                    errors.fullName ? 'border-rose-500' : 'border-slate-200 dark:border-dark-500/60 focus:border-brand-500'
                  } rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition-all shadow-sm dark:shadow-none`}
                />
              </div>
              {errors.fullName && <p className="text-[11px] text-rose-500">{errors.fullName}</p>}
            </div>

            {/* Organization / Company Name (Required for Business Accounts) */}
            {form.accountType === 'business' && (
              <div className="space-y-1 animate-fade-in">
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500" />
                  <input
                    type="text"
                    value={form.organizationName}
                    onChange={e => update('organizationName', e.target.value)}
                    placeholder="Organization / Company Name (e.g., Apex Real Estate)"
                    required
                    className={`w-full bg-white dark:bg-dark-700/60 border ${
                      errors.organizationName ? 'border-rose-500' : 'border-brand-500/50 dark:border-brand-500/50 focus:border-brand-500'
                    } rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition-all shadow-sm dark:shadow-none`}
                  />
                </div>
                {errors.organizationName && <p className="text-[11px] text-rose-500">{errors.organizationName}</p>}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  placeholder="Email Address (e.g., name@gmail.com)"
                  className={`w-full bg-white dark:bg-dark-700/60 border ${
                    errors.email ? 'border-rose-500' : 'border-slate-200 dark:border-dark-500/60 focus:border-brand-500'
                  } rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition-all shadow-sm dark:shadow-none`}
                />
              </div>
              {errors.email && <p className="text-[11px] text-rose-500">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={form.mobile}
                  onChange={e => update('mobile', e.target.value)}
                  placeholder="Bangladeshi Mobile (e.g., 01712345678)"
                  className={`w-full bg-white dark:bg-dark-700/60 border ${
                    errors.mobile ? 'border-rose-500' : 'border-slate-200 dark:border-dark-500/60 focus:border-brand-500'
                  } rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition-all shadow-sm dark:shadow-none`}
                />
              </div>
              {errors.mobile && <p className="text-[11px] text-rose-500">{errors.mobile}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={show ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  placeholder="Password (min 8 chars, 1 letter, 1 number)"
                  className={`w-full bg-white dark:bg-dark-700/60 border ${
                    errors.password ? 'border-rose-500' : 'border-slate-200 dark:border-dark-500/60 focus:border-brand-500'
                  } rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition-all shadow-sm dark:shadow-none`}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-rose-500">{errors.password}</p>}
            </div>

            {/* Confirm */}
            <div className="space-y-1">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={show ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={e => update('confirmPassword', e.target.value)}
                  placeholder="Confirm Password"
                  className={`w-full bg-white dark:bg-dark-700/60 border ${
                    errors.confirmPassword ? 'border-rose-500' : 'border-slate-200 dark:border-dark-500/60 focus:border-brand-500'
                  } rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition-all shadow-sm dark:shadow-none`}
                />
              </div>
              {errors.confirmPassword && <p className="text-[11px] text-rose-500">{errors.confirmPassword}</p>}
            </div>

            {/* Terms */}
            <div className="space-y-1 pt-1">
              <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreeTerms}
                  onChange={e => update('agreeTerms', e.target.checked)}
                  className="w-4 h-4 accent-brand-500 mt-0.5 shrink-0"
                />
                <span>
                  I agree to Plotify's{' '}
                  <Link href="/terms" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">Terms of Service</Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">Privacy Policy</Link>
                </span>
              </label>
              {errors.agreeTerms && <p className="text-[11px] text-rose-500">{errors.agreeTerms}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-glow-sm transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Create Account</>}
            </button>
          </form>
        </motion.div>
      </div>
    </div>

    {/* Clean, dedicated authentication footer pushed to absolute bottom */}
    <footer className="w-full py-4 px-6 border-t border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-dark-900/80 backdrop-blur-md text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-10">
      <div>© 2026 Plotify Bangladesh. All rights reserved.</div>
      <div className="flex items-center gap-4">
        <Link href="/privacy" className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors">Privacy Policy</Link>
        <span className="text-slate-300 dark:text-slate-700">•</span>
        <Link href="/terms" className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors">Terms of Service</Link>
        <span className="text-slate-300 dark:text-slate-700">•</span>
        <Link href="/refunds" className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors">Refund Policy</Link>
      </div>
    </footer>
  </div>
);
}
