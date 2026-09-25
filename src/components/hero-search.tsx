'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Building2, Navigation, Loader } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import {
  BD_DIVISIONS,
  BD_DISTRICTS,
  BD_DIVISIONS_BN,
  BD_DISTRICTS_BN,
  type BDDivision,
} from '@/lib/data/bd-locations';
import type { PropertyCategory, PropertyPurpose } from '@/lib/types';
import { GlassSelect } from '@/components/ui/glass-select';
import { BudgetSelect, TakaIcon } from '@/components/ui/budget-select';

interface HeroSearchProps {
  initialPurpose?: PropertyPurpose;
}

export default function HeroSearch({ initialPurpose = 'buy' }: HeroSearchProps) {
  const router = useRouter();
  const { lang, t } = useLanguage();

  const [purpose, setPurpose]     = useState<PropertyPurpose>(initialPurpose);
  const [division, setDivision]   = useState<BDDivision | ''>('');
  const [district, setDistrict]   = useState('');
  const [category, setCategory]   = useState<PropertyCategory | ''>('');
  const [budget, setBudget]       = useState('');
  const [customMin, setCustomMin] = useState('');
  const [customMax, setCustomMax] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  const handleDivisionChange = (val: BDDivision | '') => {
    setDivision(val);
    setDistrict('');          // Reset district when division changes
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set('purpose', purpose);
    if (category) params.set('category', category);
    if (division) params.set('division', division);
    if (district) params.set('district', district);
    if (budget === 'custom' || customMin || customMax) {
      if (customMin) params.set('minPrice', String(customMin));
      if (customMax) params.set('maxPrice', String(customMax));
    } else if (budget) {
      const budgetMap: Record<string, [number, number | null]> = {
        under_50l:   [0, 5_000_000],
        '50l_1cr':   [5_000_000, 10_000_000],
        '1cr_3cr':   [10_000_000, 30_000_000],
        above_3cr:   [30_000_000, null],
        under_15k:   [0, 15_000],
        '15k_40k':   [15_000, 40_000],
        '40k_100k':  [40_000, 100_000],
        above_100k:  [100_000, null],
      };
      const [min, max] = budgetMap[budget] ?? [null, null];
      if (min !== null) params.set('minPrice', String(min));
      if (max !== null) params.set('maxPrice', String(max));
    }
    router.push(`/properties?${params.toString()}`);
  };

  const findNearby = () => {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const params = new URLSearchParams();
        params.set('lat', String(coords.latitude));
        params.set('lng', String(coords.longitude));
        params.set('nearby', 'true');
        params.set('purpose', purpose);
        router.push(`/properties?${params.toString()}`);
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        alert(lang === 'EN'
          ? 'Location access denied. Please enable GPS permissions.'
          : 'লোকেশন অ্যাক্সেস অস্বীকৃত। অনুগ্রহ করে জিপিএস অনুমতি চালু করুন।');
      },
      { timeout: 10000 }
    );
  };

  const TABS = [
    { label: t('search_purpose_buy'),   val: 'buy'   as PropertyPurpose },
    { label: t('search_purpose_rent'),  val: 'rent'  as PropertyPurpose },
    { label: t('search_purpose_lease'), val: 'lease' as PropertyPurpose },
  ];

  const BUDGET_OPTIONS = purpose === 'buy' ? [
    { label: t('budget_buy_under50l'), val: 'under_50l' },
    { label: t('budget_buy_50l1cr'),   val: '50l_1cr'  },
    { label: t('budget_buy_1cr3cr'),   val: '1cr_3cr'  },
    { label: t('budget_buy_above3cr'), val: 'above_3cr' },
  ] : [
    { label: t('budget_rent_u15k'),    val: 'under_15k'  },
    { label: t('budget_rent_15k40k'),  val: '15k_40k'    },
    { label: t('budget_rent_40k1l'),   val: '40k_100k'   },
    { label: t('budget_rent_above1l'), val: 'above_100k' },
  ];

  const divisionOptions = [
    { value: '', label: t('search_all_bangladesh') },
    ...BD_DIVISIONS.map(div => ({
      value: div,
      label: lang === 'BN' ? BD_DIVISIONS_BN[div] : div,
    })),
  ];

  const districtOptions = division
    ? [
        { value: '', label: t('search_select_district') },
        ...BD_DISTRICTS[division].map(d => ({
          value: d,
          label: lang === 'BN' ? (BD_DISTRICTS_BN[d] ?? d) : d,
        })),
      ]
    : [{ value: '', label: t('search_all_bangladesh') }];

  const categoryOptions = [
    { value: '', label: t('search_all_categories') },
    { value: 'flat', label: t('search_cat_flat') },
    { value: 'house', label: t('search_cat_house') },
    { value: 'land', label: t('search_cat_land') },
    { value: 'mess', label: t('search_cat_mess') },
    { value: 'hotel', label: t('search_cat_hotel') },
  ];

  const budgetOptions = [
    { value: '', label: t('search_any_budget') },
    ...BUDGET_OPTIONS.map(b => ({ value: b.val, label: b.label })),
  ];

  const labelCls = 'text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1';

  return (
    <div className="w-full max-w-4xl glass-search rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative z-30">
      {/* Purpose tabs */}
      <div className="flex items-center gap-1 mb-5 p-1 bg-slate-200/50 dark:bg-dark-900/60 backdrop-blur-sm rounded-xl border border-slate-300/40 dark:border-white/8">
        {TABS.map(tab => (
          <button
            key={tab.val}
            type="button"
            onClick={() => { setPurpose(tab.val); setBudget(''); setCustomMin(''); setCustomMax(''); }}
            className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              purpose === tab.val
                ? 'bg-brand-600 text-white shadow-glow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search row */}
      <form onSubmit={handleSearch}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">

          {/* ── Division ─────────────────────────────── */}
          <div className="flex flex-col">
            <label className={labelCls}>
              <MapPin className="w-3 h-3 text-brand-500 dark:text-brand-400" />
              {t('search_label_division')}
            </label>
            <GlassSelect
              value={division}
              onChange={val => handleDivisionChange(val as BDDivision | '')}
              options={divisionOptions}
            />
          </div>

          {/* ── District (cascading) ─────────────────── */}
          <div className="flex flex-col">
            <label className={labelCls}>
              <MapPin className="w-3 h-3 text-teal-600 dark:text-teal-400" />
              {t('search_label_district')}
            </label>
            <GlassSelect
              value={district}
              onChange={val => setDistrict(val)}
              options={districtOptions}
              disabled={!division}
            />
          </div>

          {/* ── Category ─────────────────────────────── */}
          <div className="flex flex-col">
            <label className={labelCls}>
              <Building2 className="w-3 h-3 text-brand-500 dark:text-brand-400" />
              {t('search_label_category')}
            </label>
            <GlassSelect
              value={category}
              onChange={val => setCategory(val as PropertyCategory | '')}
              options={categoryOptions}
            />
          </div>

          {/* ── Budget ───────────────────────────────── */}
          <div className="flex flex-col">
            <label className={labelCls}>
              <TakaIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 font-bold" />
              {t('search_label_budget')}
            </label>
            <BudgetSelect
              value={budget}
              customMin={customMin}
              customMax={customMax}
              onChange={(val, min, max) => {
                setBudget(val);
                if (min !== undefined) setCustomMin(min);
                if (max !== undefined) setCustomMax(max);
              }}
              options={BUDGET_OPTIONS}
              placeholder={t('search_any_budget')}
            />
          </div>

          {/* ── Actions ──────────────────────────────── */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-transparent uppercase tracking-wider">.</label>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-glow-sm hover:shadow-glow transition-all"
              >
                <Search className="w-4 h-4" />
                {t('search_btn')}
              </button>
              <button
                type="button"
                onClick={findNearby}
                disabled={gpsLoading}
                title={lang === 'EN' ? 'Find Nearby Properties via GPS' : 'জিপিএস দিয়ে কাছের সম্পত্তি খুঁজুন'}
                className="w-10 flex items-center justify-center bg-slate-100 dark:bg-white/5 backdrop-blur-sm border border-brand-500/30 hover:border-brand-500/60 hover:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl transition-all disabled:opacity-50 shrink-0"
              >
                {gpsLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* GPS hint */}
      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-1">
        <Navigation className="w-3 h-3 text-brand-500 dark:text-brand-400" />
        {t('search_gps_hint')}
      </p>
    </div>
  );
}
