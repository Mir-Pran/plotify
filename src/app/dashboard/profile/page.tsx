'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { 
  User, Mail, Phone, Lock, ArrowLeft, CheckCircle2, ShieldCheck, 
  Briefcase, AlertCircle, Loader, Camera, Trash2, Upload
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, updateProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Profile details updated successfully!');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      setFullName(user.fullName || '');
      setBusinessName(user.businessName || '');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-900 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image file size must be less than 5MB.');
      return;
    }

    setAvatarError('');
    setUploadingAvatar(true);

    try {
      const supabase = createClient();
      let publicAvatarUrl = '';

      // 1. Try uploading to Supabase Storage 'avatars' bucket
      try {
        // Attempt to create bucket if it doesn't already exist
        try {
          await supabase.storage.createBucket('avatars', { public: true });
        } catch {}

        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          publicAvatarUrl = urlData.publicUrl;
        }
      } catch (storageErr) {
        console.warn('Supabase storage upload note:', storageErr);
      }

      // 2. Safe Fallback: If Supabase Storage was unavailable or errored, convert to Data URL
      if (!publicAvatarUrl) {
        publicAvatarUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      // 3. Update profile with new avatar URL
      const res = await updateProfile({
        avatarUrl: publicAvatarUrl,
      });

      if (res.success) {
        setSuccessMessage('Profile picture updated successfully!');
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3500);
      } else {
        setAvatarError(res.error || 'Failed to update profile picture.');
      }
    } catch (err: any) {
      setAvatarError(err?.message || 'Error uploading profile image.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user.avatarUrl) return;
    setUploadingAvatar(true);
    try {
      await updateProfile({ avatarUrl: '' });
      setSuccessMessage('Profile picture removed.');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      setAvatarError('Failed to remove profile picture.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    const res = await updateProfile({
      fullName,
      businessName: user.role === 'business' ? businessName : undefined,
    });

    setSaving(false);
    if (res.success) {
      setSuccessMessage('Profile details updated successfully!');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900 text-slate-900 dark:text-slate-100 py-10 transition-colors duration-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-dark-800/80 border border-slate-200 dark:border-dark-500/60 rounded-3xl p-6 sm:p-10 shadow-sm dark:shadow-none space-y-8"
        >
          {/* Header & Avatar Upload Section (Item 8) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-dark-500/40">
            <div className="flex items-center gap-5">
              
              {/* Avatar Picture with Upload Trigger */}
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-black text-2xl shadow-glow-sm border-2 border-slate-100 dark:border-dark-700">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName || 'User avatar'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user.fullName?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </div>

                {/* Upload Hover Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  title="Upload profile picture"
                  className="absolute inset-0 bg-dark-900/60 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]"
                >
                  {uploadingAvatar ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </button>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
              </div>

              {/* User Identity Info */}
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  {user.fullName}
                  {user.isVerified && <CheckCircle2 className="w-5 h-5 text-brand-500" />}
                </h1>
                
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/20">
                    {user.role} Account
                  </span>
                  {user.upgradeStatus === 'pending_approval' && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      Upgrade Pending
                    </span>
                  )}
                </div>

                {/* Quick Avatar Actions */}
                <div className="flex items-center gap-3 mt-2.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-500 flex items-center gap-1 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {user.avatarUrl ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  {user.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={uploadingAvatar}
                      className="text-xs font-bold text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 sm:text-right">
              Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </div>
          </div>

          {/* Success Banner */}
          {savedSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {successMessage}
            </div>
          )}

          {/* Error Banner */}
          {avatarError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {avatarError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Personal Information
              </h2>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-dark-700/60 border border-slate-200 dark:border-dark-500/60 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-brand-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Business Name (if business role) */}
              {user.role === 'business' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Company / Agency Name
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      placeholder="e.g. Apex Living Ltd."
                      className="w-full bg-slate-50 dark:bg-dark-700/60 border border-slate-200 dark:border-dark-500/60 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-brand-500 outline-none transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Read-Only Verified Security Information */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-dark-500/40">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand-500" />
                  Verified Contact Details
                </h2>
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-500" /> Strictly Read-Only
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                For security and fraud prevention, verified contact credentials cannot be changed directly from your profile settings. Contact Plotify support if your mobile number or email has changed.
              </p>

              {/* Email Address - STRICTLY READ-ONLY */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Locked</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    readOnly
                    className="w-full bg-slate-100 dark:bg-dark-900/60 border border-slate-200 dark:border-dark-600 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed select-none opacity-80"
                  />
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Phone Number - STRICTLY READ-ONLY */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Phone Number</span>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Locked</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={user.mobile}
                    disabled
                    readOnly
                    className="w-full bg-slate-100 dark:bg-dark-900/60 border border-slate-200 dark:border-dark-600 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed select-none opacity-80"
                  />
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-dark-500/40">
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-500/60 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-glow-sm transition-all disabled:opacity-60 flex items-center gap-2"
              >
                {saving ? <Loader className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
