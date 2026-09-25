'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Property } from '@/lib/types';
import { formatBDTLocalized, formatAreaLocalized, toBanglaDigits, cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { DataStore } from '@/lib/data/store';
import { BD_DISTRICTS_BN } from '@/lib/data/bd-locations';
import { 
  Bed, Bath, Square, MapPin, CheckCircle2, ShieldCheck,
  Flame, Eye, Heart, ArrowRight, Navigation
} from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  className?: string;
}

export default function PropertyCard({ property, className }: PropertyCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const isPlot = property.category === 'land';
  const isRent = property.priceUnit === 'bdt_per_month';

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setSaved(DataStore.isPropertySaved(user.id, property.id));
    } else {
      setSaved(false);
    }
    const handleUpdate = () => {
      if (user) setSaved(DataStore.isPropertySaved(user.id, property.id));
    };
    window.addEventListener('plotify_saved_updated', handleUpdate);
    return () => window.removeEventListener('plotify_saved_updated', handleUpdate);
  }, [user, property.id]);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push(`/auth/login?redirect=/properties/${property.id}`);
      return;
    }
    setSaved(!saved);
    await DataStore.toggleSaveProperty(user.id, property.id);
  };

  const purposeText = property.purpose === 'buy'
    ? t('card_for_sale')
    : property.purpose === 'rent'
    ? t('card_for_rent')
    : t('card_lease');

  const categoryText = {
    flat: t('card_cat_flat'),
    house: t('card_cat_house'),
    land: t('card_cat_land'),
    mess: t('card_cat_mess'),
    hotel: t('card_cat_hotel'),
  }[property.category] ?? property.category;

  const sellerTypeText = ({
    owner: t('seller_owner'),
    developer: t('seller_developer'),
    agent: t('seller_agency'),
    agency: t('seller_agency'),
  } as Record<string, string>)[property.sellerType] ?? property.sellerType;

  const districtDisplay = lang === 'BN'
    ? (BD_DISTRICTS_BN[property.district] ?? property.district)
    : property.district;

  return (
    <div
      className={cn(
        'group backdrop-blur-md bg-white/90 dark:bg-black/40 border border-slate-200/80 dark:border-white/20 rounded-2xl overflow-hidden shadow-glass-card hover:shadow-glass-card-hover transition-all duration-300 card-hover flex flex-col',
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-black/40 shrink-0">
        <Image
          src={property.featuredImage}
          alt={property.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn(
              'text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/20 shadow-sm',
              property.purpose === 'buy' ? 'bg-brand-600/85 text-white' :
              property.purpose === 'rent' ? 'bg-teal-600/85 text-white' :
              'bg-purple-600/85 text-white'
            )}>
              {purposeText}
            </span>
            <span className="text-[10px] font-semibold px-2 py-1 rounded-lg backdrop-blur-md bg-black/50 border border-white/20 text-slate-200">
              {categoryText}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleSave}
            title={saved ? 'Remove from saved' : 'Save property'}
            className={cn(
              'p-1.5 rounded-lg backdrop-blur-md border transition-all cursor-pointer z-10',
              saved
                ? 'bg-rose-600/90 border-rose-400 text-white shadow-sm'
                : 'bg-black/50 border-white/20 text-slate-300 hover:text-rose-400 hover:bg-black/70'
            )}
          >
            <Heart className={cn('w-3.5 h-3.5 transition-transform active:scale-125', saved && 'fill-white text-white')} />
          </button>
        </div>

        {/* Bottom badges */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 flex-wrap">
          {property.isVerified && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md bg-brand-600/90 text-white border border-white/20">
              <CheckCircle2 className="w-3 h-3" />
              {t('card_verified')}
            </span>
          )}
          {(property as any)._dist !== undefined && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md bg-cyan-600/90 text-white border border-white/20">
              <Navigation className="w-2.5 h-2.5" />
              {((property as any)._dist).toFixed(1)} km
            </span>
          )}
          {property.gasConnection === 'titas' && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md backdrop-blur-md bg-black/60 text-amber-300 border border-white/20 flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5 text-amber-400" />
              {t('card_titas')}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 gap-3">
        {/* Price */}
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatBDTLocalized(property.price, isRent, lang)}
          </div>
          {property.priceNegotiable && (
            <span className="text-[10px] font-bold text-brand-600 dark:text-brand-300 bg-brand-500/10 border border-brand-500/30 px-2 py-0.5 rounded-md backdrop-blur-sm">
              {t('card_negotiable')}
            </span>
          )}
        </div>

        {/* Title */}
        <Link href={`/properties/${property.id}`} className="block">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors leading-snug">
            {property.title}
          </h3>
        </Link>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <MapPin className="w-3 h-3 text-brand-500 dark:text-brand-400 shrink-0" />
          <span className="truncate">{property.area}, {districtDisplay}</span>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-3 py-2.5 border-y border-slate-200/80 dark:border-white/10 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
          <span className="flex items-center gap-1">
            <Square className="w-3.5 h-3.5 text-slate-400" />
            {formatAreaLocalized(property.size, property.sizeUnit, lang)}
          </span>
          {!isPlot && property.bedrooms ? (
            <span className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-slate-400" />
              {lang === 'BN' ? toBanglaDigits(property.bedrooms) : property.bedrooms} {t('card_beds')}
            </span>
          ) : null}
          {!isPlot && property.bathrooms ? (
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5 text-slate-400" />
              {lang === 'BN' ? toBanglaDigits(property.bathrooms) : property.bathrooms} {t('card_baths')}
            </span>
          ) : null}
          {property.views ? (
            <span className="flex items-center gap-1 ml-auto text-slate-400">
              <Eye className="w-3.5 h-3.5" />
              {lang === 'BN' ? toBanglaDigits(property.views.toLocaleString('en-US')) : property.views.toLocaleString()}
            </span>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{sellerTypeText}</span>
            {property.sellerVerified && <ShieldCheck className="w-3 h-3 text-brand-500 dark:text-brand-400 inline" />}
          </div>
          <Link
            href={`/properties/${property.id}`}
            className="flex items-center gap-1 text-[11px] font-bold text-brand-600 dark:text-brand-300 hover:text-brand-700 dark:hover:text-brand-200 transition-colors"
          >
            {t('card_details')} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
