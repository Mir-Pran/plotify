'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, PlusCircle, Upload, Loader, CheckCircle2, CreditCard, Building2, ChevronDown, MapPin, X, Image as ImageIcon, ShieldCheck, AlertCircle } from 'lucide-react';
import { BD_DIVISIONS, BD_DISTRICTS, BD_DIVISIONS_BN, BD_DISTRICTS_BN, type BDDivision } from '@/lib/data/bd-locations';
import { ACTIVATION_FEES } from '@/lib/types';
import { calcActivationFee, formatBDTLocalized, toBanglaDigits } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { DataStore } from '@/lib/data/store';
import type { PropertyCategory, PropertyPurpose, AreaUnit } from '@/lib/types';

export default function AddPropertyPage() {
  const { lang, t } = useLanguage();
  const { user, isPersonal, isBusiness, isAdmin, loading: authLoading } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80'
  ]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    purpose: 'buy' as PropertyPurpose,
    category: 'flat' as PropertyCategory,
    division: 'Dhaka' as BDDivision,
    district: 'Dhaka',
    area: '',
    address: '',
    landmark: '',
    price: '',
    priceNegotiable: false,
    size: '',
    sizeUnit: 'sqft' as AreaUnit,
    bedrooms: '',
    bathrooms: '',
    facing: '',
    furnishing: '',
    rajukApproved: false,
    gasConnection: '',
    wasaWater: false,
    generatorBackup: false,
    securityGuard: false,
    cctv: false,
    liftCount: '',
    parkingSpaces: '',
    sellerName: '',
    sellerPhone: '',
    sellerWhatsapp: '',
    sellerType: 'owner',
  });

  const STEPS = [
    t('step_prop_info'),
    t('step_details'),
    t('step_media_contact'),
    t('step_review_pay'),
  ];

  const update = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleDivisionChange = (newDiv: BDDivision) => {
    setForm(f => ({
      ...f,
      division: newDiv,
      district: BD_DISTRICTS[newDiv]?.[0] || '', // auto-select first district in that division or clear
    }));
  };

  const activationFee = form.price && form.category
    ? calcActivationFee(form.category, Number(form.price))
    : DataStore.getFeeSchedule().find(f => f.category === form.category)?.minFee ?? 1000;

  const handleSubmit = async () => {
    setLoading(true);
    await DataStore.addProperty({
      sellerId: user?.id,
      sellerName: form.sellerName || user?.fullName || 'Business Seller',
      sellerPhone: form.sellerPhone || user?.mobile || '01700000000',
      sellerWhatsapp: form.sellerWhatsapp || form.sellerPhone || user?.mobile,
      sellerType: (form.sellerType as any) || 'owner',
      title: form.title || 'Dhaka Property Listing',
      description: form.description || 'Verified property listing on Plotify.',
      price: Number(form.price) || 5000000,
      priceUnit: form.purpose === 'rent' ? 'bdt_per_month' : 'bdt_total',
      priceNegotiable: form.priceNegotiable,
      purpose: form.purpose,
      category: form.category,
      division: form.division,
      district: form.district,
      area: form.area || 'Dhaka Area',
      address: form.address || 'Dhaka, Bangladesh',
      landmark: form.landmark,
      size: Number(form.size) || 1200,
      sizeUnit: form.sizeUnit,
      bedrooms: Number(form.bedrooms) || 3,
      bathrooms: Number(form.bathrooms) || 2,
      gasConnection: (form.gasConnection as any) || 'titas',
      wasaWater: form.wasaWater,
      generatorBackup: form.generatorBackup,
      securityGuard: form.securityGuard,
      cctv: form.cctv,
      liftCount: Number(form.liftCount) || 1,
      parkingSpaces: Number(form.parkingSpaces) || 1,
      featuredImage: uploadedImages[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80',
      images: uploadedImages.length > 0 ? uploadedImages : [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80'
      ],
      activationFee: Number(activationFee) || 2500,
      activationStatus: 'pending',
      status: 'available',
      approval_status: 'pending',
    });
    setLoading(false);
    setSubmitted(true);
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            setUploadedImages(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const inputCls = "w-full bg-white dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-brand-500/60 focus:bg-white dark:focus:bg-white/10 outline-none transition-all shadow-sm dark:shadow-none";
  const selectCls = "w-full bg-white dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-brand-500/60 focus:bg-white dark:focus:bg-white/10 outline-none transition-all cursor-pointer shadow-sm dark:shadow-none";

  // Guard: Not logged in
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-dark-800/90 rounded-3xl p-8 border border-slate-200 dark:border-dark-500 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Authentication Required</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Please log in to your verified Business Account to post and manage property listings on Plotify.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/auth/login?redirect=/dashboard/add-property" className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-glow-sm">
              Sign In →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Guard: Personal accounts cannot post listings
  if (!authLoading && isPersonal) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-dark-800/90 rounded-3xl p-8 border border-slate-200 dark:border-dark-500 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Business Account Required</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Personal accounts are restricted from posting property listings. To post apartments, plots, and commercial listings, upgrade to a Business Account with verified NID.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard" className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-600 text-xs font-bold text-slate-600 dark:text-slate-300">
              Back to Dashboard
            </Link>
            <Link href="/dashboard" className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-glow-sm">
              Upgrade to Business →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Guard: Unverified Business accounts blocked from posting ads (Requirement 2)
  if (!authLoading && (isBusiness || user?.role === 'business') && !user?.isVerified && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-900 flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center space-y-6 bg-white dark:bg-dark-800/90 rounded-3xl p-8 border border-amber-500/30 shadow-xl animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 inline-block">
              Verification Required
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Business Account Verification Pending
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {user?.upgradeStatus === 'pending_approval' || user?.verificationStatus === 'pending'
                ? 'Your verification documents (NID & official photograph) are currently under review by our admin team. Ad posting will be unlocked immediately once an admin approves your profile.'
                : 'All Business accounts must submit their National ID (NID) and official color photograph for admin approval before posting property ads.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-left text-xs text-amber-800 dark:text-amber-200 space-y-1.5">
            <div className="font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Status: {user?.isVerified ? 'Verified' : (user?.verificationStatus?.toUpperCase() || 'PENDING APPROVAL')}</span>
            </div>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 pl-6">
              Organization: <strong>{user?.organizationName || user?.businessName || 'Business Organization'}</strong>
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Link href="/dashboard" className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-600 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-700 transition-all">
              Back to Dashboard
            </Link>
            <Link href="/dashboard" className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              {user?.nidUrl ? 'Check Verification Status' : 'Complete Verification →'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-900 flex items-center justify-center p-6 transition-colors duration-200">
        <div className="max-w-md w-full text-center space-y-6 animate-fade-in backdrop-blur-xl bg-white/80 dark:bg-black/40 border border-slate-200/80 dark:border-white/20 rounded-3xl p-8 shadow-xl dark:shadow-glass-modal">
          <div className="w-20 h-20 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center mx-auto shadow-glow-sm">
            <CheckCircle2 className="w-10 h-10 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{t('form_submitted_h2')}</h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              {t('form_submitted_p')}
            </p>
          </div>
          <div className="backdrop-blur-md bg-slate-50 dark:bg-white/5 border border-brand-500/20 rounded-2xl p-5 text-left space-y-2">
            <div className="text-xs font-black text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-3">
              {lang === 'BN' ? 'পরবর্তী প্রক্রিয়া' : 'What happens next?'}
            </div>
            {[
              lang === 'BN' ? 'আমাদের দল আপনার সম্পত্তির তথ্য যাচাই করবে' : 'Our team verifies your property details',
              lang === 'BN' ? 'মালিকানা ও অন্যান্য নথি পরীক্ষা করা হবে' : 'Documents are checked for authenticity',
              lang === 'BN' ? '২৪ ঘণ্টার মধ্যে বিজ্ঞাপন লাইভ হবে' : 'Listing goes live within 24 hours',
              lang === 'BN' ? 'সরাসরি ক্রেতা ও ভাড়াটিয়ারা যোগাযোগ করতে পারবেন' : 'Buyers & tenants can contact you directly',
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200">
                <span className="w-5 h-5 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-600 dark:text-brand-400 font-black text-[10px] flex items-center justify-center shrink-0">
                  {lang === 'BN' ? toBanglaDigits(i + 1) : i + 1}
                </span>
                {s}
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard" className="px-6 py-3 rounded-xl border border-slate-200 dark:border-white/20 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
              {t('nav_dashboard')}
            </Link>
            <Link href="/properties" className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-glow-sm transition-all">
              {lang === 'BN' ? 'তালিকা দেখুন' : 'Browse Listings'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900 text-slate-900 dark:text-slate-100 py-8 transition-colors duration-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="p-2.5 rounded-xl backdrop-blur-md bg-white dark:bg-white/5 border border-slate-200 dark:border-white/20 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-brand-500/40 transition-all shadow-sm dark:shadow-none">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">{t('post_new_title')}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('post_new_sub')}</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div
                onClick={() => i <= step && setStep(i)}
                className={`flex flex-col items-center gap-1.5 cursor-pointer shrink-0 ${i <= step ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                  i < step ? 'bg-brand-500 text-white shadow-sm' :
                  i === step ? 'bg-brand-600 text-white ring-2 ring-brand-400/50 shadow-glow-sm' :
                  'bg-white/5 border border-white/20 text-slate-500'
                }`}>
                  {i < step ? <CheckCircle2 className="w-4 h-4" /> : (lang === 'BN' ? toBanglaDigits(i + 1) : i + 1)}
                </div>
                <span className={`text-[10px] font-bold whitespace-nowrap ${i === step ? 'text-brand-300' : i < step ? 'text-slate-300' : 'text-slate-500'}`}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 min-w-4 mx-1 mb-4 rounded-full transition-all ${i < step ? 'bg-brand-500' : 'bg-white/10'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form panels with iOS Glass Tile */}
        <div className="backdrop-blur-md bg-white/80 dark:bg-black/40 border border-slate-200/80 dark:border-white/20 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm dark:shadow-glass-card">

          {/* ===== Step 0: Property Info ===== */}
          {step === 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">{t('form_purpose')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['buy', 'rent', 'lease'] as const).map(p => (
                      <button key={p} type="button" onClick={() => update('purpose', p)}
                        className={`py-2.5 rounded-xl font-bold text-xs capitalize transition-all ${form.purpose === p ? 'bg-brand-600 text-white shadow-glow-sm' : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/20 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm dark:shadow-none'}`}>
                        {p === 'buy' ? t('card_for_sale') : p === 'rent' ? t('card_for_rent') : t('card_lease')}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">{t('form_category')}</label>
                  <select value={form.category} onChange={e => update('category', e.target.value)} className={selectCls}>
                    <option value="flat" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">{t('search_cat_flat')}</option>
                    <option value="house" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">{t('search_cat_house')}</option>
                    <option value="land" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">{t('search_cat_land')}</option>
                    <option value="mess" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">{t('search_cat_mess')}</option>
                    <option value="hotel" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">{t('search_cat_hotel')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">{t('form_title')}</label>
                <input type="text" value={form.title} onChange={e => update('title', e.target.value)}
                  placeholder={t('form_title_ph')}
                  className={inputCls} />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">{t('form_desc')}</label>
                <textarea rows={4} value={form.description} onChange={e => update('description', e.target.value)}
                  placeholder={t('form_desc_ph')}
                  className={`${inputCls} resize-none`} />
              </div>

              {/* ── Strict 2-Step Cascading Division & District Selector ── */}
              <div className="p-4 rounded-xl backdrop-blur-md bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 space-y-4">
                <div className="text-xs font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
                  {lang === 'BN' ? 'অবস্থান নির্বাচন (বিভাগ ও জেলা)' : 'Location Selection (Division & District)'}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Step 1: Divisions (All 8 official divisions) */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                      {t('form_division')}
                    </label>
                    <div className="relative">
                      <select
                        value={form.division}
                        onChange={e => handleDivisionChange(e.target.value as BDDivision)}
                        className={selectCls}
                      >
                        {BD_DIVISIONS.map(d => (
                          <option key={d} value={d} className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">
                            {lang === 'BN' ? BD_DIVISIONS_BN[d] : d}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  {/* Step 2: Districts (Dynamically updated based on selected division) */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                      {t('form_district')}
                    </label>
                    <div className="relative">
                      <select
                        value={form.district}
                        onChange={e => update('district', e.target.value)}
                        className={selectCls}
                      >
                        {BD_DISTRICTS[form.division]?.map(dist => (
                          <option key={dist} value={dist} className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">
                            {lang === 'BN' ? (BD_DISTRICTS_BN[dist] ?? dist) : dist}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Area within the District */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                    {t('form_area')}
                  </label>
                  <input
                    type="text"
                    value={form.area}
                    onChange={e => update('area', e.target.value)}
                    placeholder={t('form_area_ph')}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">{t('form_address')}</label>
                <input type="text" value={form.address} onChange={e => update('address', e.target.value)}
                  placeholder={t('form_address_ph')}
                  className={inputCls} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">{t('form_price')}</label>
                  <input type="number" value={form.price} onChange={e => update('price', e.target.value)}
                    placeholder={form.purpose === 'buy' ? '68000000' : '65000'}
                    className={inputCls} />
                  {form.price && (
                    <p className="text-xs text-brand-300 mt-1 font-semibold">
                      {formatBDTLocalized(Number(form.price), form.purpose === 'rent', lang)}
                    </p>
                  )}
                </div>
                <div className="flex items-end pb-3">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 backdrop-blur-sm bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl w-full">
                    <input type="checkbox" checked={form.priceNegotiable} onChange={e => update('priceNegotiable', e.target.checked)} className="w-4 h-4 accent-brand-500 rounded" />
                    {t('form_negotiable')}
                  </label>
                </div>
              </div>
            </>
          )}

          {/* ===== Step 1: Details & Features ===== */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">{t('form_size')}</label>
                  <input type="number" value={form.size} onChange={e => update('size', e.target.value)}
                    placeholder="1500"
                    className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">{t('form_unit')}</label>
                  <select value={form.sizeUnit} onChange={e => update('sizeUnit', e.target.value)} className={selectCls}>
                    <option value="sqft" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">{lang === 'BN' ? 'বর্গফুট' : 'Sq Ft'}</option>
                    <option value="katha" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">{lang === 'BN' ? 'কাঠা' : 'Katha'}</option>
                    <option value="bigha" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">{lang === 'BN' ? 'বিঘা' : 'Bigha'}</option>
                    <option value="decimal" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">{lang === 'BN' ? 'শতাংশ' : 'Decimal'}</option>
                    <option value="shotangso" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">{lang === 'BN' ? 'শতাংশ' : 'Shotangso'}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">{lang === 'BN' ? 'মুখোমুখী' : 'Facing'}</label>
                  <select value={form.facing} onChange={e => update('facing', e.target.value)} className={selectCls}>
                    <option value="" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">{lang === 'BN' ? 'নির্বাচন করুন' : 'Select'}</option>
                    {[
                      { en: 'North', bn: 'উত্তর' },
                      { en: 'South', bn: 'দক্ষিণ' },
                      { en: 'East', bn: 'পূর্ব' },
                      { en: 'West', bn: 'পশ্চিম' },
                      { en: 'North-East', bn: 'উত্তর-পূর্ব' },
                      { en: 'South-East', bn: 'দক্ষিণ-পূর্ব' },
                    ].map(f => (
                      <option key={f.en} value={f.en} className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">
                        {lang === 'BN' ? f.bn : f.en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">{t('form_bedrooms')}</label>
                  <input type="number" min="0" value={form.bedrooms} onChange={e => update('bedrooms', e.target.value)} placeholder="3"
                    className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">{t('form_bathrooms')}</label>
                  <input type="number" min="0" value={form.bathrooms} onChange={e => update('bathrooms', e.target.value)} placeholder="2"
                    className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">{lang === 'BN' ? 'আসবাবপত্র' : 'Furnishing'}</label>
                  <select value={form.furnishing} onChange={e => update('furnishing', e.target.value)} className={selectCls}>
                    <option value="" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">{lang === 'BN' ? 'প্রযোজ্য নয়' : 'N/A'}</option>
                    <option value="unfurnished" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">{lang === 'BN' ? 'আসবাবহীন' : 'Unfurnished'}</option>
                    <option value="semi_furnished" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">{lang === 'BN' ? 'আংশিক সজ্জিত' : 'Semi-Furnished'}</option>
                    <option value="fully_furnished" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">{lang === 'BN' ? 'পূর্ণ সজ্জিত' : 'Fully Furnished'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-3">
                  {lang === 'BN' ? 'সুযোগ-সুবিধাসমূহ' : 'Bangladesh Facilities'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'isReady', label: lang === 'BN' ? '🏗️ রেডি প্রোপার্টি' : '🏗️ Ready for Handover' },
                    { key: 'wasaWater', label: lang === 'BN' ? '💧 ওয়াসা পানি' : '💧 WASA Water' },
                    { key: 'generatorBackup', label: lang === 'BN' ? '⚡ জেনারেটর ব্যাকআপ' : '⚡ Generator Backup' },
                    { key: 'securityGuard', label: lang === 'BN' ? '🔒 নিরাপত্তা প্রহরী' : '🔒 Security Guard' },
                    { key: 'cctv', label: lang === 'BN' ? '📷 সিসিটিভি ক্যামেরা' : '📷 CCTV Camera' },
                  ].map(f => (
                    <label key={f.key} className="flex items-center gap-2.5 backdrop-blur-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 rounded-xl p-3 cursor-pointer hover:border-brand-500/30 transition-all shadow-sm dark:shadow-none">
                      <input type="checkbox" checked={!!(form as any)[f.key]} onChange={e => update(f.key, e.target.checked)} className="w-4 h-4 accent-brand-500 shrink-0 rounded" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                    {lang === 'BN' ? 'গ্যাস সংযোগ' : 'Gas Connection'}
                  </label>
                  <select value={form.gasConnection} onChange={e => update('gasConnection', e.target.value)} className={selectCls}>
                    <option value="" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">{lang === 'BN' ? 'নেই' : 'None'}</option>
                    <option value="titas" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">{lang === 'BN' ? 'তিতাস গ্যাস (পাইপলাইন)' : 'Titas Gas (Pipeline)'}</option>
                    <option value="lpg" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">{lang === 'BN' ? 'এলপিজি সিলিন্ডার' : 'LPG Cylinder'}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                    {lang === 'BN' ? 'লিফট সংখ্যা' : 'No. of Lifts'}
                  </label>
                  <input type="number" min="0" value={form.liftCount} onChange={e => update('liftCount', e.target.value)} placeholder="2"
                    className={inputCls} />
                </div>
              </div>
            </>
          )}

          {/* ===== Step 2: Media & Contact ===== */}
          {step === 2 && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    {lang === 'BN' ? 'সম্পত্তির ছবি' : 'Property Photos'}
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {uploadedImages.length} {lang === 'BN' ? 'টি ছবি নির্বাচিত' : 'photos selected'}
                  </span>
                </div>

                <input
                  type="file"
                  ref={imageInputRef}
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => handleImageUpload(e.target.files)}
                />

                <div
                  onClick={() => imageInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    handleImageUpload(e.dataTransfer.files);
                  }}
                  className="border-2 border-dashed border-slate-300 dark:border-white/20 rounded-2xl p-8 text-center hover:border-brand-500/60 dark:hover:border-brand-500/40 transition-all cursor-pointer backdrop-blur-sm bg-slate-50 dark:bg-white/5"
                >
                  <Upload className="w-8 h-8 text-brand-500 dark:text-brand-400 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {lang === 'BN' ? 'ছবি এখানে ড্র্যাগ করুন বা ব্রাউজ করতে ক্লিক করুন' : 'Drag & drop photos here, or click to browse'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {lang === 'BN' ? 'সর্বোচ্চ ২০টি ছবি। JPEG/PNG/WebP।' : 'Max 20 photos. JPEG/PNG/WebP. First photo = featured image.'}
                  </p>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-4">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden aspect-video border border-slate-200 dark:border-white/10 group">
                        <img src={img} alt={`Uploaded ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedImages(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="absolute top-1 right-1 p-1 rounded-md bg-black/70 text-white hover:text-rose-400 transition-colors opacity-90 group-hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-600 text-white">
                            Featured
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  {lang === 'BN' ? 'যোগাযোগের তথ্য' : 'Contact Information'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{t('form_seller_name')}</label>
                    <input type="text" value={form.sellerName} onChange={e => update('sellerName', e.target.value)}
                      placeholder={lang === 'BN' ? 'আপনার পূর্ণ নাম' : 'Full Name'}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{t('form_seller_type')}</label>
                    <select value={form.sellerType} onChange={e => update('sellerType', e.target.value)} className={selectCls}>
                      <option value="owner" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">{t('seller_owner')}</option>
                      <option value="developer" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">{t('seller_developer')}</option>
                      <option value="agency" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">{t('seller_agency')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{t('form_seller_phone')}</label>
                    <input type="tel" value={form.sellerPhone} onChange={e => update('sellerPhone', e.target.value)} placeholder="+880 1X XX XXXXXX"
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      {lang === 'BN' ? 'হোয়াটসঅ্যাপ নম্বর (ঐচ্ছিক)' : 'WhatsApp (optional)'}
                    </label>
                    <input type="tel" value={form.sellerWhatsapp} onChange={e => update('sellerWhatsapp', e.target.value)}
                      placeholder={lang === 'BN' ? 'মোবাইল নম্বরের অনুরূপ' : 'Same as mobile'}
                      className={inputCls} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ===== Step 3: Review & Pay ===== */}
          {step === 3 && (
            <>
              <div className="space-y-4">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {lang === 'BN' ? 'বিজ্ঞাপনের সারসংক্ষেপ' : 'Listing Summary'}
                </h3>
                <div className="backdrop-blur-md bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 rounded-xl p-5 space-y-3 text-sm">
                  {[
                    { label: lang === 'BN' ? 'শিরোনাম' : 'Title', value: form.title || '—' },
                    { label: lang === 'BN' ? 'উদ্দেশ্য' : 'Purpose', value: form.purpose === 'buy' ? t('card_for_sale') : form.purpose === 'rent' ? t('card_for_rent') : t('card_lease') },
                    { label: lang === 'BN' ? 'ধরন' : 'Category', value: form.category },
                    {
                      label: lang === 'BN' ? 'অবস্থান' : 'Location',
                      value: `${form.area ? form.area + ', ' : ''}${lang === 'BN' ? (BD_DISTRICTS_BN[form.district] ?? form.district) : form.district}, ${lang === 'BN' ? BD_DIVISIONS_BN[form.division] : form.division}`
                    },
                    { label: lang === 'BN' ? 'মূল্য' : 'Price', value: form.price ? formatBDTLocalized(Number(form.price), form.purpose === 'rent', lang) : '—' },
                    { label: lang === 'BN' ? 'আয়তন' : 'Size', value: form.size ? `${lang === 'BN' ? toBanglaDigits(form.size) : form.size} ${form.sizeUnit}` : '—' },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between border-b border-slate-200 dark:border-white/10 pb-2 last:border-0 last:pb-0">
                      <span className="text-slate-500 dark:text-slate-400 capitalize">{r.label}</span>
                      <span className="text-slate-800 dark:text-slate-100 font-medium capitalize">{r.value}</span>
                    </div>
                  ))}
                </div>

                {/* Activation fee */}
                <div className="backdrop-blur-md bg-brand-500/10 border border-brand-500/30 rounded-2xl p-5">
                  <h4 className="text-sm font-black text-brand-600 dark:text-brand-300 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    {lang === 'BN' ? 'বিজ্ঞাপন সক্রিয়করণ ফি' : 'Listing Activation Fee'}
                  </h4>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {lang === 'BN' ? 'এককালীন সক্রিয়করণ ফি' : `One-time activation for ${form.category}`}
                    </span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {formatBDTLocalized(activationFee, false, lang)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                    {lang === 'BN'
                      ? 'পেমেন্ট সম্পন্ন হলে আপনার বিজ্ঞাপনটি যাচাই করে ২৪ ঘণ্টার মধ্যে প্রকাশ করা হবে।'
                      : 'After payment, your listing will be reviewed and published within 24 hours. Fee ranges: Flats/Houses Tk1,000–5,000 · Land Tk700–4,500.'}
                  </p>

                  {/* Payment mock */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {['bKash 🔴', 'Nagad 🟠', 'Rocket 🟣', 'Card 💳'].map(m => (
                      <button key={m} className="py-2.5 px-3 rounded-xl backdrop-blur-md bg-white dark:bg-white/5 border border-slate-200 dark:border-white/20 hover:border-brand-500/40 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm dark:shadow-none">
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-black text-sm shadow-glow transition-all disabled:opacity-60"
                >
                  {loading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <><CheckCircle2 className="w-5 h-5" /> {lang === 'BN' ? 'নিশ্চিত করুন ও প্রকাশ করুন' : 'Confirm & Publish Listing'}</>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/10">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/20 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all disabled:opacity-30"
            >
              ← {t('form_back')}
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'BN'
                ? `ধাপ ${toBanglaDigits(step + 1)} / ${toBanglaDigits(STEPS.length)}`
                : `Step ${step + 1} of ${STEPS.length}`}
            </span>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-glow-sm transition-all"
              >
                {t('form_next')} →
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
