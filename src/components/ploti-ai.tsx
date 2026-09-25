'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  X, Send, Sparkles, Minimize2, History, PlusCircle,
  Trash2, ArrowLeft, Clock, MessageSquare, ChevronRight,
  ShieldCheck, Loader
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { DataStore } from '@/lib/data/store';
import { ChatSessionSummary } from '@/lib/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function PlotiAI() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySessions, setHistorySessions] = useState<ChatSessionSummary[]>([]);
  const [sessionId, setSessionId] = useState<string>(() => `session_${Date.now()}`);
  const bottomRef = useRef<HTMLDivElement>(null);

  const initialMsgText = lang === 'BN'
    ? `Sir (স্যার), আসসালামু আলাইকুম! আমি **প্লটি এআই (Ploti AI)**, আপনার প্লটিফাই রিয়েল এস্টেট সহকারী।\n\nআমি আপনাকে সাহায্য করতে পারি:\n• ঢাকা, চট্টগ্রাম, রাজশাহীসহ সারা দেশে প্লট, ফ্ল্যাট ও জমি খুঁজতে\n• প্লটিফাইয়ে সম্পত্তি তালিকাভুক্ত ও বিজ্ঞাপন পোস্ট করতে (plotify.store/properties)\n• সাইন আপে সমস্যা হলে সরাসরি চ্যাটেই আপনার অ্যাকাউন্ট তৈরি করতে\n\nSir, আজ আপনাকে কীভাবে সাহায্য করতে পারি?`
    : `Sir, hello! I am **Ploti AI**, your friendly and helpful real estate assistant for **Plotify**.\n\nI can help you:\n• Find plots, flats, and land in Dhaka, Rajshahi, Chittagong, and across Bangladesh\n• Guide you on listing your properties (plotify.store/properties)\n• Create a Plotify account for you right here if you face signup issues\n\nSir, how may I assist you today?`;

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: initialMsgText },
  ]);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].role === 'assistant') {
        return [{ role: 'assistant', content: initialMsgText }];
      }
      return prev;
    });
  }, [lang, initialMsgText]);

  const QUICK_REPLIES = lang === 'BN' ? [
    'গুলশানে ফ্ল্যাট খুঁজুন',
    'সম্পত্তি বিজ্ঞাপন কীভাবে দেব?',
    'প্লটিফাই অ্যাকাউন্ট তৈরি করুন',
    'পূর্বাচলে প্লট সন্ধান করুন',
  ] : [
    'Find flats in Gulshan',
    'How to list my property?',
    'Create an account for me',
    'Search plots in Purbachal',
  ];

  // Global open and session load event listeners
  useEffect(() => {
    const handleOpen = () => setOpen(true);
    const handleLoadSession = async (e: any) => {
      const targetSessionId = e.detail?.sessionId;
      if (targetSessionId && user) {
        setOpen(true);
        setMinimized(false);
        setShowHistory(false);
        setLoading(true);
        const msgs = await DataStore.getSessionMessages(user.id, targetSessionId);
        if (msgs && msgs.length > 0) {
          setSessionId(targetSessionId);
          setMessages(msgs.map(m => ({ role: m.role, content: m.content })));
        }
        setLoading(false);
      }
    };

    window.addEventListener('ploti-open', handleOpen);
    window.addEventListener('panda-open', handleOpen);
    window.addEventListener('ploti-load-session', handleLoadSession as EventListener);

    return () => {
      window.removeEventListener('ploti-open', handleOpen);
      window.removeEventListener('panda-open', handleOpen);
      window.removeEventListener('ploti-load-session', handleLoadSession as EventListener);
    };
  }, [user]);

  useEffect(() => {
    if (!showHistory) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showHistory]);

  // Load user sessions when history drawer is opened
  const loadSessions = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const sessions = await DataStore.getChatSessions(user.id);
      setHistorySessions(sessions);
    } catch {
      setHistorySessions([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleHistory = () => {
    if (!showHistory) {
      loadSessions();
    }
    setShowHistory(!showHistory);
  };

  // Start fresh chat session
  const handleNewChat = () => {
    const newSid = `session_${Date.now()}`;
    setSessionId(newSid);
    setMessages([{ role: 'assistant', content: initialMsgText }]);
    setShowHistory(false);
  };

  // Switch to a previous conversation session
  const handleSelectSession = async (sid: string) => {
    if (!user) return;
    setLoading(true);
    setShowHistory(false);
    try {
      const msgs = await DataStore.getSessionMessages(user.id, sid);
      if (msgs && msgs.length > 0) {
        setSessionId(sid);
        setMessages(msgs.map(m => ({ role: m.role, content: m.content })));
      }
    } catch (err) {
      console.warn('Failed to load session:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete a specific session
  const handleDeleteSession = async (e: React.MouseEvent, sid: string) => {
    e.stopPropagation();
    if (!user) return;
    await DataStore.deleteChatSession(user.id, sid);
    setHistorySessions(prev => prev.filter(s => s.sessionId !== sid));
    if (sessionId === sid) {
      handleNewChat();
    }
  };

  // Clear all history
  const handleClearAll = async () => {
    if (!user) return;
    const confirmText = lang === 'BN'
      ? 'আপনি কি নিশ্চিত যে আপনি সমস্ত চ্যাট হিস্ট্রি মুছে ফেলতে চান?'
      : 'Are you sure you want to clear your entire chat history?';
    if (!window.confirm(confirmText)) return;

    await DataStore.clearAllChatHistory(user.id);
    setHistorySessions([]);
    handleNewChat();
  };

  const sendMessage = async (text?: string) => {
    const userText = text ?? input.trim();
    if (!userText) return;

    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setLoading(true);

    const userName = user ? (user.fullName || user.email) : 'Guest User';
    const userId = user?.id;
    const clientStartTime = Date.now();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          userId,
          sessionId,
          user: userName,
          stream: true,
        }),
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No readable response stream');

      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';
      let provider = 'Google Gemini';
      let latencyMs = 0;
      let serverLog: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evt of events) {
          const trimmed = evt.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.chunk) {
                accumulated += data.chunk;
                setLoading(false); // First token arrived: instantly hide loading indicator
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last && last.role === 'assistant') {
                    const copy = [...prev];
                    copy[copy.length - 1] = {
                      role: 'assistant',
                      content: accumulated,
                    };
                    return copy;
                  } else {
                    return [...prev, { role: 'assistant', content: accumulated }];
                  }
                });
              }
              if (data.done) {
                provider = data.provider || provider;
                latencyMs = data.responseTimeMs || (Date.now() - clientStartTime);
                if (data.log) {
                  serverLog = data.log;
                }
                if (data.accountCreated?.user) {
                  DataStore.upsertUser(data.accountCreated.user);
                }
                if (data.fullReply && data.fullReply.length > accumulated.length) {
                  accumulated = data.fullReply;
                  setMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (last && last.role === 'assistant') {
                      const copy = [...prev];
                      copy[copy.length - 1] = { role: 'assistant', content: accumulated };
                      return copy;
                    }
                    return prev;
                  });
                }
              }
            } catch {
              // ignore partial chunk parsing
            }
          }
        }
      }

      // Flush any trailing buffer if present
      if (buffer.trim()) {
        const remainingEvents = buffer.split('\n\n');
        for (const evt of remainingEvents) {
          const trimmed = evt.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.chunk) {
                accumulated += data.chunk;
              }
              if (data.fullReply && data.fullReply.length > accumulated.length) {
                accumulated = data.fullReply;
              }
              if (data.done && data.log) {
                serverLog = data.log;
              }
              if (data.accountCreated?.user) {
                DataStore.upsertUser(data.accountCreated.user);
              }
            } catch { }
          }
        }
        if (accumulated.trim()) {
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant') {
              const copy = [...prev];
              copy[copy.length - 1] = { role: 'assistant', content: accumulated };
              return copy;
            }
            return prev;
          });
        }
      }

      setLoading(false);

      if (!accumulated.trim()) {
        accumulated = lang === 'BN'
          ? 'Sir (স্যার), আমি সাহায্য করতে প্রস্তুত! অনুগ্রহ করে পুনরায় প্রশ্ন করুন।'
          : "Sir, I'm ready to help! Please ask your question again, Sir.";
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant') {
            const copy = [...prev];
            copy[copy.length - 1] = { role: 'assistant', content: accumulated };
            return copy;
          }
          return [...prev, { role: 'assistant', content: accumulated }];
        });
      }

      const finalLatency = latencyMs || (Date.now() - clientStartTime);
      if (serverLog) {
        DataStore.saveServerAiLog(serverLog);
      } else {
        DataStore.recordAiLog(userName, userText, finalLatency, accumulated, provider);
      }
    } catch {
      setLoading(false);
      const clientElapsed = Date.now() - clientStartTime;
      const errorReply = lang === 'BN'
        ? 'Sir, এআই সার্ভারে সংযোগে সমস্যা হচ্ছে। অনুগ্রহ করে আপনার GEMINI_API_KEY অথবা OPENAI_API_KEY কনফিগারেশন নিশ্চিত করুন।'
        : 'Sir, unable to reach AI server. Please verify your GEMINI_API_KEY or OPENAI_API_KEY in `.env.local`.';

      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant') {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: errorReply };
          return copy;
        }
        return [...prev, { role: 'assistant', content: errorReply }];
      });

      DataStore.recordAiLog(userName, userText, clientElapsed, errorReply, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed bottom-24 right-4 sm:right-20 z-50 w-80 sm:w-96 flex flex-col backdrop-blur-2xl bg-white/95 dark:bg-dark-900/90 border border-slate-200 dark:border-white/20 rounded-2xl shadow-xl dark:shadow-glass-modal overflow-hidden transition-all',
        minimized ? 'h-14' : 'h-[500px]',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-gradient-to-r dark:from-brand-900/60 dark:to-dark-800/80 shrink-0">
        <div className="relative w-8 h-8 rounded-full bg-white dark:bg-dark-800 border border-brand-500/30 flex items-center justify-center p-0.5 shadow-sm shrink-0">
          <img src="/ploti-avatar.png" alt="Ploti AI" className="w-full h-full object-contain" />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-dark-800 animate-pulse" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
            Ploti AI <Sparkles className="w-3 h-3 text-brand-500 dark:text-brand-400 shrink-0" />
            {user && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                Synced
              </span>
            )}
          </div>
          <div className="text-[10px] text-brand-600 dark:text-brand-300 truncate">
            {lang === 'BN' ? 'প্লটিফাই রিয়েল এস্টেট সহকারী' : 'Plotify Real Estate Assistant'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="p-1.5 text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
            title={lang === 'BN' ? 'নতুন চ্যাট' : 'New Chat'}
          >
            <PlusCircle className="w-4 h-4" />
          </button>

          {/* History Sidebar Button */}
          <button
            onClick={toggleHistory}
            className={cn(
              'p-1.5 rounded-lg transition-all',
              showHistory
                ? 'bg-brand-600 text-white shadow-glow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10'
            )}
            title={lang === 'BN' ? 'চ্যাট হিস্ট্রি' : 'Chat History'}
          >
            <History className="w-4 h-4" />
          </button>

          {/* Minimize Button */}
          <button
            onClick={() => setMinimized(!minimized)}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4" />
          </button>

          {/* Close Button */}
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* ========================================================
              VIEW 1: CHAT HISTORY SIDEBAR / PANEL (Requirement 3)
             ======================================================== */}
          {showHistory ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-dark-900/95 animate-fade-in">
              {/* History Top Bar */}
              <div className="px-3.5 py-2.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-dark-800/80 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowHistory(false)}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                    title="Back to conversation"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {lang === 'BN' ? 'সংরক্ষিত চ্যাট হিস্ট্রি' : 'Chat History'}
                  </span>
                </div>
                {user && historySessions.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-[10px] font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 hover:underline"
                  >
                    <Trash2 className="w-3 h-3" />
                    {lang === 'BN' ? 'মুছে ফেলুন' : 'Clear All'}
                  </button>
                )}
              </div>

              {/* Guest User History Notice (Requirement 3) */}
              {!user ? (
                <div className="flex-1 p-5 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {lang === 'BN' ? 'গেস্ট মোড সক্রিয়' : 'Guest Mode Active'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {lang === 'BN'
                        ? 'আপনার চ্যাট হিস্ট্রি ক্লাউডে স্থায়ীভাবে সংরক্ষণ করতে এবং সকল ডিভাইসে দেখতে লগইন করুন।'
                        : 'Sign in to your Plotify account to persistently save, sync, and access your chat history across devices.'}
                    </p>
                  </div>
                  <Link
                    href="/auth/login"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow-sm transition-all"
                  >
                    {lang === 'BN' ? 'লগইন করুন' : 'Sign In to Save History'}
                  </Link>
                </div>
              ) : loadingHistory ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader className="w-6 h-6 animate-spin text-brand-500" />
                </div>
              ) : historySessions.length === 0 ? (
                <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-2 text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-dark-800 border border-brand-500/20 p-2 shadow-xs mb-1 flex items-center justify-center">
                    <img src="/ploti-avatar.png" alt="Ploti AI" className="w-full h-full object-contain" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {lang === 'BN' ? 'কোনো সংরক্ষিত চ্যাট নেই' : 'No saved conversations'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'BN'
                      ? 'প্লটি এআই-এর সাথে কথা বলুন, আপনার প্রতিটি সেশন স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে।'
                      : 'Ask Ploti AI anything, and your conversation sessions will appear here.'}
                  </p>
                  <button
                    onClick={handleNewChat}
                    className="mt-2 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    + {lang === 'BN' ? 'নতুন চ্যাট শুরু করুন' : 'Start a New Chat'}
                  </button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {historySessions.map(s => {
                    const isActive = s.sessionId === sessionId;
                    return (
                      <div
                        key={s.sessionId}
                        onClick={() => handleSelectSession(s.sessionId)}
                        className={cn(
                          'p-3 rounded-xl border text-left cursor-pointer transition-all group relative',
                          isActive
                            ? 'bg-brand-50/80 dark:bg-brand-950/40 border-brand-500/40 shadow-sm'
                            : 'bg-white dark:bg-dark-800/80 border-slate-200 dark:border-white/10 hover:border-brand-500/30'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 flex-1">
                            {s.title}
                          </h5>
                          <button
                            onClick={e => handleDeleteSession(e, s.sessionId)}
                            className="text-slate-400 hover:text-rose-500 opacity-60 group-hover:opacity-100 transition-opacity p-0.5"
                            title="Delete session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                          {s.lastMessage}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(s.updatedAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="font-semibold text-brand-600 dark:text-brand-400">
                            {s.messageCount} msgs
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* History Footer: New Chat Quick Action */}
              <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-dark-800/80 shrink-0">
                <button
                  onClick={handleNewChat}
                  className="w-full py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  {lang === 'BN' ? 'নতুন চ্যাট সেশন শুরু করুন' : 'Start New Conversation'}
                </button>
              </div>
            </div>
          ) : (
            /* ========================================================
                VIEW 2: ACTIVE CONVERSATION
               ======================================================== */
            <>
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-sm">
                {/* Guest subtle notification banner */}
                {!user && (
                  <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 flex items-center justify-between">
                    <span>
                      {lang === 'BN' ? 'গেস্ট চ্যাট (হিস্ট্রি সংরক্ষিত হবে না)' : 'Guest chat (history unsaved)'}
                    </span>
                    <Link
                      href="/auth/login"
                      onClick={() => setOpen(false)}
                      className="font-bold underline text-brand-600 dark:text-brand-300 ml-2 shrink-0"
                    >
                      {lang === 'BN' ? 'লগইন' : 'Sign In'}
                    </Link>
                  </div>
                )}

                {messages.map((m, i) => {
                  if (m.role === 'assistant' && !m.content.trim()) return null;
                  return (
                    <div key={i} className={cn('flex gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                      {m.role === 'assistant' && (
                        <div className="w-6 h-6 rounded-md bg-white dark:bg-dark-800 border border-brand-500/25 flex items-center justify-center shrink-0 mt-0.5 p-0.5 shadow-xs overflow-hidden">
                          <img src="/ploti-avatar.png" alt="Ploti AI" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[84%] px-3 py-2 rounded-2xl text-xs leading-relaxed',
                          m.role === 'user'
                            ? 'bg-brand-600 text-white rounded-br-sm shadow-sm'
                            : 'backdrop-blur-md bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/15 text-slate-900 dark:text-slate-100 rounded-bl-sm shadow-sm',
                        )}
                      >
                        {m.content.split('\n').map((line, j) => (
                          <React.Fragment key={j}>
                            {line.split(/(\*\*.*?\*\*)/g).map((part, k) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return (
                                  <strong key={k} className="font-bold text-brand-600 dark:text-brand-300">
                                    {part.slice(2, -2)}
                                  </strong>
                                );
                              }
                              return part;
                            })}
                            {j < m.content.split('\n').length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-6 h-6 rounded-md bg-white dark:bg-dark-800 border border-brand-500/25 flex items-center justify-center shrink-0 p-0.5 shadow-xs overflow-hidden">
                      <img src="/ploti-avatar.png" alt="Ploti AI" className="w-full h-full object-contain" />
                    </div>
                    <div className="backdrop-blur-md bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/15 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                      <div className="flex gap-1.5 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 dark:bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 dark:bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 dark:bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick replies for initial message */}
              {messages.length <= 1 && (
                <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                  {QUICK_REPLIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-lg backdrop-blur-md bg-white dark:bg-white/5 border border-slate-200 dark:border-white/20 text-brand-600 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-500/20 hover:text-brand-700 dark:hover:text-brand-200 transition-all shadow-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Message Input Box */}
              <div className="px-3 py-2.5 border-t border-slate-200 dark:border-white/10 flex items-center gap-2 shrink-0 backdrop-blur-md bg-slate-50/90 dark:bg-black/20">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder={lang === 'BN' ? 'প্লটি এআই-কে যেকোনো প্রশ্ন করুন...' : 'Ask Ploti AI anything...'}
                  className="flex-1 bg-white dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:border-brand-500/60 focus:bg-white dark:focus:bg-white/10 transition-all outline-none shadow-sm dark:shadow-none"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-xl bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center shrink-0 transition-all disabled:opacity-40 shadow-glow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
