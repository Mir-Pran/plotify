'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Phone, Mail, MapPin, ShieldCheck, Building2, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { toBanglaDigits } from '@/lib/utils';
import { DataStore } from '@/lib/data/store';

export default function Footer() {
  const pathname = usePathname();
  const { lang, t } = useLanguage();
  const [settings, setSettings] = useState(() => DataStore.getSettings());

  useEffect(() => {
    const handleUpdate = () => setSettings(DataStore.getSettings());
    DataStore.syncSettingsFromSupabase().then(() => setSettings(DataStore.getSettings()));
    window.addEventListener('plotify_settings_updated', handleUpdate);
    return () => window.removeEventListener('plotify_settings_updated', handleUpdate);
  }, []);

  // Hide the heavy global website footer on authentication pages and admin panel
  const isAuthPage = pathname?.startsWith('/auth') || pathname === '/login' || pathname === '/signup';
  const isAdminPage = pathname?.startsWith('/admin');

  if (isAuthPage || isAdminPage) {
    return null;
  }

  const EXPLORE = [
    { label: t('footer_flats_sale'), href: '/properties?category=flat&purpose=buy' },
    { label: t('footer_rent_dhaka'),  href: '/properties?purpose=rent&district=Dhaka' },
    { label: t('footer_land'),        href: '/properties?category=land' },
    { label: t('footer_mess'),        href: '/properties?category=mess' },
    { label: t('footer_hotel'),       href: '/properties?category=hotel' },
    { label: t('footer_post_ad'),     href: '/post-ad' },
  ];

  const TOP_AREAS = [
    { label: lang === 'BN' ? 'গুলশান' : 'Gulshan', href: '/properties?area=Gulshan+2' },
    { label: lang === 'BN' ? 'বনানী' : 'Banani', href: '/properties?area=Banani' },
    { label: lang === 'BN' ? 'উত্তরা' : 'Uttara', href: '/properties?area=Uttara' },
    { label: lang === 'BN' ? 'বসুন্ধরা আ/এ' : 'Bashundhara R/A', href: '/properties?area=Bashundhara+R%2FA' },
    { label: lang === 'BN' ? 'পূর্বাচল' : 'Purbachal', href: '/properties?area=Purbachal' },
    { label: lang === 'BN' ? 'ধানমন্ডি' : 'Dhanmondi', href: '/properties?area=Dhanmondi' },
  ];

  const LEGAL = [
    { label: t('footer_privacy'), href: '/privacy' },
    { label: t('footer_terms'),   href: '/terms' },
    { label: t('footer_refunds'), href: '/refunds' },
  ];

  const stats = [
    { val: lang === 'BN' ? '১,৫০০+' : '1,500+', label: t('footer_listings') },
    { val: lang === 'BN' ? '৬৪' : '64', label: t('footer_districts') },
    { val: lang === 'BN' ? '৫০,০০০+' : '50K+', label: t('footer_users') },
  ];

  return (
    <footer className="backdrop-blur-md bg-slate-100/90 dark:bg-black/50 border-t border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-400 pt-16 pb-10 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-200 dark:border-white/10">

          {/* Brand */}
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-black text-lg shadow-glow-sm">
                P
              </div>
              <div>
                <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Plotify<span className="text-brand-500 dark:text-brand-400">.</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'BN' ? 'বাংলাদেশ রিয়েল এস্টেট' : 'Bangladesh Real Estate'}
                </div>
              </div>
            </Link>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
              {t('footer_tagline')}
            </p>

            {/* Platform Stats */}
            <div className="grid grid-cols-3 gap-3">
              {stats.map(s => (
                <div
                  key={s.label}
                  className="backdrop-blur-md bg-white/80 dark:bg-black/40 border border-slate-200 dark:border-white/15 rounded-xl p-3 text-center shadow-sm"
                >
                  <div className="text-base font-black text-brand-600 dark:text-brand-400">{s.val}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-black/30 backdrop-blur-md rounded-xl p-3">
              {t('footer_disclaimer')}
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4">
              {t('footer_explore')}
            </h4>
            <ul className="space-y-2.5">
              {EXPLORE.map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-xs text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Top Areas */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4">
              {t('footer_top_areas')}
            </h4>
            <ul className="space-y-2.5">
              {TOP_AREAS.map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-xs text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors">
                    {l.label}{lang === 'BN' ? ', ঢাকা' : ', Dhaka'}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Legal */}
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4">
                {t('footer_contact')}
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400 shrink-0 mt-0.5" />
                  <span>{settings.officeAddress || (lang === 'BN' ? 'লেভেল ৮, কনকর্ড টাওয়ার, রোড ১১, বনানী, ঢাকা-১২১৩' : 'Level 8, Concord Tower, Road 11, Banani, Dhaka-1213')}</span>
                </li>
                <li className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400 shrink-0" />
                  <a href={`tel:${settings.supportPhone || '+8809612000888'}`} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                    {settings.supportPhone || (lang === 'BN' ? '+৮৮০ ৯৬১২ ০০০ ৮৮৮' : '+880 9612 000 888')}
                  </a>
                </li>
                <li className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400 shrink-0" />
                  <a href={`mailto:${settings.supportEmail || 'support@plotify.store'}`} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                    {settings.supportEmail || 'support@plotify.store'}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4">
                {t('footer_legal')}
              </h4>
              <ul className="space-y-2">
                {LEGAL.map(l => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-xs text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-4">
          <p>© {lang === 'BN' ? toBanglaDigits(new Date().getFullYear()) : new Date().getFullYear()} {t('footer_copyright')}</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/privacy" className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link href="/refunds" className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
