'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings, Sliders, Shield, DollarSign,
  Save, CheckCircle2, Phone, Mail, Building2, Bell,
  Power, Globe, Navigation, MessageCircle, AlertTriangle, RotateCcw
} from 'lucide-react';
import { DataStore } from '@/lib/data/store';
import { PlatformSettings, DEFAULT_PLATFORM_SETTINGS, ActivationFeeConfig, ACTIVATION_FEES } from '@/lib/types';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);

  useEffect(() => {
    setSettings(DataStore.getSettings());
    DataStore.syncSettingsFromSupabase().then(s => {
      if (s) setSettings(s);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await DataStore.saveSettingsToSupabase(settings);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  const handleSaveContactOnly = async () => {
    setSaving(true);
    await DataStore.saveSettingsToSupabase(settings);
    setSaving(false);
    setContactSaved(true);
    setTimeout(() => setContactSaved(false), 3000);
  };

  const handleFeeChange = (category: string, field: 'minFee' | 'maxFee', val: number) => {
    const updatedFees = settings.feeSchedule.map(fee => {
      if (fee.category === category) {
        return { ...fee, [field]: Math.max(0, val) };
      }
      return fee;
    });
    setSettings(prev => ({ ...prev, feeSchedule: updatedFees }));
  };

  const handleResetFees = () => {
    setSettings(prev => ({ ...prev, feeSchedule: ACTIVATION_FEES }));
    setResetConfirm(false);
  };

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-rose-500" />
            T-O-Z Platform Control Panel
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            End-to-end administration: global kill switches, live fee schedules, broadcast notices, and platform configurations.
          </p>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fade-in shadow-sm">
            <CheckCircle2 className="w-4 h-4" /> Global Settings Applied & Persisted!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Global Platform Switches (T-O-Z Control) */}
        <div className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-500/60 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-dark-600/50 pb-3">
            <Power className="w-5 h-5 text-rose-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Global Platform Status & Switches</h2>
              <p className="text-[11px] text-slate-500">Live operational controls affecting public user experience and availability</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Maintenance Mode */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-700/50 border border-slate-200 dark:border-dark-500/40 cursor-pointer hover:border-brand-500/50 transition-colors">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={e => setSettings(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                className="mt-1 rounded text-rose-500 focus:ring-rose-500 w-4 h-4 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Maintenance Mode
                  {settings.maintenanceMode && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-500 font-bold border border-rose-500/20">
                      Active
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Display a maintenance warning banner across the platform during scheduled updates.
                </span>
              </div>
            </label>

            {/* User Registration */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-700/50 border border-slate-200 dark:border-dark-500/40 cursor-pointer hover:border-brand-500/50 transition-colors">
              <input
                type="checkbox"
                checked={settings.userRegistrationEnabled}
                onChange={e => setSettings(prev => ({ ...prev, userRegistrationEnabled: e.target.checked }))}
                className="mt-1 rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Allow Public User Registrations
                  {!settings.userRegistrationEnabled && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-500 font-bold">
                      Paused
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  When toggled off, signups are temporarily disabled while existing users can still sign in.
                </span>
              </div>
            </label>

            {/* Ploti AI Assistant */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-700/50 border border-slate-200 dark:border-dark-500/40 cursor-pointer hover:border-brand-500/50 transition-colors">
              <input
                type="checkbox"
                checked={settings.plotiAiEnabled}
                onChange={e => setSettings(prev => ({ ...prev, plotiAiEnabled: e.target.checked }))}
                className="mt-1 rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Enable Ploti AI Smart Assistant
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Toggle the floating Gemini AI assistant and real estate query solver sitewide.
                </span>
              </div>
            </label>

            {/* GPS Search */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-700/50 border border-slate-200 dark:border-dark-500/40 cursor-pointer hover:border-brand-500/50 transition-colors">
              <input
                type="checkbox"
                checked={settings.gpsSearchEnabled}
                onChange={e => setSettings(prev => ({ ...prev, gpsSearchEnabled: e.target.checked }))}
                className="mt-1 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  GPS & Nearby Property Search
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Allows users to click 'Near Me' to detect their device coordinates and filter properties within 5km.
                </span>
              </div>
            </label>

            {/* Listing Approval Mode */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-700/50 border border-slate-200 dark:border-dark-500/40 cursor-pointer hover:border-brand-500/50 transition-colors">
              <input
                type="checkbox"
                checked={settings.requireListingApproval}
                onChange={e => setSettings(prev => ({ ...prev, requireListingApproval: e.target.checked }))}
                className="mt-1 rounded text-rose-500 focus:ring-rose-500 w-4 h-4 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Require Admin Approval for New Listings
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Enabled: Listings start in 'pending' status. Disabled: Listings publish immediately as 'approved'.
                </span>
              </div>
            </label>

            {/* Business NID Verification */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-700/50 border border-slate-200 dark:border-dark-500/40 cursor-pointer hover:border-brand-500/50 transition-colors">
              <input
                type="checkbox"
                checked={settings.requireNidForBusiness}
                onChange={e => setSettings(prev => ({ ...prev, requireNidForBusiness: e.target.checked }))}
                className="mt-1 rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Require NID & Photo for Business Upgrade
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Enforces strict document submission and admin verification before unlocking agency privileges.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Section 2: Official Listing Activation Fee Schedule (Fully Editable) */}
        <div id="fee-schedule" className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-500/60 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-dark-600/50 pb-3">
            <div className="flex items-center gap-2.5">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Official Listing Activation Fee Schedule (BDT)</h2>
                <p className="text-[11px] text-slate-500">
                  Directly configures fee tiers charged to posters and displayed across add-property and financial reports.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setResetConfirm(true)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset to Defaults
            </button>
          </div>

          {resetConfirm && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between">
              <span>Reset all category fee tiers back to default policy rates?</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleResetFees}
                  className="px-3 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px]"
                >
                  Yes, Reset
                </button>
                <button
                  type="button"
                  onClick={() => setResetConfirm(false)}
                  className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-dark-600 text-slate-700 dark:text-slate-200 font-bold text-[11px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {settings.feeSchedule.map(fee => (
              <div
                key={fee.category}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-700/50 border border-slate-200 dark:border-dark-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="min-w-[200px]">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">{fee.description}</span>
                  <span className="text-[11px] text-slate-400 capitalize">Category: {fee.category}</span>
                </div>

                <div className="flex items-center gap-3 flex-1 max-w-md">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Min Fee (৳)
                    </label>
                    <input
                      type="number"
                      value={fee.minFee}
                      onChange={e => handleFeeChange(fee.category, 'minFee', Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-500 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <span className="text-slate-400 text-sm font-bold pt-4">–</span>

                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Max Fee (৳)
                    </label>
                    <input
                      type="number"
                      value={fee.maxFee}
                      onChange={e => handleFeeChange(fee.category, 'maxFee', Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-500 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    ৳ {fee.minFee.toLocaleString()} – ৳ {fee.maxFee.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Active Policy</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Sitewide Announcement & Broadcast Notice */}
        <div className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-500/60 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-dark-600/50 pb-3">
            <Bell className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Sitewide Announcement & Notice Banner</h2>
              <p className="text-[11px] text-slate-500">Broadcast important announcements or security bulletins to all website visitors</p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.noticeBannerEnabled}
                  onChange={e => setSettings(prev => ({ ...prev, noticeBannerEnabled: e.target.checked }))}
                  className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                Show Sitewide Announcement Banner
              </label>

              <select
                value={settings.noticeBannerType}
                onChange={e => setSettings(prev => ({ ...prev, noticeBannerType: e.target.value as any }))}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-500 text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="info">Info (Blue/Brand)</option>
                <option value="warning">Warning (Amber)</option>
                <option value="success">Success (Emerald)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Announcement Text (English)
                </label>
                <input
                  type="text"
                  value={settings.noticeBannerText}
                  onChange={e => setSettings(prev => ({ ...prev, noticeBannerText: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700/60 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  placeholder="e.g. Eid special discount on all property listing activation fees!"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Announcement Text (Bengali)
                </label>
                <input
                  type="text"
                  value={settings.noticeBannerTextBn || ''}
                  onChange={e => setSettings(prev => ({ ...prev, noticeBannerTextBn: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700/60 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  placeholder="যেমনঃ ঈদ উপলক্ষে লিস্টিং অ্যাক্টিভেশন ফিতে বিশেষ ছাড়!"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Contact & Platform Identity (Supabase site_settings) */}
        <div className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-500/60 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-600/50 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-brand-500" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Platform Identity & Official Contact Information</h2>
                <p className="text-[11px] text-slate-500">Live global contact credentials synced to Supabase site_settings & public footer</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {contactSaved && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Synced to site_settings!
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveContactOnly}
                disabled={saving}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-300 font-bold text-xs border border-brand-500/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Syncing...' : 'Update Contact Info'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Official Support Phone Number
              </label>
              <input
                type="text"
                value={settings.supportPhone}
                onChange={e => setSettings(prev => ({ ...prev, supportPhone: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700/60 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white font-mono outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Official Support Email Address
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={e => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700/60 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white font-mono outline-none focus:border-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Physical Corporate Office Address
              </label>
              <input
                type="text"
                value={settings.officeAddress}
                onChange={e => setSettings(prev => ({ ...prev, officeAddress: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700/60 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Ploti AI Assistant Engine Settings */}
        <div className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-500/60 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-dark-600/50 pb-3">
            <img src="/ploti-avatar.png" alt="Ploti AI" className="w-5 h-5 object-contain inline-block" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Ploti AI Assistant Parameters</h2>
              <p className="text-[11px] text-slate-500">Configure LLM model engine and language processing settings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Assistant Name
              </label>
              <input
                type="text"
                value={settings.aiName}
                onChange={e => setSettings(prev => ({ ...prev, aiName: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700/60 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                LLM Engine Model
              </label>
              <select
                value={settings.aiModel}
                onChange={e => setSettings(prev => ({ ...prev, aiModel: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700/60 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-purple-500"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fastest, Recommended)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Reasoning)</option>
                <option value="local-knowledge-base">Local Real Estate Engine</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.banglaSupport}
                  onChange={e => setSettings(prev => ({ ...prev, banglaSupport: e.target.checked }))}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                />
                Bangla / Banglish Priority
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> All changes successfully saved!
            </span>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-glow-sm transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save & Apply Platform Settings
          </button>
        </div>
      </form>
    </div>
  );
}
