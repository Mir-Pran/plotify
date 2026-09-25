'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { loginSchema } from '@/lib/validations/auth';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Zod validation
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.issues.forEach(issue => {
        if (issue.path[0] === 'email') fieldErrors.email = issue.message;
        if (issue.path[0] === 'password') fieldErrors.password = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const res = await signIn(result.data);
    setLoading(false);

    if (res.success) {
      if (email.toLowerCase().trim() === 'support@plotify.store') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } else {
      setErrors({ general: res.error || 'Invalid credentials. Please try again.' });
    }
  };

  const handleGoogleSignIn = async () => {
    setErrors({});
    setGoogleLoading(true);
    const res = await signInWithGoogle();
    setGoogleLoading(false);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setErrors({ general: res.error || 'Google authentication failed.' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-dark-900 bg-grid transition-colors duration-200">
      <div className="flex-1 flex flex-col lg:flex-row items-stretch">
        {/* Left panel — hidden on mobile */}
        <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-dark-800 to-dark-900 border-r border-slate-200 dark:border-dark-500/40 p-12 relative overflow-hidden text-white shrink-0">
          <div className="absolute inset-0 hero-glow pointer-events-none" />
          <div className="absolute top-20 -right-20 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl animate-blob" />
          <div className="absolute bottom-20 -left-20 w-80 h-80 bg-teal-600/8 rounded-full blur-3xl animate-blob delay-300" />

          <Link href="/" className="flex items-center gap-3 z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-400 flex items-center justify-center text-white font-black text-lg shadow-glow-sm">
              P
            </div>
            <div>
              <div className="text-xl font-black text-white">Plotify<span className="text-brand-400">.</span></div>
              <div className="text-xs text-slate-400">Bangladesh Real Estate</div>
            </div>
          </Link>

          <div className="z-10 space-y-6">
            <h2 className="text-4xl font-black text-white leading-tight">
              Welcome back to<br />
              <span className="text-gradient">Plotify</span>
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
              Bangladesh's most trusted real estate marketplace. Find verified properties with direct owner contact and zero hidden charges.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {['1,500+ Listings', '64 Districts', '50K+ Users'].map(s => (
                <div key={s} className="bg-dark-700/60 border border-dark-500/40 rounded-xl p-3 text-center">
                  <div className="text-xs font-bold text-brand-300">{s}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="z-10 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-brand-400" />
            <span>100% verified listings with instant GPS search</span>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Mobile logo */}
          <Link href="/" className="flex lg:hidden items-center gap-2.5 justify-center mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-400 flex items-center justify-center text-white font-black text-base shadow-glow-sm">P</div>
            <span className="text-xl font-black text-slate-900 dark:text-white">Plotify<span className="text-brand-500">.</span></span>
          </Link>

          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Sign In</h1>
            <p className="text-slate-500 text-sm mt-1">
              Don't have an account? <Link href="/auth/register" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">Create one</Link>
            </p>
          </div>

          {/* General error message */}
          {errors.general && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Google OAuth Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-500/80 hover:bg-slate-50 dark:hover:bg-dark-700/80 text-slate-800 dark:text-slate-100 font-bold text-sm shadow-sm transition-all disabled:opacity-60 cursor-pointer"
          >
            {googleLoading ? (
              <Loader className="w-4 h-4 animate-spin text-brand-500" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200 dark:bg-dark-500/60" />
            <span className="text-xs text-slate-500 font-medium">or continue with email</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-dark-500/60" />
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  placeholder="you@example.com"
                  className={`w-full bg-white dark:bg-dark-700/60 border ${
                    errors.email ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 dark:border-dark-500/60 focus:border-brand-500'
                  } rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition-all shadow-sm dark:shadow-none`}
                />
              </div>
              {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Your password"
                  className={`w-full bg-white dark:bg-dark-700/60 border ${
                    errors.password ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 dark:border-dark-500/60 focus:border-brand-500'
                  } rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition-all shadow-sm dark:shadow-none`}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-rose-500 mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-glow-sm transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Sign In</>}
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
