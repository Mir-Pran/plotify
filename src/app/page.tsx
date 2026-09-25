'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import HeroSearch from '@/components/hero-search';
import PropertyCard from '@/components/property-card';
import { MOCK_PROPERTIES } from '@/lib/data/mock-properties';
import { DataStore } from '@/lib/data/store';
import { Property } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';
import {
  Building2, TreePine, Home, Hotel, Users, ArrowRight,
  ShieldCheck, MapPin, Zap, TrendingUp, CheckCircle2, Sparkles, Phone
} from 'lucide-react';

export default function HomePage() {
  const { lang, t } = useLanguage();
  const [properties, setProperties] = useState<Property[]>(() =>
    MOCK_PROPERTIES.filter(p => p.approval_status === 'approved')
  );

  useEffect(() => {
    const loadProps = () => {
      const stored = DataStore.getProperties();
      const approved = stored.filter(p => p.approval_status === 'approved');
      setProperties(approved);
    };
    loadProps();
    window.addEventListener('plotify_properties_updated', loadProps);
    return () => window.removeEventListener('plotify_properties_updated', loadProps);
  }, []);

  const CATEGORIES = [
    {
      icon: Building2,
      label: t('home_cat_flats'),
      count: lang === 'BN' ? '৬৮০+' : '680+',
      href: '/properties?category=flat',
      color: 'from-brand-600 to-brand-400',
    },
    {
      icon: Home,
      label: t('home_cat_houses'),
      count: lang === 'BN' ? '২৪৫+' : '245+',
      href: '/properties?category=house',
      color: 'from-teal-600 to-teal-400',
    },
    {
      icon: TreePine,
      label: t('home_cat_land'),
      count: lang === 'BN' ? '৪৯০+' : '490+',
      href: '/properties?category=land',
      color: 'from-amber-600 to-amber-400',
    },
    {
      icon: Users,
      label: t('home_cat_mess'),
      count: lang === 'BN' ? '১৮৫+' : '185+',
      href: '/properties?category=mess',
      color: 'from-purple-600 to-purple-400',
    },
    {
      icon: Hotel,
      label: t('home_cat_hotels'),
      count: lang === 'BN' ? '৯৫+' : '95+',
      href: '/properties?category=hotel',
      color: 'from-rose-600 to-rose-400',
    },
  ];

  const WHY_ITEMS = [
    {
      icon: ShieldCheck,
      title: t('why1_title'),
      desc: t('why1_desc'),
      color: 'text-brand-400',
      bg: 'bg-brand-500/10 border-brand-500/20',
    },
    {
      icon: CheckCircle2,
      title: t('why2_title'),
      desc: t('why2_desc'),
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      icon: MapPin,
      title: t('why3_title'),
      desc: t('why3_desc'),
      color: 'text-teal-400',
      bg: 'bg-teal-500/10 border-teal-500/20',
    },
    {
      icon: Sparkles,
      avatarImg: '/ploti-avatar.png',
      title: t('why4_title'),
      desc: t('why4_desc'),
      color: 'text-purple-400',
      bg: 'bg-brand-500/10 border-brand-500/30',
      action: 'ploti-ai',
    },
    {
      icon: Zap,
      title: t('why5_title'),
      desc: t('why5_desc'),
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
    },
    {
      icon: TrendingUp,
      title: t('why6_title'),
      desc: t('why6_desc'),
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
    },
  ];

  const FEATURED = properties.filter(p => p.isFeatured).slice(0, 6);
  const RECENT = [...properties].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);

  const trustBadges = [
    t('home_trust_listings'),
    t('home_trust_districts'),
    t('home_trust_users'),
    t('home_trust_rajuk'),
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">

      {/* ===================== HERO ===================== */}
      <section className="relative z-30 bg-transparent hero-glow pb-20 pt-16 sm:pt-20">
        {/* Ambient light glow - contained in its own overflow-hidden layer */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
          <div className="absolute top-20 -left-24 w-80 h-80 bg-brand-500/15 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-40 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-blob delay-300" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-slate-900 dark:text-white mb-5 leading-tight animate-fade-in">
              {t('home_hero_h1a')}{' '}
              <span className="text-gradient">{t('home_hero_h1b')}</span>
              <br />
              <span className="text-slate-700 dark:text-slate-200">{t('home_hero_h1c')}</span>
            </h1>

            {/* Subhead */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 animate-fade-in delay-100 leading-relaxed font-normal">
              {t('home_hero_sub')}
              <br className="hidden sm:block" />
              <strong className="text-brand-600 dark:text-brand-300 font-semibold">{t('home_hero_sub2')}</strong>
            </p>

            {/* Cascading Location Search Bar */}
            <div className="flex justify-center animate-fade-in delay-200 relative z-30">
              <HeroSearch />
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-xs text-slate-600 dark:text-slate-400 animate-fade-in delay-300">
              {trustBadges.map(s => (
                <span key={s} className="flex items-center gap-1.5 backdrop-blur-sm bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 px-3 py-1.5 rounded-full shadow-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
                  {s}
                </span>
              ))}
            </div>


          </div>
        </div>
      </section>

      {/* ===================== CATEGORIES ===================== */}
      <section className="relative z-10 py-16 backdrop-blur-md bg-slate-100/60 dark:bg-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{t('home_cat_title')}</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">{t('home_cat_sub')}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl backdrop-blur-md bg-white/80 dark:bg-black/40 border border-slate-200/80 dark:border-white/20 hover:border-brand-500/50 shadow-glass-card hover:shadow-glass-card-hover transition-all duration-300 card-hover text-center"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${cat.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-md`}>
                  <cat.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors">{cat.label}</div>
                  <div className="text-xs font-black text-brand-600 dark:text-brand-400 mt-1.5">{cat.count}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FEATURED ===================== */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-6 rounded-full bg-brand-500" />
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest">{t('home_featured_badge')}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{t('home_featured_title')}</h2>
            </div>
            <Link href="/properties?featured=true" className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-brand-600 dark:text-brand-400 hover:text-brand-500 transition-colors">
              {t('home_view_all')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURED.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link href="/properties" className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 dark:text-brand-400 hover:text-brand-500 transition-colors">
              {t('home_view_all')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== WHY PLOTIFY ===================== */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{t('home_why_title')}</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 max-w-xl mx-auto">{t('home_why_sub')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHY_ITEMS.map((w) => {
              const isPloti = (w as any).action === 'ploti-ai';
              return (
                <div
                  key={w.title}
                  onClick={() => {
                    if (isPloti) {
                      window.dispatchEvent(new Event('ploti-open'));
                    }
                  }}
                  className={`flex gap-4 p-5 rounded-2xl backdrop-blur-md bg-white/80 dark:bg-black/40 border border-slate-200/80 dark:border-white/20 shadow-glass-card card-hover transition-all ${
                    isPloti ? 'cursor-pointer hover:border-brand-500/60 hover:shadow-glow-sm group' : ''
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 p-1.5 ${w.bg}`}>
                    {(w as any).avatarImg ? (
                      <img
                        src={(w as any).avatarImg}
                        alt={w.title}
                        className="w-full h-full object-contain drop-shadow transition-transform group-hover:scale-110"
                      />
                    ) : (
                      <w.icon className={`w-5 h-5 ${w.color}`} />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                      {w.title}
                      {isPloti && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400 border border-brand-500/30">
                          {lang === 'BN' ? 'চ্যাট করুন →' : 'Chat →'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{w.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== RECENT LISTINGS ===================== */}
      <section className="relative z-10 py-16 backdrop-blur-md bg-slate-100/60 dark:bg-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-6 rounded-full bg-teal-500" />
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">{t('home_recent_badge')}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{t('home_recent_title')}</h2>
            </div>
            <Link href="/properties?sort=newest" className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-brand-600 dark:text-brand-400 hover:text-brand-500 transition-colors">
              {t('home_view_all')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {RECENT.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="relative z-10 py-20 backdrop-blur-md bg-slate-100/60 dark:bg-black/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="backdrop-blur-xl bg-white/90 dark:bg-black/40 border border-slate-200/80 dark:border-white/20 rounded-3xl p-8 sm:p-12 text-center shadow-glass-modal">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 mb-6 shadow-glow">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-4">
              {t('home_cta_title')}
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              {t('home_cta_sub')}{' '}
              <strong className="text-brand-600 dark:text-brand-300 font-bold">{t('home_cta_fee')}</strong>{' '}
              {t('home_cta_sub2')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/dashboard/add-property"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-black text-sm shadow-glow transition-all hover:scale-105"
              >
                <Building2 className="w-5 h-5" />
                {t('home_cta_btn_post')}
              </Link>
              <a
                href="https://wa.me/8809612000888?text=I%20want%20to%20list%20my%20property%20on%20Plotify"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl backdrop-blur-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/20 hover:border-brand-500/50 text-slate-800 dark:text-white font-bold text-sm transition-all hover:scale-105"
              >
                <Phone className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                {t('home_cta_btn_call')}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
