'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Property } from '@/lib/types';
import { formatBDT, formatArea } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { DataStore } from '@/lib/data/store';
import {
  MapPin, Bed, Bath, Square, CheckCircle2, ShieldCheck, Phone,
  MessageCircle, Flame, Zap, Droplets, Car, Building2, Eye,
  Calendar, Heart, Share2, Flag, ArrowLeft, Star, Navigation,
  Wifi, Lock, Home, Layers, TrendingUp, MousePointerClick, Users,
  BarChart3, AlertCircle, Sparkles, Check
} from 'lucide-react';

interface PropertyDetailClientProps {
  initialProperty: Property;
  related: Property[];
}

export default function PropertyDetailClient({ initialProperty, related }: PropertyDetailClientProps) {
  const { user } = useAuth();
  const [property, setProperty] = useState<Property>(initialProperty);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const viewTrackedRef = useRef(false);

  // Sync latest property data from DataStore on mount
  useEffect(() => {
    const latest = DataStore.getPropertyById(initialProperty.id);
    if (latest) {
      setProperty(latest);
    }
  }, [initialProperty.id]);

  // Check saved state
  useEffect(() => {
    if (user?.id) {
      setIsSaved(DataStore.isPropertySaved(user.id, property.id));
      DataStore.syncSavedPropertiesFromSupabase(user.id).then((savedList) => {
        setIsSaved(savedList.includes(property.id));
      });
    } else {
      setIsSaved(false);
    }

    const handleSavedUpdated = () => {
      if (user?.id) {
        setIsSaved(DataStore.isPropertySaved(user.id, property.id));
      }
    };
    window.addEventListener('plotify_saved_updated', handleSavedUpdated);
    return () => window.removeEventListener('plotify_saved_updated', handleSavedUpdated);
  }, [user?.id, property.id]);

  // Record view metric once per session
  useEffect(() => {
    if (viewTrackedRef.current) return;
    viewTrackedRef.current = true;

    const sessionKey = `plotify_viewed_${property.id}`;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      const updated = DataStore.incrementPropertyViews(property.id);
      if (updated) {
        setProperty(prev => ({
          ...prev,
          views: updated.views,
          clicks: updated.clicks,
          reach: updated.reach,
        }));
      }
    }

    const handleAnalyticsUpdate = (e: any) => {
      if (e.detail?.id === property.id) {
        setProperty(prev => ({
          ...prev,
          views: e.detail.views ?? prev.views,
          clicks: e.detail.clicks ?? prev.clicks,
          reach: e.detail.reach ?? prev.reach,
        }));
      }
    };
    window.addEventListener('plotify_property_analytics_updated', handleAnalyticsUpdate);
    return () => window.removeEventListener('plotify_property_analytics_updated', handleAnalyticsUpdate);
  }, [property.id]);

  // Handle bookmark / save toggle
  const handleToggleSave = async () => {
    if (!user) {
      alert('Please log in or sign up to save properties to your favorites.');
      return;
    }
    setIsSaving(true);
    const nextSavedState = !isSaved;
    setIsSaved(nextSavedState); // Optimistic

    try {
      const result = await DataStore.toggleSaveProperty(user.id, property.id);
      setIsSaved(result);
    } catch {
      setIsSaved(!nextSavedState); // Rollback on failure
    } finally {
      setIsSaving(false);
    }
  };

  // Handle click track for contacts
  const handleContactClick = () => {
    const updated = DataStore.incrementPropertyClicks(property.id);
    if (updated) {
      setProperty(prev => ({
        ...prev,
        views: updated.views,
        clicks: updated.clicks,
        reach: updated.reach,
      }));
    }
  };

  // Handle share
  const handleShare = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Check if current user is owner or admin
  const isOwner = Boolean(
    user && (
      user.role === 'admin' ||
      user.id === property.sellerId ||
      (property.sellerPhone && user.mobile && property.sellerPhone.replace(/\D/g, '') === user.mobile.replace(/\D/g, '')) ||
      (user.fullName && property.sellerName && user.fullName.toLowerCase().trim() === property.sellerName.toLowerCase().trim())
    )
  );

  const isRent = property.priceUnit === 'bdt_per_month';
  const waLink = `https://wa.me/${property.sellerWhatsapp?.replace(/[^0-9]/g, '') || property.sellerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I saw your listing "${property.title}" on Plotify. I'd like more information.`)}`;

  const allImages = property.images && property.images.length > 0 
    ? property.images 
    : [property.featuredImage];
  const activeImage = allImages[selectedImageIndex] || property.featuredImage;

  // Analytics metrics
  const totalViews = property.views || 0;
  const totalClicks = property.clicks || 0;
  const totalReach = property.reach || Math.round(totalViews * 1.8 + totalClicks * 3);
  const conversionRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900 text-slate-900 dark:text-slate-100 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back Link */}
        <Link 
          href="/properties" 
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Listings
        </Link>

        {/* OWNER BANNER / NOTICE */}
        {isOwner && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-brand-500/10 via-brand-500/5 to-transparent border border-brand-500/20 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-glow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-brand-700 dark:text-brand-300">You are the Owner of this Listing</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You have full access to real-time ad performance metrics and engagement analytics below.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/properties"
              className="px-4 py-2 rounded-xl bg-white dark:bg-dark-800 text-brand-600 dark:text-brand-400 font-bold text-xs border border-brand-500/30 hover:bg-brand-50 dark:hover:bg-dark-700 transition-colors shadow-sm"
            >
              Manage in Dashboard
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT: Details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Main Image gallery */}
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-slate-200 dark:bg-dark-700 shadow-sm dark:shadow-none border border-slate-200/60 dark:border-dark-600">
              <Image
                src={activeImage}
                alt={property.title}
                fill
                priority
                className="object-cover transition-all duration-300"
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2 flex-wrap z-10">
                <span className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg backdrop-blur-md shadow-sm ${
                  property.purpose === 'buy' ? 'bg-brand-500/90 text-white' :
                  property.purpose === 'rent' ? 'bg-teal-500/90 text-white' : 'bg-purple-500/90 text-white'
                }`}>
                  {property.purpose === 'buy' ? 'For Sale' : property.purpose === 'rent' ? 'For Rent' : 'For Lease'}
                </span>
                {property.isVerified && (
                  <span className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600/90 text-white backdrop-blur-md shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>

              {/* Action Buttons: Bookmark & Share */}
              <div className="absolute top-4 right-4 flex gap-2 z-10">
                <button
                  id="property-save-button"
                  onClick={handleToggleSave}
                  disabled={isSaving}
                  title={isSaved ? 'Remove from Saved' : 'Save Property'}
                  className={`p-2.5 rounded-xl backdrop-blur-md shadow-md transition-all active:scale-95 ${
                    isSaved
                      ? 'bg-rose-500 text-white hover:bg-rose-600 ring-2 ring-rose-400/50'
                      : 'bg-white/80 dark:bg-dark-900/80 text-slate-600 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400'
                  }`}
                >
                  <Heart className={`w-4 h-4 transition-transform ${isSaved ? 'fill-current scale-110' : ''}`} />
                </button>
                <button 
                  onClick={handleShare}
                  title="Share Property"
                  className="p-2.5 rounded-xl bg-white/80 dark:bg-dark-900/80 backdrop-blur-md text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 shadow-md transition-all active:scale-95"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Copied alert toast */}
              {copied && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-dark-900/90 text-white text-xs font-bold backdrop-blur-md shadow-xl flex items-center gap-2 z-20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Listing link copied to clipboard!
                </div>
              )}
            </div>

            {/* Image thumbnails */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {allImages.slice(0, 6).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-200 dark:bg-dark-700 cursor-pointer transition-all border-2 ${
                      selectedImageIndex === i 
                        ? 'border-brand-500 shadow-sm ring-1 ring-brand-500' 
                        : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <Image src={img} alt={`Thumbnail ${i+1}`} fill className="object-cover" />
                    {i === 5 && allImages.length > 6 && (
                      <div className="absolute inset-0 bg-dark-900/70 flex items-center justify-center text-white text-xs font-bold">
                        +{allImages.length - 6}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Title & Price */}
            <div className="bg-white dark:bg-dark-800/60 border border-slate-200/80 dark:border-dark-500/60 rounded-2xl p-6 shadow-sm dark:shadow-none">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2 leading-tight tracking-tight">
                    {property.title}
                  </h1>
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
                    <span>{property.address}</span>
                    {property.landmark && <span className="text-slate-400 dark:text-slate-600">· {property.landmark}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    {formatBDT(property.price, isRent)}
                  </div>
                  {property.priceNegotiable && (
                    <span className="inline-block mt-1 text-xs text-brand-600 dark:text-brand-400 font-bold bg-brand-500/10 px-2 py-0.5 rounded-md">
                      Negotiable Price
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Key specs */}
            <div className="bg-white dark:bg-dark-800/60 border border-slate-200/80 dark:border-dark-500/60 rounded-2xl p-6 shadow-sm dark:shadow-none">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Property Specifications</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { icon: Square, label: 'Size', value: formatArea(property.size, property.sizeUnit) },
                  property.bedrooms ? { icon: Bed, label: 'Bedrooms', value: `${property.bedrooms} Beds` } : null,
                  property.bathrooms ? { icon: Bath, label: 'Bathrooms', value: `${property.bathrooms} Baths` } : null,
                  property.floorNumber ? { icon: Layers, label: 'Floor', value: `${property.floorNumber} / ${property.totalFloors || 'N/A'}` } : null,
                  property.facing ? { icon: Navigation, label: 'Facing', value: property.facing } : null,
                  property.furnishing ? { icon: Home, label: 'Furnishing', value: property.furnishing.replace('_', ' ') } : null,
                  property.parkingSpaces ? { icon: Car, label: 'Parking', value: `${property.parkingSpaces} Cars` } : null,
                  property.liftCount ? { icon: Building2, label: 'Lifts', value: `${property.liftCount}` } : null,
                ].filter(Boolean).map((s, i) => {
                  const Icon = s!.icon;
                  return (
                    <div key={i} className="bg-slate-50 dark:bg-dark-700/60 rounded-xl p-3 border border-slate-200/80 dark:border-dark-500/40">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s!.label}</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white capitalize">{s!.value}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bangladesh Specific Features */}
            <div className="bg-white dark:bg-dark-800/60 border border-slate-200/80 dark:border-dark-500/60 rounded-2xl p-6 shadow-sm dark:shadow-none">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Bangladesh Facilities & Utilities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { ok: property.isVerified, icon: ShieldCheck, label: 'Verified Listing' },
                  { ok: property.gasConnection === 'titas', icon: Flame, label: 'Titas Gas Line' },
                  { ok: property.gasConnection === 'lpg', icon: Flame, label: 'LPG Gas System' },
                  { ok: property.wasaWater, icon: Droplets, label: 'WASA Water Line' },
                  { ok: property.generatorBackup, icon: Zap, label: 'Generator Backup' },
                  { ok: property.securityGuard, icon: Lock, label: '24/7 Security Guard' },
                  { ok: property.cctv, icon: Eye, label: 'CCTV Surveillance' },
                  { ok: property.electricityType === 'prepaid', icon: Zap, label: 'Prepaid Electric Meter' },
                ].filter(f => f.ok).map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-xl px-3 py-2.5">
                    <f.icon className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                    <span className="text-xs font-semibold text-brand-700 dark:text-brand-200">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-dark-800/60 border border-slate-200/80 dark:border-dark-500/60 rounded-2xl p-6 shadow-sm dark:shadow-none">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Detailed Description</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {/* Report */}
            <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-500 transition-colors">
              <Flag className="w-3.5 h-3.5" /> Report this listing to moderators
            </button>
          </div>

          {/* RIGHT COLUMN: Sticky Contact & Role-Based Analytics */}
          <div className="space-y-6">
            <div className="sticky top-24 space-y-6">

              {/* POST OWNER ANALYTICS SECTION (Item 5) */}
              {isOwner && (
                <div className="bg-gradient-to-br from-white via-white to-brand-50/50 dark:from-dark-800 dark:via-dark-800 dark:to-brand-950/20 border-2 border-brand-500/40 rounded-2xl p-5 shadow-lg shadow-brand-500/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Ad Analytics (Owner View)
                      </h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Live Tracking
                    </span>
                  </div>

                  {/* 3 Metric Cards: Views, Clicks, Reach */}
                  <div className="grid grid-cols-3 gap-2.5 mb-4">
                    <div className="bg-white/80 dark:bg-dark-700/60 border border-slate-200/80 dark:border-dark-500/50 rounded-xl p-3 text-center">
                      <div className="flex items-center justify-center text-slate-400 mb-1">
                        <Eye className="w-4 h-4 text-brand-500" />
                      </div>
                      <div className="text-lg font-black text-slate-900 dark:text-white">{totalViews.toLocaleString()}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Total Views</div>
                    </div>

                    <div className="bg-white/80 dark:bg-dark-700/60 border border-slate-200/80 dark:border-dark-500/50 rounded-xl p-3 text-center">
                      <div className="flex items-center justify-center text-slate-400 mb-1">
                        <MousePointerClick className="w-4 h-4 text-teal-500" />
                      </div>
                      <div className="text-lg font-black text-slate-900 dark:text-white">{totalClicks.toLocaleString()}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Total Clicks</div>
                    </div>

                    <div className="bg-white/80 dark:bg-dark-700/60 border border-slate-200/80 dark:border-dark-500/50 rounded-xl p-3 text-center">
                      <div className="flex items-center justify-center text-slate-400 mb-1">
                        <Users className="w-4 h-4 text-purple-500" />
                      </div>
                      <div className="text-lg font-black text-slate-900 dark:text-white">{totalReach.toLocaleString()}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Total Reach</div>
                    </div>
                  </div>

                  {/* Conversion & Internal ID */}
                  <div className="space-y-2 text-xs border-t border-slate-200/70 dark:border-dark-600/70 pt-3">
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                      <span>Inquiry Rate</span>
                      <span className="font-bold text-brand-600 dark:text-brand-400">{conversionRate}%</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                      <span>Internal Listing ID</span>
                      <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">{property.id}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                      <span>Approval Status</span>
                      <span className="font-bold capitalize text-emerald-600 dark:text-emerald-400">{property.approval_status || 'approved'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SELLER & CONTACT CARD (Item 6: Blurred for Guests) */}
              <div className="relative bg-white dark:bg-dark-800/80 border border-slate-200/80 dark:border-dark-500/60 rounded-2xl p-5 shadow-sm dark:shadow-none overflow-hidden">
                
                {/* Contact Card Body (Blurred if guest) */}
                <div className={!user ? 'filter blur-md select-none pointer-events-none opacity-40 transition-all duration-300' : ''}>
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4">Contact Seller</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-xl font-black text-brand-600 dark:text-brand-400">
                      {property.sellerName ? property.sellerName[0] : 'S'}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        {property.sellerName}
                        {property.sellerVerified && <ShieldCheck className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />}
                      </div>
                      <div className="text-xs text-slate-500 capitalize">{property.sellerType}</div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <a
                      href={`tel:${property.sellerPhone}`}
                      onClick={handleContactClick}
                      className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm transition-all shadow-glow-sm"
                    >
                      <Phone className="w-4 h-4" />
                      {property.sellerPhone}
                    </a>
                    <a
                      href={waLink}
                      onClick={handleContactClick}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-[#25D366] hover:bg-[#22c55e] text-white font-bold text-sm transition-all shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat on WhatsApp
                    </a>
                  </div>

                  <p className="text-[10px] text-slate-500 text-center mt-4 leading-relaxed">
                    Plotify charges zero buyer brokerage fees. Contact directly and verify documents.
                  </p>
                </div>

                {/* GUEST OVERLAY (Item 6) */}
                {!user && (
                  <div className="absolute inset-0 bg-white/70 dark:bg-dark-900/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center z-20">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3 shadow-sm">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white mb-1.5">
                      Owner Details Locked
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 max-w-xs leading-relaxed">
                      Log in or Sign up to view owner phone number, WhatsApp contact, and verified credentials.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xs">
                      <Link
                        href={`/auth/login?redirect=/properties/${property.id}`}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-sm text-center"
                      >
                        Log In
                      </Link>
                      <Link
                        href={`/auth/register?redirect=/properties/${property.id}`}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-700 dark:hover:bg-dark-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-dark-600 text-center"
                      >
                        Sign Up
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* LISTING INFO CARD (Item 5: Role-based filtering) */}
              <div className="bg-white dark:bg-dark-800/60 border border-slate-200/80 dark:border-dark-500/60 rounded-2xl p-5 space-y-3 shadow-sm dark:shadow-none">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Listing Information</h3>
                <div className="space-y-2.5 text-xs">
                  {/* Public Details: Posted Date */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Posted Date
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">
                      {new Date(property.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Property Type</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold capitalize">
                      {property.category} ({property.purpose === 'buy' ? 'For Sale' : 'For Rent'})
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Location</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">
                      {property.area}, {property.district}
                    </span>
                  </div>

                  {/* Internal backend listing data: ONLY visible to Owner or Admin */}
                  {isOwner && (
                    <>
                      <div className="pt-2 border-t border-slate-200/70 dark:border-dark-600/70"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Internal ID</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{property.id}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Internal Status</span>
                        <span className="text-brand-600 dark:text-brand-300 font-bold capitalize">{property.status}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Activation Status</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold capitalize">{property.activationStatus || 'active'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Similar Properties */}
        {related.length > 0 && (
          <div className="mt-16 pt-8 border-t border-slate-200 dark:border-dark-700">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">Similar Properties in {property.area}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map(p => (
                <div key={p.id} className="bg-white dark:bg-dark-800/60 border border-slate-200/80 dark:border-dark-500/60 rounded-2xl overflow-hidden shadow-sm dark:shadow-none card-hover">
                  <div className="relative aspect-[16/9]">
                    <Image src={p.featuredImage} alt={p.title} fill className="object-cover" />
                    <span className="absolute top-2 left-2 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded bg-dark-900/80 text-white backdrop-blur-md">
                      {p.purpose === 'buy' ? 'For Sale' : 'For Rent'}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="text-lg font-black text-slate-900 dark:text-white">{formatBDT(p.price, p.priceUnit === 'bdt_per_month')}</div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1 line-clamp-1">{p.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                      <MapPin className="w-3 h-3 text-brand-500" /> {p.area}, {p.district}
                    </div>
                    <Link 
                      href={`/properties/${p.id}`} 
                      className="mt-3 block text-center py-2 rounded-xl bg-slate-100 hover:bg-brand-500/10 dark:bg-dark-700/60 dark:hover:bg-brand-500/10 border border-slate-200 hover:border-brand-500/30 dark:border-dark-500/60 dark:hover:border-brand-500/30 text-xs font-bold text-brand-600 dark:text-brand-300 transition-all"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
