'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DataStore } from '@/lib/data/store';
import { Property, User, ApprovalStatus } from '@/lib/types';
import { formatBDT } from '@/lib/utils';
import {
  Building2, Users, DollarSign, Clock, CheckCircle2,
  AlertTriangle, TrendingUp, Bot, Flag, ArrowUpRight,
  Eye, Check, X, ShieldAlert, FileText, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState(DataStore.getAdminStats());
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [aiLogs, setAiLogs] = useState(DataStore.getAiLogs());
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const refreshData = () => {
    setStats(DataStore.getAdminStats());
    setProperties(DataStore.getProperties());
    setUsers(DataStore.getUsers());
    setAiLogs(DataStore.getAiLogs());
  };

  useEffect(() => {
    refreshData();
    DataStore.syncAiLogsFromServer().then(() => refreshData());
    window.addEventListener('plotify_properties_updated', refreshData);
    window.addEventListener('plotify_users_updated', refreshData);
    window.addEventListener('plotify_ai_logs_updated', refreshData);
    return () => {
      window.removeEventListener('plotify_properties_updated', refreshData);
      window.removeEventListener('plotify_users_updated', refreshData);
      window.removeEventListener('plotify_ai_logs_updated', refreshData);
    };
  }, []);

  const handleApproveProperty = (id: string, title: string) => {
    DataStore.updatePropertyApproval(id, 'approved');
    refreshData();
    setActionMessage(`Approved "${title}"! Listing is now visible on public homepage.`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleRejectProperty = (id: string, title: string) => {
    DataStore.updatePropertyApproval(id, 'rejected');
    refreshData();
    setActionMessage(`Rejected "${title}".`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleApproveUserUpgrade = (userId: string, name: string) => {
    DataStore.approveUserBusinessUpgrade(userId);
    refreshData();
    setActionMessage(`Approved Business Account for "${name}". They can now list properties.`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const pendingListings = properties.filter(p => p.approval_status === 'pending');
  const pendingUserUpgrades = users.filter(u =>
    u.upgradeStatus === 'pending_approval' ||
    (u.verificationStatus === 'pending' && !u.isVerified) ||
    (u.role === 'business' && !u.isVerified)
  );

  const STATS_CARDS = [
    {
      label: 'Total Registered Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      trend: `${users.filter(u => u.role === 'business').length} Business, ${users.filter(u => u.role === 'personal').length} Personal`,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-500/10 border-teal-500/20'
    },
    {
      label: 'Pending Approvals',
      value: stats.pendingApprovals.toLocaleString(),
      icon: Clock,
      trend: `${stats.pendingListingsCount} Listings, ${stats.pendingUsersCount} User Upgrades`,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      label: 'Total Properties Listed',
      value: stats.totalListings.toLocaleString(),
      icon: Building2,
      trend: `${stats.approvedListingsCount} Approved Live, ${stats.rejectedListingsCount} Rejected`,
      color: 'text-brand-600 dark:text-brand-400',
      bg: 'bg-brand-500/10 border-brand-500/20'
    },
    {
      label: 'Est. Activation Revenue',
      value: `৳ ${(stats.totalRevenue).toLocaleString()}`,
      icon: DollarSign,
      trend: 'From verified listing fees',
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20'
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Admin Overview</h1>
        <p className="text-xs text-slate-500 mt-1">Real-time platform metrics, listing reviews, and user verification requests.</p>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Real Data Stats Grid (Requirement 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS_CARDS.map(s => (
          <div key={s.label} className={`p-5 rounded-2xl bg-white dark:bg-dark-800 border ${s.bg} shadow-sm dark:shadow-none`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
            <div suppressHydrationWarning className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div suppressHydrationWarning className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-brand-500" /> {s.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Two Columns: Pending Listings & Pending Business Upgrades */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* 1. Pending Property Listings Review (Requirement 4) */}
        <div className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-500/60 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Listing Approval Queue
              <span className="text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 text-[10px] font-black px-2 py-0.5 rounded-full">
                {pendingListings.length} Pending
              </span>
            </h2>
            <Link href="/admin/listings" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {pendingListings.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              ✓ All property listings have been reviewed. No pending approvals in queue!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingListings.slice(0, 4).map(p => (
                <div key={p.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-700/60 border border-slate-200 dark:border-dark-500/40 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <img src={p.featuredImage} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{p.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {p.area}, {p.district} · {formatBDT(p.price)} · By <span className="font-semibold">{p.sellerName}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-0 border-slate-200 dark:border-dark-600">
                    <button
                      onClick={() => handleApproveProperty(p.id, p.title)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => handleRejectProperty(p.id, p.title)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20 transition-all flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Pending Business Upgrades Review (Requirement 2 & 3) */}
        <div className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-500/60 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              Business Account Verifications
              <span className="text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 text-[10px] font-black px-2 py-0.5 rounded-full">
                {pendingUserUpgrades.length} Pending
              </span>
            </h2>
            <Link href="/admin/users" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {pendingUserUpgrades.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              ✓ No pending business account upgrade applications.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUserUpgrades.map(u => (
                <div key={u.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-700/60 border border-slate-200 dark:border-dark-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{u.fullName}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Org: <strong className="text-slate-800 dark:text-slate-200">{u.organizationName || u.businessName || 'Business User'}</strong>
                        {u.nidNumber ? ` · NID: ${u.nidNumber}` : ''}
                      </p>
                      <p className="text-[10px] text-slate-400">{u.mobile} · {u.email}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      {u.nidUrl ? 'NID Submitted' : 'Pending Verification'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                    <div className="h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-dark-500 bg-black/20 relative">
                      <img src={u.nidUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80'} alt="NID" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1 rounded">NID Card</span>
                    </div>
                    <div className="h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-dark-500 bg-black/20 relative">
                      <img src={u.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'} alt="Photo" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1 rounded">Photo</span>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      onClick={() => handleApproveUserUpgrade(u.id, u.fullName)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-sm"
                    >
                      Approve & Verify Account ✓
                    </button>
                    <button
                      onClick={() => {
                        DataStore.rejectUserBusinessUpgrade(u.id);
                        refreshData();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 text-xs font-bold hover:bg-rose-500/20 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ploti AI Live Logs and Recent Financials */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Ploti AI Queries Feed (Requirement 5) */}
        <div className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-500/60 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-500" />
              Ploti AI — Live User Queries
            </h2>
            <Link href="/admin/ai-logs" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">
              All Logs →
            </Link>
          </div>

          {aiLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No Ploti AI queries logged yet. Real-time user questions will appear here.
            </div>
          ) : (
            <div className="space-y-2.5">
              {aiLogs.slice(0, 4).map(log => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-50 dark:bg-dark-700/60 border border-slate-200 dark:border-dark-500/40 text-xs space-y-1">
                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span className="font-bold text-brand-600 dark:text-brand-400">{log.user}</span>
                    <span>{log.time} · {log.latency}</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">"{log.query}"</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Financial Overview - Live Platform Data */}
        <div className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-500/60 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              Listing Fee Financials (Live Database)
            </h2>
            <Link href="/admin/financials" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">
              View Ledger →
            </Link>
          </div>

          <div className="space-y-3">
            {[
              {
                label: 'Active Approved Listings',
                val: `${properties.filter(p => p.approval_status === 'approved').length} Properties Live`,
                color: 'text-brand-600 dark:text-brand-400'
              },
              {
                label: 'Flats & Apartments Activation',
                val: (() => {
                  const m = properties.filter(p => p.category === 'flat');
                  const cfg = DataStore.getFeeSchedule().find(s => s.category === 'flat');
                  if (m.length === 0) return `৳ ${cfg?.minFee.toLocaleString() ?? '1,000'} (Base Policy)`;
                  const avg = Math.round(m.reduce((acc, p) => acc + (p.activationFee || cfg?.minFee || 1000), 0) / m.length);
                  return `৳ ${avg.toLocaleString()} avg (${m.length} in db)`;
                })(),
                color: 'text-emerald-600 dark:text-emerald-400'
              },
              {
                label: 'Plots & Land (Jomi) Activation',
                val: (() => {
                  const m = properties.filter(p => p.category === 'land');
                  const cfg = DataStore.getFeeSchedule().find(s => s.category === 'land');
                  if (m.length === 0) return `৳ ${cfg?.minFee.toLocaleString() ?? '700'} (Base Policy)`;
                  const avg = Math.round(m.reduce((acc, p) => acc + (p.activationFee || cfg?.minFee || 700), 0) / m.length);
                  return `৳ ${avg.toLocaleString()} avg (${m.length} in db)`;
                })(),
                color: 'text-teal-600 dark:text-teal-400'
              },
              {
                label: 'Houses & Other Types',
                val: (() => {
                  const m = properties.filter(p => p.category === 'house');
                  const cfg = DataStore.getFeeSchedule().find(s => s.category === 'house');
                  if (m.length === 0) return `৳ ${cfg?.minFee.toLocaleString() ?? '1,000'} (Base Policy)`;
                  const avg = Math.round(m.reduce((acc, p) => acc + (p.activationFee || cfg?.minFee || 1000), 0) / m.length);
                  return `৳ ${avg.toLocaleString()} avg (${m.length} in db)`;
                })(),
                color: 'text-amber-600 dark:text-amber-400'
              },
            ].map(f => (
              <div key={f.label} className="p-3 rounded-xl bg-slate-50 dark:bg-dark-700/60 border border-slate-200 dark:border-dark-500/40 flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">{f.label}</span>
                <span className={`font-bold ${f.color}`}>{f.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
