'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from 'next-themes';
import {
  BarChart3, Building2, Users, DollarSign, Bot, Flag,
  Settings, LogOut, Home, Sun, Moon, ShieldCheck, Menu, X, Loader
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAdmin, signOut } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  // Requirement 3: Route Protection
  // Strictly protect the /admin route. If a user logs in without the 'admin' role, redirect to homepage immediately.
  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        router.replace('/');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-900 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Loader className="w-10 h-10 animate-spin text-rose-500" />
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">Verifying Admin Authorization...</h2>
          <p className="text-xs text-slate-500 mt-1">Non-admin users will be redirected to the homepage.</p>
        </div>
      </div>
    );
  }

  const NAV_ITEMS = [
    { icon: BarChart3, label: 'Overview', href: '/admin' },
    { icon: Building2, label: 'Listings', href: '/admin/listings' },
    { icon: Users, label: 'Users & Approvals', href: '/admin/users' },
    { icon: DollarSign, label: 'Financials', href: '/admin/financials' },
    { icon: Bot, label: 'Ploti AI Logs', href: '/admin/ai-logs' },
    { icon: Flag, label: 'Reports', href: '/admin/reports' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-dark-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col bg-white dark:bg-dark-800 border-r border-slate-200 dark:border-dark-500/60 min-h-screen p-5 space-y-1 sticky top-0 h-screen overflow-y-auto">
          {/* Logo & Super Admin badge */}
          <div className="flex items-center gap-2.5 mb-6 pb-5 border-b border-slate-200 dark:border-dark-500/40">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-400 flex items-center justify-center text-white font-black text-lg shadow-glow-sm">
              P
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">Plotify Admin</div>
              <div className="text-[10px] text-rose-500 dark:text-rose-400 font-bold flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3" /> Super Admin
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 flex-1">
            {NAV_ITEMS.map(item => {
              const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all',
                    active
                      ? 'bg-brand-500/15 text-brand-600 dark:text-brand-300 border border-brand-500/30 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-700/60'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-200 dark:border-dark-500/40 space-y-1">
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-700/60 transition-all text-left"
            >
              <span className="flex items-center gap-2">
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Toggle</span>
            </button>

            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-700/60 transition-all"
            >
              <Home className="w-4 h-4" /> Back to Website
            </Link>

            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-all text-left"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Admin Top Header */}
          <header className="sticky top-0 z-40 bg-white/90 dark:bg-dark-800/90 backdrop-blur-md border-b border-slate-200 dark:border-dark-500/60 px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-slate-300"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Super Admin Mode
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Working Dark/Light Mode toggle for admin */}
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-dark-500 bg-slate-50 dark:bg-dark-700 text-slate-700 dark:text-slate-200 hover:border-brand-500/40 transition-all"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>

              <Link
                href="/"
                className="hidden sm:inline-flex px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-dark-500 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all"
              >
                View Live Site
              </Link>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-dark-500">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center">
                  A
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user?.fullName || 'Super Admin'}</div>
                  <div className="text-[10px] text-slate-400">{user?.email || 'support@plotify.store'}</div>
                </div>
              </div>
            </div>
          </header>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-white dark:bg-dark-800 border-b border-slate-200 dark:border-dark-500 p-4 space-y-2 animate-slide-up">
              {NAV_ITEMS.map(item => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-700"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-slate-200 dark:border-dark-600 flex justify-between">
                <Link href="/" className="text-xs font-bold text-slate-500">Back to Site</Link>
                <button onClick={() => signOut()} className="text-xs font-bold text-rose-500">Sign Out</button>
              </div>
            </div>
          )}

          {/* Page Content */}
          <main className="p-6 sm:p-8 flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
