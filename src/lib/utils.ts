import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AreaUnit, PropertyCategory, PropertyPurpose, ActivationFeeConfig } from './types';
import { ACTIVATION_FEES } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toBanglaDigits(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, d => bnDigits[+d]);
}

export function formatBDT(amount: number, perMonth = false): string {
  if (!amount && amount !== 0) return '৳ 0';
  let formatted = '';
  if (amount >= 10_000_000) {
    formatted = `৳ ${(amount / 10_000_000).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} Cr`;
  } else if (amount >= 100_000) {
    formatted = `৳ ${(amount / 100_000).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} Lakh`;
  } else {
    formatted = `৳ ${amount.toLocaleString('en-US')}`;
  }
  return perMonth ? `${formatted}/mo` : formatted;
}

export function formatBDTLocalized(amount: number, perMonth = false, lang: 'EN' | 'BN' = 'EN'): string {
  if (!amount && amount !== 0) return lang === 'BN' ? '৳ ০' : '৳ 0';
  if (lang === 'BN') {
    let formatted = '';
    if (amount >= 10_000_000) {
      const val = (amount / 10_000_000).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
      formatted = `৳ ${toBanglaDigits(val)} কোটি`;
    } else if (amount >= 100_000) {
      const val = (amount / 100_000).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
      formatted = `৳ ${toBanglaDigits(val)} লাখ`;
    } else {
      formatted = `৳ ${toBanglaDigits(amount.toLocaleString('en-US'))}`;
    }
    return perMonth ? `${formatted}/মাস` : formatted;
  }
  return formatBDT(amount, perMonth);
}

export function formatArea(size: number, unit: AreaUnit): string {
  const labels: Record<AreaUnit, string> = {
    sqft: 'sq ft',
    katha: 'Katha',
    bigha: 'Bigha',
    decimal: 'Decimal',
    shotangso: 'Shotangso',
  };
  return `${size.toLocaleString('en-US')} ${labels[unit] || unit}`;
}

export function formatAreaLocalized(size: number, unit: AreaUnit, lang: 'EN' | 'BN' = 'EN'): string {
  if (lang === 'BN') {
    const labels: Record<AreaUnit, string> = {
      sqft: 'বর্গফুট',
      katha: 'কাঠা',
      bigha: 'বিঘা',
      decimal: 'শতাংশ',
      shotangso: 'শতাংশ',
    };
    return `${toBanglaDigits(size.toLocaleString('en-US'))} ${labels[unit] || unit}`;
  }
  return formatArea(size, unit);
}

export function kathaToSqft(katha: number) { return katha * 720; }
export function sqftToKatha(sqft: number) { return +(sqft / 720).toFixed(2); }

export function calcActivationFee(category: PropertyCategory, price: number): number {
  let schedule = ACTIVATION_FEES;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('plotify_platform_settings_db');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.feeSchedule && Array.isArray(parsed.feeSchedule)) {
          schedule = parsed.feeSchedule;
        }
      }
    } catch {}
  }
  const cfg = schedule.find(f => f.category === category);
  if (!cfg) return 1000;
  // Scale fee from min to max based on price
  const normalized = Math.min(price / 50_000_000, 1); // 5 crore = max
  return Math.round(cfg.minFee + normalized * (cfg.maxFee - cfg.minFee));
}

export function categoryLabel(category: PropertyCategory, lang: 'en' | 'bn' = 'en'): string {
  const labels: Record<PropertyCategory, { en: string; bn: string }> = {
    flat: { en: 'Flat / Apartment', bn: 'ফ্ল্যাট / অ্যাপার্টমেন্ট' },
    house: { en: 'House / Bari', bn: 'বাড়ি / বাড়ী' },
    land: { en: 'Land / Jomi', bn: 'জমি / জমা' },
    mess: { en: 'Mess / Hostel', bn: 'মেস / হোস্টেল' },
    hotel: { en: 'Hotel / Short Stay', bn: 'হোটেল / শর্ট স্টে' },
  };
  return labels[category]?.[lang] ?? category;
}

export function purposeLabel(purpose: PropertyPurpose): string {
  return { buy: 'For Sale', rent: 'For Rent', lease: 'For Lease' }[purpose] ?? purpose;
}

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
