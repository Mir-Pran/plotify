'use client';

import React, { useState, useEffect } from 'react';
import { DataStore } from '@/lib/data/store';
import { User, UserRole, UpgradeStatus, Property } from '@/lib/types';
import {
  Users, Search, ShieldCheck, Briefcase, UserCheck, Check,
  X, Eye, Clock, AlertCircle, FileText, CheckCircle2, Edit3, Trash2, Shield, AlertTriangle
} from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filterRole, setFilterRole] = useState<'all' | 'personal' | 'business' | 'admin' | 'pending_upgrade'>('all');
  const [search, setSearch] = useState('');
  
  // Modals state
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [inspectingNidUser, setInspectingNidUser] = useState<User | null>(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState<{
    fullName: string;
    email: string;
    mobile: string;
    role: UserRole;
    businessName: string;
    isVerified: boolean;
    upgradeStatus: UpgradeStatus;
  }>({
    fullName: '',
    email: '',
    mobile: '',
    role: 'personal',
    businessName: '',
    isVerified: false,
    upgradeStatus: 'none',
  });

  const [feedback, setFeedback] = useState<string | null>(null);
  const [allProperties, setAllProperties] = useState<Property[]>([]);

  const loadUsers = () => {
    setUsers(DataStore.getUsers());
    setAllProperties(DataStore.getProperties());
  };
  const loadData = loadUsers;

  useEffect(() => {
    loadData();
    window.addEventListener('plotify_users_updated', loadData);
    window.addEventListener('plotify_properties_updated', loadData);
    return () => {
      window.removeEventListener('plotify_users_updated', loadData);
      window.removeEventListener('plotify_properties_updated', loadData);
    };
  }, []);

  const handleApproveUpgrade = (userId: string, name: string) => {
    DataStore.approveUserBusinessUpgrade(userId);
    loadUsers();
    setFeedback(`Approved business account upgrade for ${name}!`);
    setInspectingNidUser(null);
    if (viewingUser?.id === userId) {
      setViewingUser(DataStore.getUserById(userId) || null);
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleRejectUpgrade = (userId: string, name: string) => {
    DataStore.rejectUserBusinessUpgrade(userId);
    loadUsers();
    setFeedback(`Rejected business upgrade for ${name}.`);
    setInspectingNidUser(null);
    if (viewingUser?.id === userId) {
      setViewingUser(DataStore.getUserById(userId) || null);
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setEditForm({
      fullName: u.fullName,
      email: u.email,
      mobile: u.mobile,
      role: u.role,
      businessName: u.businessName || '',
      isVerified: !!u.isVerified,
      upgradeStatus: u.upgradeStatus || 'none',
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    DataStore.updateUser(editingUser.id, {
      fullName: editForm.fullName.trim(),
      email: editForm.email.trim(),
      mobile: editForm.mobile.trim(),
      role: editForm.role,
      businessName: editForm.businessName.trim() || undefined,
      isVerified: editForm.isVerified,
      upgradeStatus: editForm.upgradeStatus,
    });

    loadUsers();
    setFeedback(`Account details for "${editForm.fullName}" updated successfully!`);
    setEditingUser(null);
    if (viewingUser?.id === editingUser.id) {
      setViewingUser(DataStore.getUserById(editingUser.id) || null);
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDeleteConfirm = () => {
    if (!deletingUser) return;
    if (deletingUser.email === 'support@plotify.store') {
      alert('Cannot delete the root administrator account.');
      setDeletingUser(null);
      return;
    }

    const name = deletingUser.fullName;
    DataStore.deleteUser(deletingUser.id);
    loadUsers();
    setFeedback(`User account "${name}" has been permanently deleted.`);
    setDeletingUser(null);
    if (viewingUser?.id === deletingUser.id) {
      setViewingUser(null);
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  const filtered = users.filter(u => {
    if (filterRole === 'pending_upgrade') {
      const isPending = u.upgradeStatus === 'pending_approval' || u.verificationStatus === 'pending' || (u.role === 'business' && !u.isVerified);
      if (!isPending) return false;
    } else if (filterRole !== 'all') {
      if (u.role !== filterRole) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.mobile.toLowerCase().includes(q) ||
        (u.organizationName && u.organizationName.toLowerCase().includes(q)) ||
        (u.businessName && u.businessName.toLowerCase().includes(q)) ||
        (u.nidNumber && u.nidNumber.includes(q))
      );
    }
    return true;
  });

  const pendingUpgrades = users.filter(u => 
    u.upgradeStatus === 'pending_approval' || 
    (u.verificationStatus === 'pending' && !u.isVerified) || 
    (u.role === 'business' && !u.isVerified)
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-brand-500" />
            User & Account Management (CRUD)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete administrative control: View user dossiers, edit profile parameters, toggle roles, and manage account lifecycles.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-500 px-3.5 py-2 rounded-2xl shadow-sm">
          <span>Registered Accounts:</span>
          <span className="text-brand-600 dark:text-brand-400 font-black">{users.length}</span>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-dark-800 p-3.5 rounded-3xl border border-slate-200 dark:border-dark-500/60 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `All Users (${users.length})` },
            { id: 'pending_upgrade', label: `Pending Upgrades (${pendingUpgrades.length})` },
            { id: 'business', label: `Business (${users.filter(u => u.role === 'business').length})` },
            { id: 'personal', label: `Personal (${users.filter(u => u.role === 'personal').length})` },
            { id: 'admin', label: `Admin (${users.filter(u => u.role === 'admin').length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterRole(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterRole === tab.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full bg-slate-50 dark:bg-dark-700/60 border border-slate-200 dark:border-dark-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-brand-500 transition-all"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-500/60 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-dark-700/50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-dark-500/60">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Organization</th>
                <th className="py-3.5 px-4">Verification</th>
                <th className="py-3.5 px-4 text-right">Actions (View / Edit / Delete)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-600/40 font-medium text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-dark-700/30 transition-colors">
                    {/* User info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-400 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {u.fullName}
                            {u.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />}
                          </div>
                          <div className="text-[10px] text-slate-400">{u.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          u.role === 'admin'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            : u.role === 'business'
                            ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300 border-brand-500/30'
                            : 'bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-dark-500'
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{u.email}</div>
                      <div className="text-[10px] text-slate-500">{u.mobile}</div>
                    </td>

                    {/* Organization */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">
                        {u.organizationName || u.businessName || '—'}
                      </span>
                    </td>

                    {/* Verification Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {u.isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                          <Check className="w-3 h-3" /> Verified
                        </span>
                      ) : (u.upgradeStatus === 'pending_approval' || u.verificationStatus === 'pending' || u.role === 'business') ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30">
                          <Clock className="w-3 h-3" /> Pending Review
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Personal User</span>
                      )}
                    </td>

                    {/* Actions: View, Edit, Delete */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Details */}
                        <button
                          onClick={() => setViewingUser(u)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-dark-500 text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors"
                          title="View user dossier"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit User */}
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-dark-500 text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors"
                          title="Edit user details & role"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* NID Review shortcut */}
                        {(!u.isVerified && (u.upgradeStatus === 'pending_approval' || u.verificationStatus === 'pending' || u.role === 'business' || u.nidUrl)) && (
                          <button
                            onClick={() => setInspectingNidUser(u)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 font-bold text-[10px] border border-amber-500/20 transition-all flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" /> Review NID
                          </button>
                        )}

                        {/* Delete User */}
                        {u.email !== 'support@plotify.store' && (
                          <button
                            onClick={() => setDeletingUser(u)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* 1. VIEW USER DOSSIER MODAL */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-500 p-6 max-w-lg w-full space-y-5 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white font-bold text-base flex items-center justify-center">
                  {viewingUser.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    {viewingUser.fullName}
                    {viewingUser.isVerified && <CheckCircle2 className="w-4 h-4 text-brand-500" />}
                  </h3>
                  <p className="text-xs text-slate-400">ID: {viewingUser.id}</p>
                </div>
              </div>
              <button onClick={() => setViewingUser(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-dark-700/50 border border-slate-200 dark:border-dark-500/40">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Address</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-xs">{viewingUser.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone Number</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-xs">{viewingUser.mobile}</span>
                </div>
                <div className="pt-2 border-t border-slate-200/60 dark:border-dark-600">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Account Role</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400 uppercase text-xs">{viewingUser.role}</span>
                </div>
                <div className="pt-2 border-t border-slate-200/60 dark:border-dark-600">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Company / Agency</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-xs">{viewingUser.businessName || 'None'}</span>
                </div>
              </div>

              {/* Activity Info */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-700/50 border border-slate-200 dark:border-dark-500/40 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Listings Posted:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {allProperties.filter(p => p.sellerId === viewingUser.id).length} Properties
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Account Registered:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {new Date(viewingUser.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Upgrade Application:</span>
                  <span className="font-bold capitalize text-slate-900 dark:text-white">
                    {viewingUser.upgradeStatus || 'None'}
                  </span>
                </div>
              </div>

              {/* Submitted NID documents if present */}
              {(viewingUser.nidUrl || viewingUser.photoUrl) && (
                <div className="space-y-2 pt-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Verification Documents
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {viewingUser.nidUrl && (
                      <div className="h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-dark-500 relative">
                        <img src={viewingUser.nidUrl} alt="NID" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded">NID Card</span>
                      </div>
                    )}
                    {viewingUser.photoUrl && (
                      <div className="h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-dark-500 relative">
                        <img src={viewingUser.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded">Photo</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-dark-600">
              <button
                onClick={() => {
                  setViewingUser(null);
                  openEditModal(viewingUser);
                }}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Account
              </button>
              <button
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-dark-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-500 p-6 max-w-lg w-full space-y-4 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-600">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-brand-500" />
                  Edit User Account
                </h3>
                <p className="text-xs text-slate-400">Modifying profile for: {editingUser.email}</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editForm.mobile}
                    onChange={e => setEditForm(f => ({ ...f, mobile: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Account Role</label>
                  <select
                    value={editForm.role}
                    onChange={e => setEditForm(f => ({ ...f, role: e.target.value as UserRole }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  >
                    <option value="personal">Personal User</option>
                    <option value="business">Business / Agency</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Upgrade Status</label>
                  <select
                    value={editForm.upgradeStatus}
                    onChange={e => setEditForm(f => ({ ...f, upgradeStatus: e.target.value as UpgradeStatus }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  >
                    <option value="none">None</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Business / Agency Name</label>
                <input
                  type="text"
                  value={editForm.businessName}
                  onChange={e => setEditForm(f => ({ ...f, businessName: e.target.value }))}
                  placeholder="Leave empty for personal user"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-500 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isVerified}
                    onChange={e => setEditForm(f => ({ ...f, isVerified: e.target.checked }))}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                  />
                  Verified Account Badge
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-dark-600">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-dark-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. DELETE USER CONFIRMATION MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-500 p-6 max-w-md w-full space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Delete User Account</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete the account for <strong className="text-slate-900 dark:text-white">{deletingUser.fullName}</strong> ({deletingUser.email})?
            </p>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-dark-600">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-dark-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. INSPECT NID MODAL */}
      {inspectingNidUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-500 p-6 max-w-lg w-full space-y-4 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-600">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Business Verification Dossier</h3>
                <p className="text-xs text-slate-500">Applicant: {inspectingNidUser.fullName} ({inspectingNidUser.email})</p>
              </div>
              <button onClick={() => setInspectingNidUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-700/60 border border-slate-200 dark:border-dark-500">
                <div>
                  <span className="text-slate-400 block text-[11px]">Organization / Company:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    {inspectingNidUser.organizationName || inspectingNidUser.businessName || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">National ID (NID) Number:</span>
                  <span className="font-bold font-mono text-brand-600 dark:text-brand-400 text-xs">
                    {inspectingNidUser.nidNumber || 'Not submitted'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Registered Mobile:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{inspectingNidUser.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Current Status:</span>
                  <span className="font-bold capitalize text-amber-600 dark:text-amber-400">
                    {inspectingNidUser.isVerified ? 'Verified' : (inspectingNidUser.verificationStatus || 'Pending')}
                  </span>
                </div>
              </div>

              {/* Document Previews */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  National ID (NID) Document
                </label>
                {inspectingNidUser.nidUrl ? (
                  <div className="h-48 rounded-2xl overflow-hidden border border-slate-200 dark:border-dark-500 bg-black/10 relative group">
                    <img
                      src={inspectingNidUser.nidUrl}
                      alt="NID Document"
                      className="w-full h-full object-contain"
                    />
                    <a
                      href={inspectingNidUser.nidUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black text-white text-[10px] font-bold"
                    >
                      Open Full Image ↗
                    </a>
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-2xl border border-dashed border-slate-300 dark:border-dark-500 text-slate-400">
                    No NID document uploaded yet.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Official Color Photograph
                </label>
                {inspectingNidUser.photoUrl ? (
                  <div className="h-36 w-36 rounded-2xl overflow-hidden border-2 border-brand-500 mx-auto shadow-md">
                    <img
                      src={inspectingNidUser.photoUrl}
                      alt="Photograph"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="p-4 text-center rounded-2xl border border-dashed border-slate-300 dark:border-dark-500 text-slate-400">
                    No photo uploaded yet.
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 dark:border-dark-600">
              <button
                onClick={() => handleRejectUpgrade(inspectingNidUser.id, inspectingNidUser.fullName)}
                className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-600 font-bold text-xs hover:bg-rose-500/20 transition-all"
              >
                Reject Verification
              </button>
              <button
                onClick={() => handleApproveUpgrade(inspectingNidUser.id, inspectingNidUser.fullName)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
              >
                Approve & Verify Account ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
