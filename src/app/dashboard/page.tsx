'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DataStore } from '@/lib/data/store';
import { createClient } from '@/lib/supabase/client';
import { Property, Inquiry, ChatSessionSummary, ChatHistoryMessage, User as UserType } from '@/lib/types';
import { formatBDT, formatArea, cn } from '@/lib/utils';
import {
  LayoutDashboard, PlusCircle, Building2, Eye, Heart, TrendingUp,
  Clock, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Settings, User,
  Bell, LogOut, MapPin, DollarSign, Layers, Home, Upload, ShieldCheck,
  FileText, MessageSquare, Briefcase, ChevronRight, Loader, X,
  Camera, FileUp, Image as ImageIcon, Trash2, Bot, Sparkles, Lock
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, isPersonal, isBusiness, isAdmin, upgradeToBusiness } = useAuth();

  // Local state for properties & inquiries
  const [properties, setProperties] = useState<Property[]>([]);
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  // Upgrade form state & file input refs
  const nidInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [upgradeBusinessName, setUpgradeBusinessName] = useState('');
  const [upgradeNidNumber, setUpgradeNidNumber] = useState('');
  const [upgradeNidUrl, setUpgradeNidUrl] = useState('');
  const [nidFileName, setNidFileName] = useState('');
  const [nidFileSize, setNidFileSize] = useState('');
  const [isDraggingNid, setIsDraggingNid] = useState(false);

  const [upgradePhotoUrl, setUpgradePhotoUrl] = useState('');
  const [photoFileName, setPhotoFileName] = useState('');
  const [photoFileSize, setPhotoFileSize] = useState('');
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  const [upgradeSubmitting, setUpgradeSubmitting] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'saved' | 'inquiries' | 'upgrade' | 'ai-history'>('overview');

  // Ploti AI Chat History states (Requirement 3)
  const [chatSessions, setChatSessions] = useState<ChatSessionSummary[]>([]);
  const [loadingChatSessions, setLoadingChatSessions] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSessionMessages, setSelectedSessionMessages] = useState<ChatHistoryMessage[]>([]);
  const [loadingSessionMessages, setLoadingSessionMessages] = useState(false);

  const loadChatSessions = async (userId: string) => {
    setLoadingChatSessions(true);
    try {
      const sessions = await DataStore.getChatSessions(userId);
      setChatSessions(sessions);
      if (sessions.length > 0 && !selectedSessionId) {
        setSelectedSessionId(sessions[0].sessionId);
        loadSessionMessages(userId, sessions[0].sessionId);
      }
    } catch (e) {
      console.error('Failed to load chat sessions:', e);
    } finally {
      setLoadingChatSessions(false);
    }
  };

  const loadSessionMessages = async (userId: string, sId: string) => {
    setSelectedSessionId(sId);
    setLoadingSessionMessages(true);
    try {
      const msgs = await DataStore.getSessionMessages(userId, sId);
      setSelectedSessionMessages(msgs);
    } catch (e) {
      console.error('Failed to load session messages:', e);
    } finally {
      setLoadingSessionMessages(false);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sId: string) => {
    e.stopPropagation();
    if (!user) return;
    await DataStore.deleteChatSession(user.id, sId);
    const updated = chatSessions.filter(s => s.sessionId !== sId);
    setChatSessions(updated);
    if (selectedSessionId === sId) {
      if (updated.length > 0) {
        loadSessionMessages(user.id, updated[0].sessionId);
      } else {
        setSelectedSessionId(null);
        setSelectedSessionMessages([]);
      }
    }
  };

  const handleClearAllHistory = async () => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to clear your entire Ploti AI chat history?')) return;
    await DataStore.clearAllChatHistory(user.id);
    setChatSessions([]);
    setSelectedSessionId(null);
    setSelectedSessionMessages([]);
  };

  const handleOpenInWidget = (sId?: string) => {
    if (sId) {
      window.dispatchEvent(new CustomEvent('ploti-load-session', { detail: { sessionId: sId } }));
    } else {
      window.dispatchEvent(new Event('ploti-open'));
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      if (user.organizationName || user.businessName) {
        setUpgradeBusinessName(user.organizationName || user.businessName || '');
      }
      if (user.nidNumber) setUpgradeNidNumber(user.nidNumber);
      if (user.nidUrl) setUpgradeNidUrl(user.nidUrl);
      if (user.photoUrl) setUpgradePhotoUrl(user.photoUrl);

      const allProps = DataStore.getProperties();
      setProperties(allProps);

      // 1. Live Relational Saved Properties from Supabase and local store
      const loadSaved = async () => {
        try {
          const supabase = createClient();
          const { data: supaSaved } = await supabase
            .from('saved_properties')
            .select('property_id')
            .eq('user_id', user.id);

          let savedIds = DataStore.getSavedPropertyIds(user.id);
          if (supaSaved && supaSaved.length > 0) {
            const ids = supaSaved.map(s => s.property_id);
            savedIds = Array.from(new Set([...savedIds, ...ids]));
          }
          const savedList = allProps.filter(p => savedIds.includes(p.id));
          // Strict clean state: NO hardcoded mock fallback!
          setSavedProperties(savedList);
        } catch {
          const savedIds = DataStore.getSavedPropertyIds(user.id);
          const savedList = allProps.filter(p => savedIds.includes(p.id));
          setSavedProperties(savedList);
        }
      };
      loadSaved();

      // 2. Live Relational Inquiries from Supabase and local store (strictly belonging to user)
      const loadInquiries = async () => {
        try {
          const supabase = createClient();
          const { data: supaInq } = await supabase
            .from('property_inquiries')
            .select('*')
            .or(`buyer_email.eq.${user.email},buyer_phone.eq.${user.mobile}`);

          const localInqs = DataStore.getInquiries().filter(inq => {
            const isBuyer = (inq.buyerEmail && inq.buyerEmail.toLowerCase() === user.email.toLowerCase()) ||
              (inq.buyerPhone && inq.buyerPhone === user.mobile);
            const isOwner = allProps.some(p => p.id === inq.propertyId && (p.sellerId === user.id || p.sellerPhone === user.mobile));
            return isBuyer || isOwner;
          });

          if (supaInq && supaInq.length > 0) {
            const mapped: Inquiry[] = supaInq.map(r => ({
              id: r.id,
              propertyId: r.property_id,
              buyerName: r.buyer_name,
              buyerPhone: r.buyer_phone,
              buyerEmail: r.buyer_email,
              message: r.message,
              status: r.status || 'new',
              createdAt: r.created_at,
            }));
            const merged = [...mapped, ...localInqs.filter(l => !mapped.some(m => m.id === l.id))];
            setInquiries(merged);
          } else {
            setInquiries(localInqs);
          }
        } catch {
          const localInqs = DataStore.getInquiries().filter(inq => {
            const isBuyer = (inq.buyerEmail && inq.buyerEmail.toLowerCase() === user.email.toLowerCase()) ||
              (inq.buyerPhone && inq.buyerPhone === user.mobile);
            const isOwner = allProps.some(p => p.id === inq.propertyId && (p.sellerId === user.id || p.sellerPhone === user.mobile));
            return isBuyer || isOwner;
          });
          setInquiries(localInqs);
        }
      };
      loadInquiries();

      // Chat history
      loadChatSessions(user.id);
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-900 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  // Filter listings for business user - only real listings belonging to this seller
  const myListings = properties.filter(
    p => p.sellerId === user.id || (p.sellerPhone && p.sellerPhone === user.mobile)
  );
  // Real data only: NO mock properties for new business accounts
  const displayedBusinessListings = myListings;

  const businessStats = [
    {
      label: 'Active Listings',
      value: String(displayedBusinessListings.filter(p => p.approval_status === 'approved').length),
      icon: Building2,
      color: 'text-brand-500 dark:text-brand-400',
      bg: 'bg-brand-500/10 border-brand-500/20'
    },
    {
      label: 'Pending Review',
      value: String(displayedBusinessListings.filter(p => p.approval_status === 'pending').length),
      icon: Clock,
      color: 'text-amber-500 dark:text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      label: 'Total Views',
      value: displayedBusinessListings.reduce((sum, p) => sum + (p.views || 0), 0).toLocaleString(),
      icon: Eye,
      color: 'text-teal-500 dark:text-teal-400',
      bg: 'bg-teal-500/10 border-teal-500/20'
    },
    {
      label: 'Inquiries',
      value: String(inquiries.length),
      icon: Bell,
      color: 'text-purple-500 dark:text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20'
    },
  ];

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleNidFileSelect = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setUpgradeError('Please upload an image file (JPG, PNG, WebP) or PDF for NID.');
      return;
    }
    setUpgradeError('');
    setNidFileName(file.name);
    setNidFileSize(formatSize(file.size));
    const reader = new FileReader();
    reader.onload = () => {
      setUpgradeNidUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoFileSelect = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUpgradeError('Please upload an image file (JPG, PNG, WebP) for the passport photo.');
      return;
    }
    setUpgradeError('');
    setPhotoFileName(file.name);
    setPhotoFileSize(formatSize(file.size));
    const reader = new FileReader();
    reader.onload = () => {
      setUpgradePhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpgradeError('');

    if (!upgradeBusinessName.trim() || !upgradeNidNumber.trim()) {
      setUpgradeError('Please fill in your company name and NID number.');
      return;
    }
    if (upgradeNidNumber.trim().length < 10) {
      setUpgradeError('Bangladeshi NID number must be at least 10 digits.');
      return;
    }
    if (!upgradeNidUrl) {
      setUpgradeError('Please select or upload your National ID (NID) document.');
      return;
    }
    if (!upgradePhotoUrl) {
      setUpgradeError('Please select or upload your official passport-size color photograph.');
      return;
    }

    setUpgradeSubmitting(true);
    if (isPersonal) {
      const res = await upgradeToBusiness({
        businessName: upgradeBusinessName.trim(),
        nidNumber: upgradeNidNumber.trim(),
        nidUrl: upgradeNidUrl,
        photoUrl: upgradePhotoUrl,
      });
      setUpgradeSubmitting(false);
      if (!res.success) {
        setUpgradeError(res.error || 'Failed to submit upgrade application.');
      }
    } else {
      // Business account submitting NID verification
      const updated: UserType = {
        ...user,
        businessName: upgradeBusinessName.trim() || user.businessName,
        organizationName: upgradeBusinessName.trim() || user.organizationName,
        organization_name: upgradeBusinessName.trim() || user.organization_name,
        nidNumber: upgradeNidNumber.trim(),
        nidUrl: upgradeNidUrl,
        photoUrl: upgradePhotoUrl,
        upgradeStatus: 'pending_approval',
        verificationStatus: 'pending',
        isVerified: false,
      };
      DataStore.upsertUser(updated);
      try {
        const supabase = createClient();
        await supabase.from('profiles').update({
          business_name: updated.businessName,
          organization_name: updated.organizationName,
          nid_number: updated.nidNumber,
          nid_url: updated.nidUrl,
          photo_url: updated.photoUrl,
          upgrade_status: 'pending_approval',
          verification_status: 'pending',
          is_verified: false,
        }).eq('id', user.id);
      } catch { }
      setUpgradeSubmitting(false);
    }
  };

  const removeSavedProperty = (propertyId: string) => {
    DataStore.toggleSaveProperty(user.id, propertyId);
    setSavedProperties(prev => prev.filter(p => p.id !== propertyId));
  };

  const renderChatHistoryView = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 p-6 rounded-3xl bg-white dark:bg-dark-800/80 border border-slate-200 dark:border-dark-500/60 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-glow-sm">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Ploti AI Conversation History
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Persistent Memory Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Review your past property inquiries, price guidance, and discussions across devices.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenInWidget()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-glow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Start New Chat
          </button>
          {chatSessions.length > 0 && (
            <button
              onClick={handleClearAllHistory}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold text-xs transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All History
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sessions List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
            <span>Saved Sessions ({chatSessions.length})</span>
            <button
              onClick={() => user && loadChatSessions(user.id)}
              className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline"
            >
              Refresh
            </button>
          </div>

          {loadingChatSessions ? (
            <div className="p-8 bg-white dark:bg-dark-800/80 rounded-2xl border border-slate-200 dark:border-dark-500/60 flex items-center justify-center">
              <Loader className="w-6 h-6 animate-spin text-brand-500" />
            </div>
          ) : chatSessions.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-dark-800/80 rounded-2xl border border-slate-200 dark:border-dark-500/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-dark-700 mx-auto flex items-center justify-center text-slate-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No chat history yet</p>
              <p className="text-[11px] text-slate-400">
                When you chat with Ploti AI, your conversation turns and questions are safely saved here.
              </p>
              <button
                onClick={() => handleOpenInWidget()}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
              >
                Open Ploti AI to Chat →
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {chatSessions.map(s => {
                const isSelected = selectedSessionId === s.sessionId;
                return (
                  <div
                    key={s.sessionId}
                    onClick={() => user && loadSessionMessages(user.id, s.sessionId)}
                    className={cn(
                      'p-4 rounded-2xl border transition-all cursor-pointer relative group text-left shadow-sm',
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500/50 shadow-glow-sm'
                        : 'bg-white dark:bg-dark-800/80 border-slate-200 dark:border-dark-500/60 hover:border-brand-500/30'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 flex-1">
                        {s.title}
                      </h4>
                      <button
                        onClick={e => handleDeleteSession(e, s.sessionId)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-lg opacity-60 group-hover:opacity-100 transition-opacity"
                        title="Delete this session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {s.lastMessage}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-dark-700">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(s.updatedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="font-bold text-brand-600 dark:text-brand-400">
                        {s.messageCount} msgs
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Transcript View */}
        <div className="lg:col-span-2">
          {selectedSessionId ? (
            <div className="bg-white dark:bg-dark-800/80 border border-slate-200 dark:border-dark-500/60 rounded-3xl p-6 shadow-sm flex flex-col h-[600px]">
              {/* Transcript Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-dark-600/60 flex-wrap gap-2 shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bot className="w-4 h-4 text-brand-500" />
                    Conversation Transcript
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Session: <span className="font-mono text-[10px]">{selectedSessionId}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenInWidget(selectedSessionId)}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <span>Continue in Ploti AI</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Transcript Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 my-2">
                {loadingSessionMessages ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader className="w-6 h-6 animate-spin text-brand-500" />
                  </div>
                ) : selectedSessionMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No messages recorded for this session.
                  </div>
                ) : (
                  selectedSessionMessages.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className={cn(
                        'flex flex-col gap-1',
                        m.role === 'user' ? 'items-end' : 'items-start'
                      )}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                        {m.role === 'user' ? (
                          <>
                            <span>You</span>
                            <span>·</span>
                            <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </>
                        ) : (
                          <>
                            <Bot className="w-3 h-3 text-brand-500" />
                            <span className="font-bold text-brand-600 dark:text-brand-400">Ploti AI</span>
                            <span>·</span>
                            <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </>
                        )}
                      </div>
                      <div
                        className={cn(
                          'max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed',
                          m.role === 'user'
                            ? 'bg-brand-600 text-white rounded-tr-sm shadow-sm'
                            : 'bg-slate-100 dark:bg-dark-700/60 border border-slate-200 dark:border-dark-600/40 text-slate-900 dark:text-slate-100 rounded-tl-sm shadow-sm'
                        )}
                      >
                        {m.content.split('\n').map((line, j) => (
                          <React.Fragment key={j}>
                            {line}
                            {j < m.content.split('\n').length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Quick Action */}
              <div className="pt-3 border-t border-slate-200 dark:border-dark-600/60 flex items-center justify-between shrink-0">
                <span className="text-[11px] text-slate-400">
                  Total dialogue turns: <strong>{selectedSessionMessages.length}</strong>
                </span>
                <button
                  onClick={() => handleOpenInWidget(selectedSessionId)}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                >
                  Send a follow-up query →
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-800/80 border border-slate-200 dark:border-dark-500/60 rounded-3xl p-12 text-center h-[600px] flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <Bot className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Select a conversation session
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Click any session from the left list to review past questions and real estate guidance from Ploti AI.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderVerificationSection = () => (
    <div className="max-w-2xl mx-auto bg-white dark:bg-dark-800/80 border border-slate-200 dark:border-dark-500/60 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
      <div>
        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          {isBusiness ? 'Business Verification & NID Submission' : 'Upgrade to Business Account'}
        </h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          {isBusiness
            ? 'To protect buyers and sellers on Plotify, all Business accounts must complete NID and photo verification before publishing property ads.'
            : 'Personal accounts are restricted to browsing and saving properties. To list apartments, houses, plots, and access lead management tools, apply for a Business Account below.'}
        </p>
      </div>

      {(isBusiness || isAdmin) && user.isVerified ? (
        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Account Verified by Admin</h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                Your business credentials and National ID have been verified. You have full property listing privileges.
              </p>
            </div>
          </div>
          <div className="pt-2">
            <Link
              href="/dashboard/add-property"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Post a Property Ad
            </Link>
          </div>
        </div>
      ) : (user.upgradeStatus === 'pending_approval' || user.verificationStatus === 'pending') && (user.nidUrl || upgradeNidUrl) ? (
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 space-y-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-amber-500 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Verification Status: Pending Admin Approval</h4>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Your verification documents have been submitted and are in the review queue. Admins usually review submissions within 24 hours.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-amber-500/20 text-xs">
            <div>
              <span className="text-amber-600 dark:text-amber-400 font-semibold block mb-1">Uploaded NID:</span>
              <div className="h-28 rounded-xl overflow-hidden border border-amber-500/30 bg-amber-900/20">
                <img src={user.nidUrl || upgradeNidUrl} alt="NID Preview" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <span className="text-amber-600 dark:text-amber-400 font-semibold block mb-1">Official Photograph:</span>
              <div className="h-28 rounded-xl overflow-hidden border border-amber-500/30 bg-amber-900/20">
                <img src={user.photoUrl || upgradePhotoUrl} alt="Photo Preview" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {user.nidNumber && (
            <div className="text-xs text-amber-700 dark:text-amber-300">
              Submitted NID: <strong className="font-mono">{user.nidNumber}</strong>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleUpgradeSubmit} className="space-y-5">
          {upgradeError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {upgradeError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Company / Agency / Organization Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={upgradeBusinessName}
              onChange={e => setUpgradeBusinessName(e.target.value)}
              placeholder="e.g., Banani Premier Real Estate Ltd."
              required
              className="w-full bg-slate-50 dark:bg-dark-700/60 border border-slate-200 dark:border-dark-500/60 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-brand-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              National ID (NID) Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={upgradeNidNumber}
              onChange={e => setUpgradeNidNumber(e.target.value)}
              placeholder="e.g., 19852692500000123 (10-17 digits)"
              required
              className="w-full bg-slate-50 dark:bg-dark-700/60 border border-slate-200 dark:border-dark-500/60 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-brand-500 transition-all"
            />
          </div>

          {/* Upload NID Document */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-500" />
                <span>National ID (NID) Document <span className="text-rose-500">*</span></span>
              </label>
              {upgradeNidUrl && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Document Ready
                </span>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={nidInputRef}
              accept="image/*,application/pdf"
              className="hidden"
              onChange={e => {
                if (e.target.files?.[0]) handleNidFileSelect(e.target.files[0]);
              }}
            />

            {upgradeNidUrl ? (
              <div className="p-4 rounded-2xl border-2 border-brand-500/40 bg-brand-500/5 dark:bg-brand-500/10 flex flex-col sm:flex-row items-center gap-4 transition-all">
                <div className="h-20 w-32 rounded-xl overflow-hidden bg-slate-200 dark:bg-dark-700 shrink-0 border border-brand-500/30 shadow-sm relative group">
                  <img src={upgradeNidUrl} alt="NID Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {nidFileName || 'nid_document.jpg'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {nidFileSize ? `${nidFileSize} • Ready for verification` : 'National ID document verified'}
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2.5">
                    <button
                      type="button"
                      onClick={() => nidInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <FileUp className="w-3.5 h-3.5" /> Change Document
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUpgradeNidUrl('');
                        setNidFileName('');
                        setNidFileSize('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-rose-500/10 hover:text-rose-500 text-slate-600 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => nidInputRef.current?.click()}
                onDragOver={e => {
                  e.preventDefault();
                  setIsDraggingNid(true);
                }}
                onDragLeave={() => setIsDraggingNid(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDraggingNid(false);
                  if (e.dataTransfer.files?.[0]) handleNidFileSelect(e.dataTransfer.files[0]);
                }}
                className={`p-6 rounded-2xl border-2 border-dashed text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${isDraggingNid
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-slate-300 dark:border-dark-500/80 hover:border-brand-500 bg-slate-50/60 dark:bg-dark-700/40 hover:bg-brand-500/5'
                  }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <Upload className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Click to select NID photo or drag & drop here
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Supports JPG, PNG, WebP or PDF (up to 10MB)
                  </span>
                </div>
                <span className="mt-1 px-3 py-1 rounded-lg bg-white dark:bg-dark-600 border border-slate-200 dark:border-white/10 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  Browse from Computer
                </span>
              </div>
            )}
          </div>

          {/* Upload Official Photograph */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-brand-500" />
                <span>Official Color Photograph <span className="text-rose-500">*</span></span>
              </label>
              {upgradePhotoUrl && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Photo Ready
                </span>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={photoInputRef}
              accept="image/*"
              className="hidden"
              onChange={e => {
                if (e.target.files?.[0]) handlePhotoFileSelect(e.target.files[0]);
              }}
            />

            {upgradePhotoUrl ? (
              <div className="p-4 rounded-2xl border-2 border-brand-500/40 bg-brand-500/5 dark:bg-brand-500/10 flex flex-col sm:flex-row items-center gap-4 transition-all">
                <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-brand-500 shadow-md relative">
                  <img src={upgradePhotoUrl} alt="Photo Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {photoFileName || 'passport_photo.jpg'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {photoFileSize ? `${photoFileSize} • Clear frontal view` : 'Passport photo attached'}
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2.5">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" /> Change Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUpgradePhotoUrl('');
                        setPhotoFileName('');
                        setPhotoFileSize('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-rose-500/10 hover:text-rose-500 text-slate-600 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => photoInputRef.current?.click()}
                onDragOver={e => {
                  e.preventDefault();
                  setIsDraggingPhoto(true);
                }}
                onDragLeave={() => setIsDraggingPhoto(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDraggingPhoto(false);
                  if (e.dataTransfer.files?.[0]) handlePhotoFileSelect(e.dataTransfer.files[0]);
                }}
                className={`p-6 rounded-2xl border-2 border-dashed text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${isDraggingPhoto
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-slate-300 dark:border-dark-500/80 hover:border-brand-500 bg-slate-50/60 dark:bg-dark-700/40 hover:bg-brand-500/5'
                  }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Click to select passport-size photo or drag & drop here
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Recent color portrait with neutral background (JPG, PNG)
                  </span>
                </div>
                <span className="mt-1 px-3 py-1 rounded-lg bg-white dark:bg-dark-600 border border-slate-200 dark:border-white/10 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  Browse from Computer
                </span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={upgradeSubmitting}
            className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-glow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {upgradeSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : 'Submit for Admin Approval →'}
          </button>
        </form>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900 text-slate-900 dark:text-slate-100 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Admin notice banner if admin is viewing dashboard */}
        {isAdmin && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-transparent border border-rose-500/30 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-rose-500" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">You have Super Admin Privileges</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Manage property approvals, users, and review verification submissions.</p>
              </div>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm transition-all"
            >
              Open Admin Control Panel →
            </Link>
          </div>
        )}

        {/* Dashboard Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <LayoutDashboard className="w-3.5 h-3.5 text-brand-500" />
              <span>Plotify Dashboard</span>
              <span>·</span>
              <span className="capitalize font-semibold text-brand-600 dark:text-brand-400">
                {user.role} Account {user.isVerified ? '(Verified)' : '(Unverified)'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Welcome back, <span className="text-gradient">{user.fullName}</span>!
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isPersonal
                ? 'View your saved properties, review contact inquiries, and manage your account.'
                : 'Manage your listings, review client inquiries, and monitor performance.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const next = activeTab === 'ai-history' ? 'overview' : 'ai-history';
                setActiveTab(next);
                if (user && next === 'ai-history') loadChatSessions(user.id);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-sm dark:shadow-none",
                activeTab === 'ai-history'
                  ? "bg-brand-600 text-white border-brand-500 shadow-glow-sm"
                  : "border-slate-200 dark:border-dark-500/60 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-brand-500/40"
              )}
            >
              <Bot className="w-4 h-4 text-brand-500" />
              <span>Ploti AI History</span>
              {chatSessions.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-brand-500/20 text-brand-600 dark:text-brand-300 font-bold">
                  {chatSessions.length}
                </span>
              )}
            </button>

            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-500/60 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-brand-500/40 transition-all shadow-sm dark:shadow-none"
            >
              <Settings className="w-4 h-4" />
              Profile Settings
            </Link>

            {/* ONLY Business Accounts can see "Add Property", with verification guard (Requirement 2) */}
            {isBusiness && (
              user.isVerified || isAdmin ? (
                <Link
                  href="/dashboard/add-property"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-glow-sm transition-all hover:shadow-glow"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Property
                </Link>
              ) : (
                <button
                  onClick={() => setActiveTab('upgrade')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-dark-700 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-xs transition-all border border-amber-500/40"
                  title="Complete verification to post ads"
                >
                  <Lock className="w-4 h-4 text-amber-500" />
                  <span>Add Property (Locked)</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* ========================================================
            BUSINESS DASHBOARD VIEW
            Requirement 2 & 3: Clean state, verified/unverified guards
           ======================================================== */}
        {isBusiness && (
          <div className="space-y-6 animate-fade-in">
            {/* Unverified business banner (Requirement 2) */}
            {!user.isVerified && !isAdmin && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-100">
                      Account Verification Required for Ad Posting
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                      {user.upgradeStatus === 'pending_approval' || user.verificationStatus === 'pending'
                        ? 'Your NID and photo submission is currently under review by our admin team. Once approved, you will be authorized to post properties.'
                        : 'Your Business Account is currently unverified. Please submit your NID and photo to obtain verified status and unlock property ad posting.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('upgrade')}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shrink-0 transition-all shadow-sm"
                >
                  {user.nidUrl ? 'View Verification Status' : 'Complete Verification →'}
                </button>
              </div>
            )}

            {/* Navigation Tabs for Business Account */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-dark-500/60 pb-3 flex-wrap">
              {[
                { id: 'overview', label: 'Business Overview', icon: LayoutDashboard },
                { id: 'inquiries', label: `Inquiries (${inquiries.length})`, icon: MessageSquare },
                { id: 'ai-history', label: `Ploti AI History ${chatSessions.length > 0 ? `(${chatSessions.length})` : ''}`, icon: Sparkles },
                { id: 'upgrade', label: user.isVerified ? 'Verification (Verified)' : 'NID Verification', icon: ShieldCheck },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (tab.id === 'ai-history' && user) loadChatSessions(user.id);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id
                      ? 'bg-brand-600 text-white shadow-glow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800'
                    }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Business Verification Tab */}
            {activeTab === 'upgrade' && renderVerificationSection()}

            {/* Business AI History Tab */}
            {activeTab === 'ai-history' && renderChatHistoryView()}

            {/* Business Inquiries Tab */}
            {activeTab === 'inquiries' && (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-brand-500" />
                  Client Inquiries
                </h2>
                {inquiries.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-dark-800/80 rounded-3xl border border-slate-200 dark:border-dark-500/60 text-slate-500 text-xs space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">No inquiries found</p>
                    <p className="text-[11px] text-slate-400">When interested buyers send inquiries on your listings, they will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inquiries.map(inq => (
                      <div
                        key={inq.id}
                        className="bg-white dark:bg-dark-800/80 border border-slate-200 dark:border-dark-500/60 rounded-2xl p-5 shadow-sm space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">Inquiry from: {inq.buyerName}</span>
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 capitalize">
                            {inq.status}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">"{inq.message}"</p>
                        <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-dark-600 flex justify-between flex-wrap gap-2">
                          <span>Phone: <strong className="text-brand-600 dark:text-brand-400">{inq.buyerPhone}</strong> {inq.buyerEmail ? `(${inq.buyerEmail})` : ''}</span>
                          <span>Received: {new Date(inq.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Business Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Business Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {businessStats.map(s => (
                    <div key={s.label} className="bg-white dark:bg-dark-800/80 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm dark:shadow-none">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bg}`}>
                          <s.icon className={`w-5 h-5 ${s.color}`} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</span>
                      </div>
                      <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Business Main Sections: My Listings + Sidebar */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* My Listings List */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-brand-500" />
                        My Listings Management
                      </h2>
                      {user.isVerified || isAdmin ? (
                        <Link
                          href="/dashboard/add-property"
                          className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                        >
                          <PlusCircle className="w-3.5 h-3.5" /> Post New
                        </Link>
                      ) : (
                        <button
                          onClick={() => setActiveTab('upgrade')}
                          className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <Lock className="w-3 h-3" /> Verification Required
                        </button>
                      )}
                    </div>

                    {displayedBusinessListings.length === 0 ? (
                      <div className="p-10 text-center bg-white dark:bg-dark-800/80 rounded-2xl border border-slate-200 dark:border-dark-500/60 text-xs text-slate-500 space-y-3">
                        <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="font-bold text-slate-700 dark:text-slate-300">No properties listed yet</p>
                        <p className="text-[11px] text-slate-400">
                          {user.isVerified || isAdmin
                            ? 'Create your first property advertisement to connect with active buyers.'
                            : 'Complete your NID verification to begin listing properties.'}
                        </p>
                        {user.isVerified || isAdmin ? (
                          <Link
                            href="/dashboard/add-property"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-all shadow-sm"
                          >
                            <PlusCircle className="w-3.5 h-3.5" /> Post Property Now
                          </Link>
                        ) : (
                          <button
                            onClick={() => setActiveTab('upgrade')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-sm"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> Verify Business Account
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {displayedBusinessListings.map(p => (
                          <div
                            key={p.id}
                            className="bg-white dark:bg-dark-800/80 border border-slate-200 dark:border-dark-500/60 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 shadow-sm dark:shadow-none transition-all card-hover"
                          >
                            <div className="w-full sm:w-28 h-24 rounded-xl overflow-hidden bg-slate-200 dark:bg-dark-700 shrink-0 relative">
                              <img src={p.featuredImage} alt={p.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{p.title}</h3>
                                <span
                                  className={`shrink-0 text-[10px] font-black px-2.5 py-0.5 rounded-full border ${p.approval_status === 'approved'
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                      : p.approval_status === 'pending'
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                    }`}
                                >
                                  {p.approval_status === 'approved' ? '✓ Approved' : p.approval_status === 'pending' ? '⏳ Pending Review' : '✕ Rejected'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                                <MapPin className="w-3 h-3 text-brand-500 shrink-0" />
                                <span className="truncate">{p.area}, {p.district}</span>
                              </div>

                              <div className="flex items-center gap-4 mt-2 text-xs">
                                <span className="font-bold text-slate-900 dark:text-white">{formatBDT(p.price, p.priceUnit === 'bdt_per_month')}</span>
                                <span className="text-slate-400 flex items-center gap-1">
                                  <Eye className="w-3.5 h-3.5" /> {p.views?.toLocaleString()} views
                                </span>
                              </div>
                            </div>

                            <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0">
                              <Link
                                href={`/properties/${p.id}`}
                                className="w-full text-center px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-700 dark:hover:bg-dark-600 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all"
                              >
                                View
                              </Link>
                              {user.isVerified || isAdmin ? (
                                <Link
                                  href={`/dashboard/add-property`}
                                  className="w-full text-center px-3 py-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-xs font-semibold text-brand-600 dark:text-brand-300 border border-brand-500/20 transition-all"
                                >
                                  Duplicate
                                </Link>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Account card */}
                    <div className="bg-white dark:bg-dark-800/80 border border-slate-200 dark:border-dark-500/60 rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-brand-600 text-white font-black text-xl flex items-center justify-center">
                          {user.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                            {user.fullName}
                            {user.isVerified && <CheckCircle2 className="w-4 h-4 text-brand-500" />}
                          </div>
                          <div className="text-xs text-brand-600 dark:text-brand-400 font-semibold">
                            {user.organizationName || user.businessName || 'Business Organization'}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs space-y-2 border-t border-slate-200 dark:border-dark-500/40 pt-3">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Organization:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {user.organizationName || user.businessName || 'Not specified'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Verification:</span>
                          <span className={cn(
                            "font-bold capitalize",
                            user.isVerified ? "text-emerald-500" : "text-amber-500"
                          )}>
                            {user.isVerified ? "Verified" : (user.verificationStatus || "Pending")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Email:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{user.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Phone:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{user.mobile}</span>
                        </div>
                      </div>
                    </div>

                    {/* Recent Inquiries Received */}
                    <div className="bg-white dark:bg-dark-800/80 border border-slate-200 dark:border-dark-500/60 rounded-2xl p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                          <Bell className="w-3.5 h-3.5 text-brand-500" /> Recent Buyer Inquiries
                        </h3>
                        <button
                          onClick={() => setActiveTab('inquiries')}
                          className="text-[11px] text-brand-600 dark:text-brand-400 font-bold hover:underline"
                        >
                          View All
                        </button>
                      </div>

                      {inquiries.length === 0 ? (
                        <p className="text-[11px] text-slate-400 py-3 text-center">No inquiries received yet.</p>
                      ) : (
                        <div className="space-y-2.5">
                          {inquiries.slice(0, 3).map(inq => (
                            <div key={inq.id} className="p-3 rounded-xl bg-slate-50 dark:bg-dark-700/60 border border-slate-200 dark:border-dark-500/40 text-xs space-y-1">
                              <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                                <span>{inq.buyerName}</span>
                                <span className="text-[10px] text-brand-500 font-semibold">{inq.buyerPhone}</span>
                              </div>
                              <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-2">"{inq.message}"</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            PERSONAL ACCOUNT DASHBOARD VIEW
            Requirement 2 & 3: Users can ONLY see saved properties, inquiries,
            and profile settings. Hide ALL "Add Property" or "My Listings".
            Include "Upgrade to Business Account" section with real file uploads.
           ======================================================== */}
        {isPersonal && (
          <div className="space-y-8 animate-fade-in">
            {/* Status notice if pending approval */}
            {user.upgradeStatus === 'pending_approval' && (
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-2.5 font-bold text-sm">
                  <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                  Your Business Upgrade is Under Review by Admins
                </div>
                <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                  We have received your National ID and photo submission. Our admin team will verify your credentials within 24 hours. Once approved, your account will be upgraded to <strong>Business Account</strong> and you will be able to post property ads and access property management analytics.
                </p>
              </div>
            )}

            {/* Navigation Tabs for Personal Account */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-dark-500/60 pb-3 flex-wrap">
              {[
                { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
                { id: 'saved', label: `Saved Properties (${savedProperties.length})`, icon: Heart },
                { id: 'inquiries', label: `My Inquiries (${inquiries.length})`, icon: MessageSquare },
                { id: 'ai-history', label: `Ploti AI History ${chatSessions.length > 0 ? `(${chatSessions.length})` : ''}`, icon: Sparkles },
                { id: 'upgrade', label: 'Upgrade to Business', icon: Briefcase },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (tab.id === 'ai-history' && user) loadChatSessions(user.id);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id
                      ? 'bg-brand-600 text-white shadow-glow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800'
                    }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: Ploti AI History (Requirement 3) */}
            {activeTab === 'ai-history' && renderChatHistoryView()}

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Saved Properties Highlights */}
                  <div className="bg-white dark:bg-dark-800/80 border border-slate-200 dark:border-dark-500/60 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                        Saved Properties
                      </h2>
                      <button
                        onClick={() => setActiveTab('saved')}
                        className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        View All ({savedProperties.length})
                      </button>
                    </div>

                    {savedProperties.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500">
                        No saved properties yet. Browse properties and tap the heart icon to save listings.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {savedProperties.slice(0, 2).map(p => (
                          <div
                            key={p.id}
                            className="p-3 rounded-2xl border border-slate-200 dark:border-dark-500/60 bg-slate-50 dark:bg-dark-700/40 space-y-2 card-hover"
                          >
                            <div className="h-32 rounded-xl overflow-hidden relative">
                              <img src={p.featuredImage} alt={p.title} className="w-full h-full object-cover" />
                              <button
                                onClick={() => removeSavedProperty(p.id)}
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-rose-400 hover:text-white"
                                title="Remove from saved"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{p.title}</h4>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-black text-brand-600 dark:text-brand-400">{formatBDT(p.price)}</span>
                              <Link
                                href={`/properties/${p.id}`}
                                className="text-[11px] font-bold text-slate-500 hover:text-brand-500"
                              >
                                Details →
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* My Inquiries Highlights (Strict Live Empty State - Requirement 3) */}
                  <div className="bg-white dark:bg-dark-800/80 border border-slate-200 dark:border-dark-500/60 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-teal-500" />
                        My Contact Inquiries
                      </h2>
                      <button
                        onClick={() => setActiveTab('inquiries')}
                        className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        View All
                      </button>
                    </div>

                    {inquiries.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500">
                        No inquiries found. Contact property owners from any listing page to send inquiries.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {inquiries.slice(0, 2).map(inq => (
                          <div key={inq.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-dark-500/40 bg-slate-50 dark:bg-dark-700/40 text-xs flex justify-between items-center gap-3">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">Inquiry to property owner</div>
                              <div className="text-[11px] text-slate-500 line-clamp-1">"{inq.message}"</div>
                            </div>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                              Sent
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Upgrade Callout */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-brand-600 to-brand-800 text-white rounded-3xl p-6 shadow-lg space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-black">Want to list properties?</h3>
                      <p className="text-xs text-white/80 mt-1 leading-relaxed">
                        Upgrade your account to a <strong>Business Account</strong>. Post apartments, commercial plots, and reach 50,000+ verified buyers across Bangladesh.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('upgrade')}
                      className="w-full py-2.5 rounded-xl bg-white text-brand-800 font-bold text-xs hover:bg-slate-100 transition-all shadow-sm"
                    >
                      {user.upgradeStatus === 'pending_approval' ? 'View Upgrade Status' : 'Upgrade to Business →'}
                    </button>
                  </div>

                  {/* Personal Account Details */}
                  <div className="bg-white dark:bg-dark-800/80 border border-slate-200 dark:border-dark-500/60 rounded-3xl p-5 text-xs space-y-3 shadow-sm">
                    <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      Account Credentials
                    </h4>
                    <div className="space-y-2 text-slate-500">
                      <div className="flex justify-between">
                        <span>Name:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{user.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Email:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Phone:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{user.mobile}</span>
                      </div>
                    </div>
                    <Link
                      href="/dashboard/profile"
                      className="block text-center pt-2 text-brand-600 dark:text-brand-400 font-bold hover:underline"
                    >
                      Edit Profile Details
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Saved Properties */}
            {activeTab === 'saved' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Saved Properties</h2>
                  <Link href="/properties" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">
                    Browse More Properties →
                  </Link>
                </div>

                {savedProperties.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-dark-800/60 rounded-3xl border border-slate-200 dark:border-dark-500/60 text-slate-500 text-xs">
                    You have not saved any properties yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {savedProperties.map(p => (
                      <div
                        key={p.id}
                        className="bg-white dark:bg-dark-800/80 border border-slate-200 dark:border-dark-500/60 rounded-2xl overflow-hidden shadow-sm flex flex-col card-hover"
                      >
                        <div className="h-44 relative overflow-hidden bg-slate-200 dark:bg-dark-700">
                          <img src={p.featuredImage} alt={p.title} className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeSavedProperty(p.id)}
                            className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 text-rose-400 hover:text-white"
                            title="Remove from saved"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                          <div>
                            <div className="text-lg font-black text-slate-900 dark:text-white">{formatBDT(p.price)}</div>
                            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1 mt-1">{p.title}</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">{p.area}, {p.district}</p>
                          </div>
                          <Link
                            href={`/properties/${p.id}`}
                            className="w-full text-center py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-all shadow-glow-sm"
                          >
                            View Full Listing
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: My Inquiries (Requirement 3: Clean State) */}
            {activeTab === 'inquiries' && (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">My Property Inquiries</h2>
                {inquiries.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-dark-800/60 rounded-3xl border border-slate-200 dark:border-dark-500/60 text-slate-500 text-xs space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">No inquiries found</p>
                    <p className="text-[11px] text-slate-400">When you contact property owners, your sent inquiries will be shown here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inquiries.map(inq => (
                      <div
                        key={inq.id}
                        className="bg-white dark:bg-dark-800/80 border border-slate-200 dark:border-dark-500/60 rounded-2xl p-5 shadow-sm space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">Inquiry ID: {inq.id}</span>
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 capitalize">
                            {inq.status}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">"{inq.message}"</p>
                        <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-dark-600 flex justify-between">
                          <span>Contact: {inq.buyerPhone} ({inq.buyerEmail || 'No email'})</span>
                          <span>Date: {new Date(inq.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Upgrade to Business Account (Requirements 2 & 4: No Demo Sample buttons!) */}
            {activeTab === 'upgrade' && renderVerificationSection()}
          </div>
        )}

      </div>
    </div>
  );
}
