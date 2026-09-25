'use client';

import React, { useState, useEffect } from 'react';
import { DataStore } from '@/lib/data/store';
import { PlatformSettings } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';
import { AlertCircle, Bell, X, Wrench } from 'lucide-react';

export default function SitewideBanner() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const { lang } = useLanguage();

  const loadSettings = () => {
    setSettings(DataStore.getSettings());
  };

  useEffect(() => {
    loadSettings();
    window.addEventListener('plotify_settings_updated', loadSettings);
    return () => window.removeEventListener('plotify_settings_updated', loadSettings);
  }, []);

  if (!settings) return null;
  if (dismissed) return null;

  if (settings.maintenanceMode) {
    return (
      <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 relative z-50 shadow-sm animate-pulse-subtle">
        <Wrench className="w-3.5 h-3.5 shrink-0" />
        <span>
          {lang === 'BN' 
            ? 'প্লটিফাই রক্ষণাবেক্ষণ মোডে আছে — প্ল্যাটফর্ম আপগ্রেড চলাকালীন কিছু পরিষেবা সাময়িক বিলম্বিত হতে পারে।'
            : 'Scheduled Maintenance Mode Active — Some actions may be temporarily queued during upgrades.'}
        </span>
      </div>
    );
  }

  if (settings.noticeBannerEnabled) {
    const text = (lang === 'BN' && settings.noticeBannerTextBn) ? settings.noticeBannerTextBn : settings.noticeBannerText;
    const typeColor = 
      settings.noticeBannerType === 'warning'
        ? 'bg-amber-600 text-white'
        : settings.noticeBannerType === 'success'
        ? 'bg-emerald-600 text-white'
        : 'bg-brand-600 text-white';

    return (
      <div className={`${typeColor} text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 relative z-50 shadow-sm transition-colors`}>
        <Bell className="w-3.5 h-3.5 shrink-0 animate-bounce" />
        <span className="truncate max-w-3xl">{text}</span>
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-75 hover:opacity-100 p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return null;
}
