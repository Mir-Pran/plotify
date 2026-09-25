'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/auth-context';
import {
  Home, Search, LayoutDashboard, Menu, X,
  Building2, MapPin, TreePine, Hotel, Users, Sun, Moon, Globe,
  User, ShieldCheck, LogOut, ChevronDown, PlusCircle, Settings, Briefcase
} from 'lucide-react';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isDark = mounted ? (resolvedTheme === 'dark') : true;

  const pathname = usePathname();
  const { lang, setLang, t } = useLanguage();
  const { user, isAdmin, isBusiness, signOut } = useAuth();

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const NAV_LINKS = [
    { label: t('nav_buy'), href: '/properties?purpose=buy' },
    { label: t('nav_rent'), href: '/properties?purpose=rent' },
    { label: t('nav_lease'), href: '/properties?purpose=lease' },
    { label: t('nav_plots'), href: '/properties?category=land' },
    { label: t('nav_hotels'), href: '/properties?category=hotel' },
  ];

  const getRoleBadge = () => {
    if (!user) return null;
    if (user.role === 'admin') {
      return (
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/30">
          Admin
        </span>
      );
    }
    if (user.role === 'business') {
      return (
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-300 border border-brand-500/30">
          Business
        </span>
      );
    }
    return (
      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 dark:bg-dark-700 text-slate-700 dark:text-slate-300">
        Personal
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-white/5 bg-white/75 dark:bg-dark-900/60 backdrop-blur-2xl shadow-sm dark:shadow-[0_4px_30px_rgba(0,0,0,0.4),0_0_1px_rgba(255,255,255,0.05)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 opacity-90 group-hover:opacity-100 transition-all shadow-glow-sm" />
              <div className="absolute inset-0 flex items-center justify-center text-white font-black text-base">P</div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                Plotify<span className="text-brand-500">.</span>
              </span>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-none">Bangladesh</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'px-3.5 py-2 text-sm font-semibold rounded-lg transition-all',
                  pathname === l.href || pathname.startsWith(l.href.split('?')[0] + '?')
                    ? 'text-brand-600 dark:text-brand-400 bg-brand-500/10'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-white/5'
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Lang toggle */}
            <button
              onClick={() => setLang(lang === 'EN' ? 'BN' : 'EN')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-brand-500/40 hover:bg-brand-500/10 transition-all shadow-sm"
              title="Switch language"
            >
              <Globe className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
              {t('switch_to_bangla')}
            </button>

            {/* Ploti AI quick launcher */}
            <button
              onClick={() => window.dispatchEvent(new Event('ploti-open'))}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-brand-500/25 bg-brand-500/5 hover:bg-brand-500/15 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all hover:border-brand-500/50 shadow-xs cursor-pointer"
              title={lang === 'BN' ? 'প্লটি এআই সহকারী' : 'Ploti AI Assistant'}
            >
              <img src="/ploti-avatar.png" alt="Ploti AI" className="w-4 h-4 object-contain" />
              <span className="hidden sm:inline text-xs font-bold text-brand-600 dark:text-brand-300">
                Ploti AI
              </span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl backdrop-blur-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-brand-500/40 hover:bg-brand-500/10 transition-all shadow-sm"
              title={isDark ? t('nav_light_mode') : t('nav_dark_mode')}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Dashboard link ONLY visible to authenticated users (Requirement 2) */}
            {user && (
              <Link
                href="/dashboard"
                className={cn(
                  'hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all',
                  pathname.startsWith('/dashboard')
                    ? 'text-brand-600 dark:text-brand-400 bg-brand-500/10'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-white/5'
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                {t('nav_dashboard')}
              </Link>
            )}

            {/* Unauthenticated: Sign In & Register */}
            {!user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-3.5 py-2 rounded-xl backdrop-blur-md border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-brand-500/50 hover:bg-brand-500/10 transition-all shadow-sm"
                >
                  {t('nav_sign_in')}
                </Link>
                <Link
                  href="/auth/register"
                  className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-glow-sm transition-all hover:shadow-glow"
                >
                  {t('nav_create_account')}
                </Link>
              </div>
            ) : (
              /* Authenticated: Profile dropdown/button replacing the removed "+ Property" button (Requirement 2) */
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 hover:border-brand-500/40 hover:bg-brand-500/10 transition-all text-left shadow-sm"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="w-8 h-8 rounded-lg object-cover shadow-sm ring-1 ring-brand-500/20"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold text-xs shadow-glow-sm">
                      {user.fullName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="hidden sm:block text-left pr-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight max-w-[110px] truncate">
                      {user.fullName}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize flex items-center gap-1">
                      {user.role}
                    </div>
                  </div>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", profileOpen && "rotate-180")} />
                </button>

                {/* Dropdown Menu */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl backdrop-blur-2xl bg-white dark:bg-dark-900/95 border border-slate-200 dark:border-white/15 shadow-xl dark:shadow-glass-modal p-2 space-y-1 animate-slide-up z-50">
                    {/* User header */}
                    <div className="p-3 border-b border-slate-100 dark:border-white/10 mb-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {user.fullName}
                        </div>
                        {getRoleBadge()}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </div>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                    >
                      <LayoutDashboard className="w-4 h-4 text-brand-500" />
                      My Dashboard
                    </Link>

                    <Link
                      href="/dashboard/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                    >
                      <User className="w-4 h-4 text-teal-500" />
                      Profile & Settings
                    </Link>

                    {/* Admin Panel link for admins */}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Admin Control Panel
                      </Link>
                    )}

                    {/* Add property only for business accounts */}
                    {isBusiness && (
                      <Link
                        href="/dashboard/add-property"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-brand-600 dark:text-brand-300 hover:bg-brand-500/10 transition-all"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Post New Property
                      </Link>
                    )}

                    <div className="pt-1 border-t border-slate-100 dark:border-white/10 mt-1">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-all text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden p-2 rounded-xl backdrop-blur-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="lg:hidden border-t border-slate-200/80 dark:border-white/5 bg-white/95 dark:bg-dark-900/90 backdrop-blur-2xl px-4 py-5 space-y-1 animate-slide-up">
          {NAV_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
            >
              {l.label}
            </Link>
          ))}

          <button
            onClick={() => {
              setOpen(false);
              window.dispatchEvent(new Event('ploti-open'));
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 transition-all text-left cursor-pointer"
          >
            <img src="/ploti-avatar.png" alt="Ploti AI" className="w-5 h-5 object-contain" />
            <span>{lang === 'BN' ? 'প্লটি এআই চ্যাট সহকারী' : 'Chat with Ploti AI'}</span>
          </button>

          <div className="pt-3 border-t border-slate-200 dark:border-white/5 space-y-2">
            {user ? (
              <>
                <div className="px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.fullName}</span>
                  {getRoleBadge()}
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-brand-600 dark:text-brand-300 hover:bg-brand-500/10"
                >
                  My Dashboard
                </Link>
                <Link
                  href="/dashboard/profile"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Profile & Settings
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-500/10"
                  >
                    Admin Control Panel
                  </Link>
                )}
                {isBusiness && (
                  <Link
                    href="/dashboard/add-property"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-brand-600 hover:bg-brand-500/10"
                  >
                    Post Property
                  </Link>
                )}
                <button
                  onClick={() => {
                    setOpen(false);
                    signOut();
                  }}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-500/10"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  {t('nav_sign_in')}
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  {t('nav_create_account')}
                </Link>
              </>
            )}

            <div className="flex items-center gap-3 px-4 py-2 pt-3 border-t border-slate-200 dark:border-white/5">
              <button onClick={toggleTheme} className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-400">
                {isDark
                  ? <><Sun className="w-4 h-4 text-amber-400" />{t('nav_light_mode')}</>
                  : <><Moon className="w-4 h-4 text-slate-700" />{t('nav_dark_mode')}</>
                }
              </button>
              <button
                onClick={() => setLang(lang === 'EN' ? 'BN' : 'EN')}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-400 ml-auto"
              >
                <Globe className="w-4 h-4 text-brand-500" />
                {t('switch_to_bangla')}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
