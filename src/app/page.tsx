'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import HeroSearch from '@/components/hero-search';
import PropertyCard from '@/components/property-card';
import { MOCK_PROPERTIES } from '@/lib/data/mock-properties';
import { DataStore } from '@/lib/data/store';
import { Property } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';
import {
  Building2, TreePine, Home, Hotel, Users, ArrowRight, Star,
  ShieldCheck, MapPin, Zap, TrendingUp, CheckCircle2, Bot, Phone
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

  const TOP_CITIES = [
    {
      name: lang === 'BN' ? 'ঢাকা' : 'Dhaka',
      count: lang === 'BN' ? '৮৫০+ বিজ্ঞাপন' : '850+ listings',
      img: 'https://images.unsplash.com/photo-1588497859490-85d1c17db96d?auto=format&fit=crop&w=600&q=80',
      href: '/properties?district=Dhaka',
    },
    {
      name: lang === 'BN' ? 'চট্টগ্রাম' : 'Chattogram',
      count: lang === 'BN' ? '৩২০+ বিজ্ঞাপন' : '320+ listings',
      img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80',
      href: '/properties?district=Chattogram',
    },
    {
      name: lang === 'BN' ? 'সিলেট' : 'Sylhet',
      count: lang === 'BN' ? '১৭৫+ বিজ্ঞাপন' : '175+ listings',
      img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80',
      href: '/properties?district=Sylhet',
    },
    {
      name: lang === 'BN' ? 'রাজশাহী' : 'Rajshahi',
      count: lang === 'BN' ? '১২০+ বিজ্ঞাপন' : '120+ listings',
      img: 'https://images.unsplash.com/photo-1543206540-1a10d5e3b8d2?auto=format&fit=crop&w=600&q=80',
      href: '/properties?district=Rajshahi',
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
      icon: Bot,
      title: t('why4_title'),
      desc: t('why4_desc'),
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
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

  const TESTIMONIALS = [
    {
      name: lang === 'BN' ? 'তাহমিনা আক্তার' : 'Tahmina Akter',
      role: lang === 'BN' ? 'বসুন্ধরায় ফ্ল্যাট ক্রেতা' : 'Bought a Flat in Bashundhara',
      text: lang === 'BN'
        ? 'প্লটিফাই আমাকে সরাসরি ডেভেলপারের সাথে যুক্ত করেছিল। কোনো ঝামেলা বা অতিরিক্ত দালালি নেই। ২ দিনের মধ্যে সব নথি যাচাই করেছি!'
        : 'Plotify connected me directly with the developer. No hassle, no agent fees. Verified everything in 2 days!',
      stars: 5,
    },
    {
      name: lang === 'BN' ? 'ইঞ্জিনিয়ার কামাল হোসেন' : 'Engr. Kamal Hossain',
      role: lang === 'BN' ? 'পূর্বাচলে জমি বিক্রেতা' : 'Sold Land in Purbachal',
      text: lang === 'BN'
        ? 'মাত্র কয়েক মিনিটে আমার ৮ কাঠার প্লট পোস্ট করেছি। ৩ দিনের মধ্যে ১২টি প্রকৃত ক্রেতার প্রস্তাব পেয়েছি। চমৎকার সেবা!'
        : 'Posted my 8-Katha plot with the mobile form in minutes. Got 12 genuine inquiries in 3 days. Incredible reach!',
      stars: 5,
    },
    {
      name: lang === 'BN' ? 'সাদিয়া ইসলাম' : 'Sadia Islam',
      role: lang === 'BN' ? 'উত্তরায় ভাড়াটে' : 'Renting in Uttara',
      text: lang === 'BN'
        ? 'প্লটি এআই আমাকে মেট্রোর কাছে যাচাইকৃত ফ্ল্যাট খুঁজে পেতে সাহায্য করেছে। এক সপ্তাহের মধ্যে নতুন বাসা পেয়েছি!'
        : 'The Ploti AI helped me filter verified flats near the Metro. Found my home in a week!',
      stars: 5,
    },
  ];

  const trustBadges = [
    t('home_trust_listings'),
    t('home_trust_districts'),
    t('home_trust_users'),
    t('home_trust_rajuk'),
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">

      {/* ===================== HERO ===================== */}
      <section className="relative z-30 bg-transparent hero-glow pb-20 pt-16 sm:pt-24">
        {/* Ambient light glow - contained in its own overflow-hidden layer */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
          <div className="absolute top-20 -left-24 w-80 h-80 bg-brand-500/15 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-40 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-blob delay-300" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">

            {/* Tagline pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md bg-white/80 dark:bg-black/40 border border-slate-200/80 dark:border-white/20 mb-6 shadow-sm animate-fade-in">
              <Star className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400 fill-brand-500 dark:fill-brand-400" />
              <span className="text-xs font-bold text-brand-700 dark:text-brand-300 tracking-wide">
                {t('home_hero_badge')}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-slate-900 dark:text-white mb-5 leading-tight animate-fade-in delay-100">
              {t('home_hero_h1a')}{' '}
              <span className="text-gradient">{t('home_hero_h1b')}</span>
              <br />
              <span className="text-slate-700 dark:text-slate-200">{t('home_hero_h1c')}</span>
            </h1>

            {/* Subhead */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 animate-fade-in delay-200 leading-relaxed font-normal">
              {t('home_hero_sub')}
              <br className="hidden sm:block" />
              <strong className="text-brand-600 dark:text-brand-300 font-semibold">{t('home_hero_sub2')}</strong>
            </p>

            {/* Cascading Location Search Bar */}
            <div className="flex justify-center animate-fade-in delay-300 relative z-30">
              <HeroSearch />
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-xs text-slate-600 dark:text-slate-400 animate-fade-in delay-400">
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
      <section className="relative z-10 py-16 backdrop-blur-md bg-slate-100/60 dark:bg-black/30 border-y border-slate-200/80 dark:border-white/10">
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

      {/* ===================== TOP CITIES ===================== */}
      <section className="relative z-10 py-16 backdrop-blur-md bg-slate-100/60 dark:bg-black/30 border-y border-slate-200/80 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{t('home_cities_title')}</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">{t('home_cities_sub')}</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {TOP_CITIES.map((city) => (
              <Link
                key={city.name}
                href={city.href}
                className="group relative overflow-hidden rounded-2xl aspect-[4/3] block backdrop-blur-md bg-white/80 dark:bg-black/40 border border-slate-200/80 dark:border-white/20 shadow-glass-card hover:shadow-glass-card-hover transition-all duration-300"
              >
                <Image
                  src={city.img}
                  alt={city.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900/95 via-dark-900/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="text-white font-black text-lg leading-tight">{city.name}</div>
                  <div className="text-brand-300 text-xs font-semibold">{city.count}</div>
                </div>
                <div className="absolute top-3 right-3 p-1.5 rounded-lg backdrop-blur-md bg-black/60 border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-3.5 h-3.5 text-brand-300" />
                </div>
              </Link>
            ))}
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
            {WHY_ITEMS.map((w) => (
              <div
                key={w.title}
                className="flex gap-4 p-5 rounded-2xl backdrop-blur-md bg-white/80 dark:bg-black/40 border border-slate-200/80 dark:border-white/20 shadow-glass-card card-hover"
              >
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${w.bg}`}>
                  <w.icon className={`w-5 h-5 ${w.color}`} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">{w.title}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{w.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== RECENT LISTINGS ===================== */}
      <section className="relative z-10 py-16 backdrop-blur-md bg-slate-100/60 dark:bg-black/30 border-y border-slate-200/80 dark:border-white/10">
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

      {/* ===================== TESTIMONIALS ===================== */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{t('home_testimonials_title')}</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">{t('home_testimonials_sub')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((tItem) => (
              <div
                key={tItem.name}
                className="p-6 rounded-2xl backdrop-blur-md bg-white/80 dark:bg-black/40 border border-slate-200/80 dark:border-white/20 shadow-glass-card card-hover"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: tItem.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-5 italic">"{tItem.text}"</p>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{tItem.name}</div>
                  <div className="text-xs text-brand-600 dark:text-brand-400 mt-0.5">{tItem.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="relative z-10 py-20 backdrop-blur-md bg-slate-100/60 dark:bg-black/30 border-y border-slate-200/80 dark:border-white/10">
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
