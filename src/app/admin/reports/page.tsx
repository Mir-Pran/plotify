'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Flag, AlertTriangle, CheckCircle2, XCircle, Search, 
  Filter, Eye, ExternalLink, ShieldAlert, Check, Ban
} from 'lucide-react';
import { DataStore } from '@/lib/data/store';

interface ReportItem {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyArea: string;
  reporterName: string;
  reporterPhone: string;
  reason: 'fake_listing' | 'wrong_price' | 'already_sold' | 'fraud_scam' | 'duplicate';
  notes: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

const INITIAL_REPORTS: ReportItem[] = [
  {
    id: 'rep-1',
    propertyId: 'mock-1',
    propertyTitle: 'Luxury 3BHK Apartment in Gulshan 2 with Lake View',
    propertyArea: 'Gulshan 2, Dhaka',
    reporterName: 'Rahim Chowdhury',
    reporterPhone: '01711223344',
    reason: 'wrong_price',
    notes: 'Seller quoted 4.2 Crore on phone call instead of 3.85 Crore displayed on listing.',
    status: 'pending',
    createdAt: '2026-03-24T14:30:00Z',
  },
  {
    id: 'rep-2',
    propertyId: 'mock-3',
    propertyTitle: 'Commercial Floor Space at Motijheel Commercial Area',
    propertyArea: 'Motijheel, Dhaka',
    reporterName: 'Tanvir Hossain',
    reporterPhone: '01819554433',
    reason: 'already_sold',
    notes: 'The owner said this floor was already rented last month.',
    status: 'pending',
    createdAt: '2026-03-23T11:15:00Z',
  },
  {
    id: 'rep-3',
    propertyId: 'mock-6',
    propertyTitle: 'Shared Mess Room for Students near DU',
    propertyArea: 'Nilkhet, Dhaka',
    reporterName: 'Arif Billah',
    reporterPhone: '01912334455',
    reason: 'fake_listing',
    notes: 'Pictures belong to a different hostel in Katabon.',
    status: 'resolved',
    createdAt: '2026-03-20T09:40:00Z',
  },
  {
    id: 'rep-4',
    propertyId: 'mock-2',
    propertyTitle: 'Prime 5-Katha Residential Plot in Purbachal Sector 17',
    propertyArea: 'Purbachal, Dhaka',
    reporterName: 'Shakil Ahmed',
    reporterPhone: '01678998877',
    reason: 'duplicate',
    notes: 'Duplicate posting by third-party broker without authorization.',
    status: 'dismissed',
    createdAt: '2026-03-19T16:20:00Z',
  },
];

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>(INITIAL_REPORTS);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all');
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  const handleResolve = (id: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'resolved' } : r));
    if (selectedReport?.id === id) {
      setSelectedReport(prev => prev ? { ...prev, status: 'resolved' } : null);
    }
  };

  const handleDismiss = (id: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'dismissed' } : r));
    if (selectedReport?.id === id) {
      setSelectedReport(prev => prev ? { ...prev, status: 'dismissed' } : null);
    }
  };

  const handleTakedownListing = (propertyId: string, reportId: string) => {
    if (confirm('Are you sure you want to reject and take down this property listing?')) {
      DataStore.updatePropertyApproval(propertyId, 'rejected');
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
      alert('Listing has been rejected and taken down from public view. Report marked resolved.');
    }
  };

  const filtered = reports.filter(r => {
    const matchesFilter = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch = 
      r.propertyTitle.toLowerCase().includes(search.toLowerCase()) ||
      r.reporterName.toLowerCase().includes(search.toLowerCase()) ||
      r.notes.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Flag className="w-6 h-6 text-rose-500" />
            Reported Listings & Abuse
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review community flag reports, pricing disputes, and take moderation action.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            {pendingCount} Pending Inquiries
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by property, reporter, or report notes..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-dark-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['all', 'pending', 'resolved', 'dismissed'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-2 text-xs font-bold rounded-xl capitalize transition-all ${
                filterStatus === st
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-white dark:bg-dark-800 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-dark-800/80 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Property</th>
                <th className="py-3.5 px-4">Reporter</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4">Notes</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No reports match the current filter.
                  </td>
                </tr>
              ) : (
                filtered.map(report => (
                  <tr key={report.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {report.propertyTitle}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {report.propertyArea}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {report.reporterName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {report.reporterPhone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                        {report.reason.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs text-slate-600 dark:text-slate-300">
                      <p className="line-clamp-2">{report.notes}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                        report.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : report.status === 'resolved'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/properties/${report.propertyId}`}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-colors"
                          title="View Property"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        {report.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleResolve(report.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1 transition-colors"
                              title="Mark as Resolved"
                            >
                              <Check className="w-3 h-3" /> Resolve
                            </button>
                            <button
                              onClick={() => handleTakedownListing(report.propertyId, report.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center gap-1 transition-colors"
                              title="Reject & Take Down Listing"
                            >
                              <Ban className="w-3 h-3" /> Take Down
                            </button>
                            <button
                              onClick={() => handleDismiss(report.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold text-[11px] transition-colors"
                              title="Dismiss Report"
                            >
                              Dismiss
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
