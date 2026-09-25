'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DataStore } from '@/lib/data/store';
import { Property, ApprovalStatus, PropertyCategory, PropertyPurpose, AreaUnit } from '@/lib/types';
import { formatBDT } from '@/lib/utils';
import { BD_DIVISIONS, BD_DISTRICTS, type BDDivision } from '@/lib/data/bd-locations';
import {
  Building2, Search, Check, X, Trash2, Eye, Filter,
  Clock, CheckCircle2, AlertTriangle, ArrowUpDown, ChevronDown, Edit3, ShieldCheck, Star
} from 'lucide-react';

export default function AdminListingsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Edit Modal State
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    price: number;
    priceUnit: 'bdt_total' | 'bdt_per_month' | 'bdt_per_katha';
    purpose: PropertyPurpose;
    category: PropertyCategory;
    division: BDDivision;
    district: string;
    area: string;
    address: string;
    size: number;
    sizeUnit: AreaUnit;
    bedrooms?: number;
    bathrooms?: number;
    approval_status: ApprovalStatus;
    isFeatured: boolean;
    isVerified: boolean;
    sellerName: string;
    sellerPhone: string;
    activationFee: number;
  }>({
    title: '',
    description: '',
    price: 0,
    priceUnit: 'bdt_total',
    purpose: 'buy',
    category: 'flat',
    division: 'Dhaka',
    district: 'Dhaka',
    area: '',
    address: '',
    size: 0,
    sizeUnit: 'sqft',
    bedrooms: 0,
    bathrooms: 0,
    approval_status: 'pending',
    isFeatured: false,
    isVerified: false,
    sellerName: '',
    sellerPhone: '',
    activationFee: 1500,
  });

  const loadProperties = () => {
    setProperties(DataStore.getProperties());
  };

  useEffect(() => {
    loadProperties();
    window.addEventListener('plotify_properties_updated', loadProperties);
    return () => window.removeEventListener('plotify_properties_updated', loadProperties);
  }, []);

  const handleStatusChange = (id: string, newStatus: ApprovalStatus) => {
    DataStore.updatePropertyApproval(id, newStatus);
    loadProperties();
    setFeedback(`Listing status updated to "${newStatus}".`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this property listing?')) {
      DataStore.deleteProperty(id);
      loadProperties();
      setFeedback('Listing deleted permanently.');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const openEditModal = (p: Property) => {
    setEditingProperty(p);
    setEditForm({
      title: p.title || '',
      description: p.description || '',
      price: p.price || 0,
      priceUnit: p.priceUnit || 'bdt_total',
      purpose: p.purpose || 'buy',
      category: p.category || 'flat',
      division: (p.division as BDDivision) || 'Dhaka',
      district: p.district || 'Dhaka',
      area: p.area || '',
      address: p.address || '',
      size: p.size || 0,
      sizeUnit: p.sizeUnit || 'sqft',
      bedrooms: p.bedrooms || 0,
      bathrooms: p.bathrooms || 0,
      approval_status: p.approval_status || 'pending',
      isFeatured: !!p.isFeatured,
      isVerified: !!p.isVerified,
      sellerName: p.sellerName || '',
      sellerPhone: p.sellerPhone || '',
      activationFee: p.activationFee || 1500,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;

    DataStore.updateProperty(editingProperty.id, {
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      price: Number(editForm.price),
      priceUnit: editForm.priceUnit,
      purpose: editForm.purpose,
      category: editForm.category,
      division: editForm.division,
      district: editForm.district,
      area: editForm.area.trim(),
      address: editForm.address.trim(),
      size: Number(editForm.size),
      sizeUnit: editForm.sizeUnit,
      bedrooms: Number(editForm.bedrooms) || undefined,
      bathrooms: Number(editForm.bathrooms) || undefined,
      approval_status: editForm.approval_status,
      isFeatured: editForm.isFeatured,
      isVerified: editForm.isVerified,
      sellerName: editForm.sellerName.trim(),
      sellerPhone: editForm.sellerPhone.trim(),
      activationFee: Number(editForm.activationFee),
    });

    loadProperties();
    setFeedback(`Listing "${editForm.title}" modified and updated successfully!`);
    setEditingProperty(null);
    setTimeout(() => setFeedback(null), 3500);
  };

  const filtered = properties.filter(p => {
    if (filterStatus !== 'all' && p.approval_status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.area.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.sellerName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = properties.filter(p => p.approval_status === 'pending').length;
  const approvedCount = properties.filter(p => p.approval_status === 'approved').length;
  const rejectedCount = properties.filter(p => p.approval_status === 'rejected').length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-brand-500" />
            Property Listings Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete administrative authority: Edit listings, override pricing, modify specs, and govern approval states.
          </p>
        </div>
        <Link
          href="/dashboard/add-property"
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-glow-sm transition-all"
        >
          + Post Admin Listing
        </Link>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-dark-800 p-3.5 rounded-3xl border border-slate-200 dark:border-dark-500/60 shadow-sm">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `All Listings (${properties.length})` },
            { id: 'pending', label: `Pending Approvals (${pendingCount})` },
            { id: 'approved', label: `Approved & Live (${approvedCount})` },
            { id: 'rejected', label: `Rejected (${rejectedCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterStatus === tab.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search listings, areas, sellers..."
            className="w-full bg-slate-50 dark:bg-dark-700/60 border border-slate-200 dark:border-dark-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-brand-500 transition-all"
          />
        </div>
      </div>

      {/* Listings Table */}
      <div className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-500/60 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-dark-700/50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-dark-500/60">
              <tr>
                <th className="py-3.5 px-4">Property</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Seller / Agency</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions (Edit / Review / Delete)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-600/40 font-medium text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No properties match your filter.
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-dark-700/30 transition-colors">
                    {/* Property info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={p.featuredImage} alt="" className="w-12 h-10 rounded-lg object-cover shrink-0" />
                        <div className="min-w-0 max-w-[240px]">
                          <div className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5" title={p.title}>
                            {p.title}
                            {p.isFeatured && <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
                            {p.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-brand-500 shrink-0" />}
                          </div>
                          <div className="text-[10px] text-slate-500 capitalize">{p.category} · {p.purpose} · ID: {p.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatBDT(p.price, p.priceUnit === 'bdt_per_month')}
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{p.area}</span>
                      <div className="text-[10px] text-slate-500">{p.district}</div>
                    </td>

                    {/* Seller */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900 dark:text-white">{p.sellerName}</div>
                      <div className="text-[10px] text-slate-500">{p.sellerPhone}</div>
                    </td>

                    {/* Approval Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          p.approval_status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : p.approval_status === 'pending'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {p.approval_status === 'approved' && <Check className="w-3 h-3" />}
                        {p.approval_status === 'pending' && <Clock className="w-3 h-3" />}
                        {p.approval_status === 'rejected' && <X className="w-3 h-3" />}
                        <span className="capitalize">{p.approval_status}</span>
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Listing (Requirement 6) */}
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-dark-500 text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors"
                          title="Edit full listing details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* View Public Page */}
                        <Link
                          href={`/properties/${p.id}`}
                          target="_blank"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-dark-500 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors"
                          title="View public listing page"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        {/* Quick Approve */}
                        {p.approval_status !== 'approved' && (
                          <button
                            onClick={() => handleStatusChange(p.id, 'approved')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition-all"
                            title="Approve listing"
                          >
                            Approve
                          </button>
                        )}

                        {/* Quick Reject */}
                        {p.approval_status !== 'rejected' && (
                          <button
                            onClick={() => handleStatusChange(p.id, 'rejected')}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-[11px] transition-all"
                            title="Reject listing"
                          >
                            Reject
                          </button>
                        )}

                        {/* Delete Listing */}
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Delete listing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL PROPERTY EDITING MODAL (Requirement 6) */}
      {editingProperty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-500 p-6 max-w-2xl w-full space-y-4 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-600">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Edit Property Listing</h3>
                  <p className="text-xs text-slate-400">ID: {editingProperty.id}</p>
                </div>
              </div>
              <button onClick={() => setEditingProperty(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Listing Headline / Title</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Price (BDT)</label>
                  <input
                    type="number"
                    required
                    value={editForm.price}
                    onChange={e => setEditForm(f => ({ ...f, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-500 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Price Format</label>
                  <select
                    value={editForm.priceUnit}
                    onChange={e => setEditForm(f => ({ ...f, priceUnit: e.target.value as any }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  >
                    <option value="bdt_total">Total BDT (Fixed)</option>
                    <option value="bdt_per_month">BDT / Month (Rent)</option>
                    <option value="bdt_per_katha">BDT / Katha (Land)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Purpose</label>
                  <select
                    value={editForm.purpose}
                    onChange={e => setEditForm(f => ({ ...f, purpose: e.target.value as PropertyPurpose }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  >
                    <option value="buy">For Sale (Buy)</option>
                    <option value="rent">For Rent</option>
                    <option value="lease">Commercial Lease</option>
                  </select>
                </div>
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Property Category</label>
                  <select
                    value={editForm.category}
                    onChange={e => setEditForm(f => ({ ...f, category: e.target.value as PropertyCategory }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  >
                    <option value="flat">Flat / Apartment</option>
                    <option value="house">House / Bari</option>
                    <option value="land">Plot & Land (Jomi)</option>
                    <option value="mess">Mess / Sublet / Room</option>
                    <option value="hotel">Hotels & Short-Term</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Approval Status</label>
                  <select
                    value={editForm.approval_status}
                    onChange={e => setEditForm(f => ({ ...f, approval_status: e.target.value as ApprovalStatus }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white font-bold outline-none focus:border-brand-500"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="approved">Approved & Live</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Activation Fee (BDT)</label>
                  <input
                    type="number"
                    value={editForm.activationFee}
                    onChange={e => setEditForm(f => ({ ...f, activationFee: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-500 font-mono text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Division</label>
                  <select
                    value={editForm.division}
                    onChange={e => setEditForm(f => ({ ...f, division: e.target.value as BDDivision }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  >
                    {BD_DIVISIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">District</label>
                  <input
                    type="text"
                    required
                    value={editForm.district}
                    onChange={e => setEditForm(f => ({ ...f, district: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Area / Thana</label>
                  <input
                    type="text"
                    required
                    value={editForm.area}
                    onChange={e => setEditForm(f => ({ ...f, area: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Specs & Seller */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Size</label>
                  <input
                    type="number"
                    value={editForm.size}
                    onChange={e => setEditForm(f => ({ ...f, size: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Size Unit</label>
                  <select
                    value={editForm.sizeUnit}
                    onChange={e => setEditForm(f => ({ ...f, sizeUnit: e.target.value as AreaUnit }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  >
                    <option value="sqft">sqft</option>
                    <option value="katha">Katha</option>
                    <option value="bigha">Bigha</option>
                    <option value="decimal">Decimal</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Bedrooms</label>
                  <input
                    type="number"
                    value={editForm.bedrooms || 0}
                    onChange={e => setEditForm(f => ({ ...f, bedrooms: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Bathrooms</label>
                  <input
                    type="number"
                    value={editForm.bathrooms || 0}
                    onChange={e => setEditForm(f => ({ ...f, bathrooms: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Seller details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Seller / Poster Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.sellerName}
                    onChange={e => setEditForm(f => ({ ...f, sellerName: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Seller Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={editForm.sellerPhone}
                    onChange={e => setEditForm(f => ({ ...f, sellerPhone: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isFeatured}
                    onChange={e => setEditForm(f => ({ ...f, isFeatured: e.target.checked }))}
                    className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                  />
                  Featured Listing (Homepage Priority)
                </label>

                <label className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isVerified}
                    onChange={e => setEditForm(f => ({ ...f, isVerified: e.target.checked }))}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                  />
                  Verified Ownership Badge
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Listing Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-dark-600">
                <button
                  type="button"
                  onClick={() => setEditingProperty(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-dark-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-sm"
                >
                  Save Listing Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
