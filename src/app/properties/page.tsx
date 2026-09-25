'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PropertyCard from '@/components/property-card';
import { MOCK_PROPERTIES } from '@/lib/data/mock-properties';
import { DataStore } from '@/lib/data/store';
import {
  BD_DIVISIONS,
  BD_DISTRICTS,
  BD_DIVISIONS_BN,
  BD_DISTRICTS_BN,
  type BDDivision,
} from '@/lib/data/bd-locations';
import type { Property, PropertyCategory, PropertyPurpose, SearchFilters } from '@/lib/types';
import { distanceKm, formatBDTLocalized, toBanglaDigits } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import {
  Search, SlidersHorizontal, Navigation, Loader, X,
  ChevronDown, LayoutGrid, List, MapPin, CheckCircle2
} from 'lucide-react';

function PropertiesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { lang, t } = useLanguage();

  const [filters, setFilters] = useState<SearchFilters>({
    purpose: (searchParams.get('purpose') as PropertyPurpose) || undefined,
    category: (searchParams.get('category') as PropertyCategory) || undefined,
    division: searchParams.get('division') || undefined,
    district: searchParams.get('district') || undefined,
    area: searchParams.get('area') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sort: (searchParams.get('sort') as any) || 'newest',
    keyword: searchParams.get('keyword') || undefined,
    lat: searchParams.get('lat') ? Number(searchParams.get('lat')) : undefined,
    lng: searchParams.get('lng') ? Number(searchParams.get('lng')) : undefined,
    nearbyMode: searchParams.get('nearby') === 'true',
  });

  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [keyword, setKeyword] = useState(filters.keyword || '');

  // Keep state synced with searchParams on navigation
  useEffect(() => {
    setFilters({
      purpose: (searchParams.get('purpose') as PropertyPurpose) || undefined,
      category: (searchParams.get('category') as PropertyCategory) || undefined,
      division: searchParams.get('division') || undefined,
      district: searchParams.get('district') || undefined,
      area: searchParams.get('area') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      sort: (searchParams.get('sort') as any) || 'newest',
      keyword: searchParams.get('keyword') || undefined,
      lat: searchParams.get('lat') ? Number(searchParams.get('lat')) : undefined,
      lng: searchParams.get('lng') ? Number(searchParams.get('lng')) : undefined,
      nearbyMode: searchParams.get('nearby') === 'true',
    });
    setKeyword(searchParams.get('keyword') || '');
  }, [searchParams]);

  const findNearby = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      alert(lang === 'BN' ? 'আপনার ব্রাউজার জিপিএস সমর্থন করে না।' : 'Geolocation is not supported by your browser.');
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat = Number(coords.latitude.toFixed(6));
        const lng = Number(coords.longitude.toFixed(6));
        setFilters(f => ({
          ...f,
          lat,
          lng,
          nearbyMode: true,
          sort: 'nearest',
        }));
        const params = new URLSearchParams(window.location.search);
        params.set('lat', String(lat));
        params.set('lng', String(lng));
        params.set('nearby', 'true');
        params.set('sort', 'nearest');
        router.push(`/properties?${params.toString()}`);
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        console.warn('Geolocation error:', err);
        alert(lang === 'BN' ? 'লোকেশন অ্যাক্সেস অস্বীকৃত বা পাওয়া যায়নি। অনুগ্রহ করে ব্রাউজার পারমিশন চেক করুন।' : 'Location access denied or unavailable. Please enable browser permissions.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const [propertiesList, setPropertiesList] = useState<Property[]>(() => MOCK_PROPERTIES);

  // Sync client-side database listings after hydration to prevent SSR mismatch
  useEffect(() => {
    const loadStored = () => {
      setPropertiesList(DataStore.getProperties());
    };
    loadStored();
    window.addEventListener('plotify_properties_updated', loadStored);
    return () => window.removeEventListener('plotify_properties_updated', loadStored);
  }, []);

  const applyFilters = (f: SearchFilters, sourceList: Property[]): Property[] => {
    // Strict requirement: Only approved listings appear publicly
    let results = sourceList.filter(p => p.approval_status === 'approved');

    if (f.purpose) results = results.filter(p => p.purpose === f.purpose);
    if (f.category) results = results.filter(p => p.category === f.category);
    if (f.division) results = results.filter(p => p.division.toLowerCase() === f.division!.toLowerCase());
    if (f.district) results = results.filter(p => p.district.toLowerCase() === f.district!.toLowerCase());
    if (f.area) results = results.filter(p => p.area.toLowerCase().includes(f.area!.toLowerCase()));
    if (f.minPrice !== undefined) results = results.filter(p => p.price >= f.minPrice!);
    if (f.maxPrice !== undefined) results = results.filter(p => p.price <= f.maxPrice!);
    if (f.keyword) {
      const kw = f.keyword.toLowerCase();
      results = results.filter(p =>
        p.title.toLowerCase().includes(kw) ||
        p.area.toLowerCase().includes(kw) ||
        p.district.toLowerCase().includes(kw) ||
        p.description.toLowerCase().includes(kw)
      );
    }

    if ((f.nearbyMode || (f.lat !== undefined && f.lng !== undefined)) && f.lat && f.lng) {
      results = results
        .filter(p => p.lat !== undefined && p.lng !== undefined)
        .map(p => ({ ...p, _dist: distanceKm(f.lat!, f.lng!, p.lat!, p.lng!) }))
        .sort((a: any, b: any) => a._dist - b._dist) as Property[];
    } else {
      if (f.sort === 'price_asc') results.sort((a, b) => a.price - b.price);
      else if (f.sort === 'price_desc') results.sort((a, b) => b.price - a.price);
      else results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return results;
  };

  const results = applyFilters(filters, propertiesList);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(f => {
      const next = { ...f, [key]: value || undefined };
      if (key === 'division') {
        next.district = undefined; // Reset district when division changes
      }
      return next;
    });
  };

  const clearFilters = () => {
    setFilters({ sort: 'newest' });
    setKeyword('');
    router.push('/properties');
  };

  const activeFilterCount = [
    filters.purpose, filters.category, filters.division, filters.district,
    filters.area, filters.minPrice, filters.maxPrice, filters.keyword, filters.nearbyMode,
  ].filter(Boolean).length;

  const selectCls = "bg-white dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:border-brand-500/60 focus:bg-white dark:focus:bg-white/10 outline-none transition-all cursor-pointer shadow-sm dark:shadow-none";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top filter bar with iOS Glass Tile */}
      <div className="sticky top-16 z-30 backdrop-blur-xl bg-white/80 dark:bg-dark-900/75 border-b border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-glass-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">

            {/* Keyword search */}
            <div className="relative flex-1 min-w-36">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && updateFilter('keyword', keyword)}
                placeholder={t('prop_search_ph')}
                className="w-full bg-white dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/20 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-brand-500/60 focus:bg-white dark:focus:bg-white/10 transition-all outline-none shadow-sm dark:shadow-none"
              />
            </div>

            {/* Purpose */}
            <select
              value={filters.purpose || ''}
              onChange={e => updateFilter('purpose', e.target.value)}
              className={selectCls}
            >
              <option value="" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">{t('prop_all_purpose')}</option>
              <option value="buy" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">{t('card_for_sale')}</option>
              <option value="rent" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">{t('card_for_rent')}</option>
              <option value="lease" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">{t('card_lease')}</option>
            </select>

            {/* Category */}
            <select
              value={filters.category || ''}
              onChange={e => updateFilter('category', e.target.value)}
              className={selectCls}
            >
              <option value="" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">{t('prop_all_cats')}</option>
              <option value="flat" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">{t('card_cat_flat')}</option>
              <option value="house" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">{t('card_cat_house')}</option>
              <option value="land" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">{t('card_cat_land')}</option>
              <option value="mess" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">{t('card_cat_mess')}</option>
              <option value="hotel" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">{t('card_cat_hotel')}</option>
            </select>

            {/* Sort */}
            <select
              value={filters.sort || 'newest'}
              onChange={e => updateFilter('sort', e.target.value)}
              className={`hidden sm:block ${selectCls}`}
            >
              <option value="newest" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">{t('prop_sort_newest')}</option>
              <option value="price_asc" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">{t('prop_sort_price_asc')}</option>
              <option value="price_desc" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">{t('prop_sort_price_desc')}</option>
            </select>

            {/* GPS */}
            <button
              onClick={findNearby}
              disabled={gpsLoading}
              title={t('prop_nearby')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl backdrop-blur-md border text-xs font-bold transition-all disabled:opacity-50 ${
                filters.nearbyMode
                  ? 'bg-brand-500/20 border-brand-500 text-brand-600 dark:text-brand-300 shadow-glow-sm'
                  : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/20 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-brand-500/40 shadow-sm dark:shadow-none'
              }`}
            >
              {gpsLoading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />}
              <span className="hidden sm:inline">{t('prop_nearby')}</span>
            </button>

            {/* Advanced filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl backdrop-blur-md bg-white dark:bg-white/5 border border-slate-200 dark:border-white/20 hover:border-brand-500/40 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm dark:shadow-none"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
              {t('prop_filters')}
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-500 text-[9px] font-black text-white flex items-center justify-center">
                  {lang === 'BN' ? toBanglaDigits(activeFilterCount) : activeFilterCount}
                </span>
              )}
            </button>

            {/* View mode */}
            <div className="hidden sm:flex items-center gap-1 backdrop-blur-md bg-white dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-xl p-1 shadow-sm dark:shadow-none">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-brand-500/20 text-brand-600 dark:text-brand-300' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-brand-500/20 text-brand-600 dark:text-brand-300' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Clear */}
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-semibold transition-colors">
                <X className="w-3.5 h-3.5" /> {t('prop_clear')}
              </button>
            )}
          </div>

          {/* Expanded filter panel with Cascading Division & District selector */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-slide-up backdrop-blur-md bg-slate-100/90 dark:bg-white/5 p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none">

              {/* Step 1: Division */}
              <div>
                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                  {t('search_label_division')}
                </label>
                <select
                  value={filters.division || ''}
                  onChange={e => updateFilter('division', e.target.value)}
                  className={`w-full ${selectCls}`}
                >
                  <option value="" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">{t('search_all_bangladesh')}</option>
                  {BD_DIVISIONS.map(div => (
                    <option key={div} value={div} className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">
                      {lang === 'BN' ? BD_DIVISIONS_BN[div] : div}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: District (Cascading) */}
              <div>
                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                  {t('search_label_district')}
                </label>
                <select
                  value={filters.district || ''}
                  onChange={e => updateFilter('district', e.target.value)}
                  disabled={!filters.division}
                  className={`w-full ${selectCls} ${!filters.division ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">
                    {filters.division ? t('search_select_district') : t('search_all_bangladesh')}
                  </option>
                  {filters.division && (BD_DISTRICTS[filters.division as BDDivision] ?? []).map(dist => (
                    <option key={dist} value={dist} className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">
                      {lang === 'BN' ? (BD_DISTRICTS_BN[dist] ?? dist) : dist}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Price */}
              <div>
                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                  {lang === 'BN' ? 'সর্বনিম্ন মূল্য' : 'Min Price'}
                </label>
                <select
                  value={filters.minPrice ?? ''}
                  onChange={e => updateFilter('minPrice', Number(e.target.value) || undefined)}
                  className={`w-full ${selectCls}`}
                >
                  <option value="" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">{lang === 'BN' ? 'কোনো সীমা নেই' : 'No Min'}</option>
                  <option value="500000" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">{formatBDTLocalized(500000, false, lang)}</option>
                  <option value="2000000" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">{formatBDTLocalized(2000000, false, lang)}</option>
                  <option value="5000000" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">{formatBDTLocalized(5000000, false, lang)}</option>
                  <option value="10000000" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">{formatBDTLocalized(10000000, false, lang)}</option>
                </select>
              </div>

              {/* Max Price */}
              <div>
                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                  {lang === 'BN' ? 'সর্বোচ্চ মূল্য' : 'Max Price'}
                </label>
                <select
                  value={filters.maxPrice ?? ''}
                  onChange={e => updateFilter('maxPrice', Number(e.target.value) || undefined)}
                  className={`w-full ${selectCls}`}
                >
                  <option value="" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">{lang === 'BN' ? 'কোনো সীমা নেই' : 'No Max'}</option>
                  <option value="5000000" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">{formatBDTLocalized(5000000, false, lang)}</option>
                  <option value="10000000" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">{formatBDTLocalized(10000000, false, lang)}</option>
                  <option value="30000000" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">{formatBDTLocalized(30000000, false, lang)}</option>
                  <option value="100000000" className="bg-white dark:bg-[#0c1526] text-slate-900 dark:text-white">{formatBDTLocalized(100000000, false, lang)}</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Result count */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <span suppressHydrationWarning className="text-xl font-black text-slate-900 dark:text-white">
              {lang === 'BN' ? `${toBanglaDigits(results.length)} টি সম্পত্তি` : `${results.length} Properties`}
            </span>
            {filters.nearbyMode && (
              <span className="ml-2 text-xs text-cyan-600 dark:text-cyan-400 font-bold">
                • {lang === 'BN' ? 'জিপিএস দ্বারা সাজানো' : 'Sorted by GPS distance'}
              </span>
            )}
          </div>
        </div>

        {filters.nearbyMode && filters.lat && filters.lng && (
          <div className="mb-6 flex items-center justify-between gap-3 p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-800 dark:text-cyan-200 text-xs">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-cyan-500 shrink-0 animate-pulse" />
              <span>
                {lang === 'BN' 
                  ? `আপনার অবস্থানের (${filters.lat.toFixed(3)}°N, ${filters.lng.toFixed(3)}°E) নিকটবর্তী সম্পত্তি প্রদর্শিত হচ্ছে`
                  : `Showing properties closest to your GPS coordinates (${filters.lat.toFixed(3)}°N, ${filters.lng.toFixed(3)}°E)`}
              </span>
            </div>
            <button 
              onClick={() => {
                setFilters(f => ({ ...f, nearbyMode: false, lat: undefined, lng: undefined, sort: 'newest' }));
                router.push('/properties');
              }}
              className="text-xs font-bold text-cyan-700 dark:text-cyan-300 underline hover:text-cyan-900 dark:hover:text-white shrink-0"
            >
              {lang === 'BN' ? 'জিপিএস রিসেট করুন' : 'Reset GPS'}
            </button>
          </div>
        )}

        {filters.keyword && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            {lang === 'BN' ? 'অনুসন্ধানের ফলাফল: ' : 'Results for: '}
            <strong className="text-slate-800 dark:text-slate-200">"{filters.keyword}"</strong>
          </p>
        )}

        {/* Grid */}
        {results.length === 0 ? (
          <div className="text-center py-24 backdrop-blur-md bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 max-w-lg mx-auto shadow-sm dark:shadow-glass-card">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('prop_no_results')}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              {lang === 'BN' ? 'ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন' : 'Try adjusting your filters or search term'}
            </p>
            <button onClick={clearFilters} className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-glow transition-all">
              {lang === 'BN' ? 'সব ফিল্টার মুছুন' : 'Clear All Filters'}
            </button>
          </div>
        ) : (
          <div className={`grid gap-5 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-2xl'}`}>
            {results.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-dark-900 flex items-center justify-center"><Loader className="w-8 h-8 text-brand-500 dark:text-brand-400 animate-spin" /></div>}>
      <PropertiesContent />
    </Suspense>
  );
}
