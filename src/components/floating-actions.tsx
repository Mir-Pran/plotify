'use client';

import React, { useState } from 'react';
import { MessageCircle, Heart, Bot, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

export default function FloatingActions() {
  const { lang } = useLanguage();
  const [waOpen, setWaOpen] = useState(false);

  const WA_NUMBER = '+8809612000888';
  const WA_TOPICS = [
    {
      label: lang === 'BN' ? '🏠 ফ্ল্যাট / অ্যাপার্টমেন্ট খুঁজছি' : '🏠 Looking for a Flat / Apartment',
      msg: lang === 'BN' ? 'হ্যালো প্লটিফাই! আমি একটি ফ্ল্যাট/অ্যাপার্টমেন্ট খুঁজছি।' : 'Hi Plotify! I am looking for an Apartment/Flat.',
    },
    {
      label: lang === 'BN' ? '🌿 জমি বা প্লট খুঁজছি' : '🌿 Looking for Land or Plot',
      msg: lang === 'BN' ? 'হ্যালো প্লটিফাই! আমি জমি বা প্লট কিনতে চাই।' : 'Hi Plotify! I want to find Land or a Plot.',
    },
    {
      label: lang === 'BN' ? '📋 সম্পত্তি বিজ্ঞাপন দিতে চাই' : '📋 Want to List My Property',
      msg: lang === 'BN' ? 'হ্যালো প্লটিফাই! আমি আমার সম্পত্তি বিক্রি/ভাড়া দিতে চাই।' : 'Hi Plotify! I want to list my property for sale/rent.',
    },
    {
      label: lang === 'BN' ? '💰 ফি সংক্রান্ত অনুসন্ধান' : '💰 Inquiry About Fees',
      msg: lang === 'BN' ? 'হ্যালো প্লটিফাই! লিস্টিং অ্যাক্টিভেশন ফি সম্পর্কে জানতে চাই।' : 'Hi Plotify! I have a question about listing activation fees.',
    },
  ];

  return (
    <>
      {/* Floating Vertical Action Bar with iOS Glass Tile */}
      <div className="fixed right-4 sm:right-6 bottom-6 z-40 flex flex-col items-center gap-3">

        {/* Saved / Heart */}
        <button
          title={lang === 'BN' ? 'সংরক্ষিত সম্পত্তি' : 'Saved Properties'}
          className="group w-11 h-11 rounded-full backdrop-blur-md bg-white dark:bg-black/40 border border-slate-200 dark:border-white/20 text-slate-700 dark:text-slate-300 hover:text-rose-500 hover:border-rose-500/40 flex items-center justify-center shadow-md dark:shadow-glass-card transition-all hover:scale-110"
        >
          <Heart className="w-5 h-5" />
          <span className="absolute right-14 backdrop-blur-md bg-slate-900/90 text-white text-xs font-semibold px-2.5 py-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/20 shadow-md">
            {lang === 'BN' ? 'সংরক্ষিত' : 'Saved'}
          </span>
        </button>

        {/* WhatsApp AI */}
        <button
          onClick={() => setWaOpen(!waOpen)}
          title={lang === 'BN' ? 'হোয়াটসঅ্যাপ সহকারী' : 'WhatsApp AI Assistant'}
          className="group w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#22c55e] text-white flex items-center justify-center shadow-lg shadow-green-900/30 transition-all hover:scale-110 relative"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-pulse-ring opacity-30" />
        </button>

        {/* Ploti AI */}
        <button
          onClick={() => {
            window.dispatchEvent(new Event('ploti-open'));
            window.dispatchEvent(new Event('panda-open'));
          }}
          title={lang === 'BN' ? 'প্লটি এআই স্মার্ট সহকারী' : 'Ploti AI Assistant'}
          className="group w-12 h-12 rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center shadow-glow-sm transition-all hover:scale-110 relative"
        >
          <Bot className="w-6 h-6" />
        </button>
      </div>

      {/* WhatsApp Topic Selector with iOS Glass Tile */}
      {waOpen && (
        <div className="fixed right-4 sm:right-20 bottom-6 z-50 w-72 backdrop-blur-2xl bg-white/95 dark:bg-dark-900/90 border border-slate-200 dark:border-white/20 rounded-2xl shadow-xl dark:shadow-glass-modal overflow-hidden animate-slide-up">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-[#075E54]/90 dark:bg-[#075E54]/40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  {lang === 'BN' ? 'প্লটিফাই হোয়াটসঅ্যাপ' : 'Plotify on WhatsApp'}
                </div>
                <div className="text-[10px] text-green-300 dark:text-green-400">
                  {lang === 'BN' ? '● অনলাইন — ২৪/৭ সহায়তা' : '● Online — 24/7 Assistance'}
                </div>
              </div>
            </div>
            <button onClick={() => setWaOpen(false)} className="text-white/80 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-2">
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
              {lang === 'BN' ? 'চ্যাট শুরু করতে একটি বিষয় নির্বাচন করুন:' : 'Select a topic to start chatting:'}
            </p>
            {WA_TOPICS.map((t) => (
              <a
                key={t.label}
                href={`https://wa.me/${WA_NUMBER.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(t.msg)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-left px-3 py-2.5 rounded-xl backdrop-blur-md bg-slate-100 hover:bg-brand-500/15 dark:bg-white/5 dark:hover:bg-brand-500/20 border border-slate-200 hover:border-brand-500/40 dark:border-white/10 dark:hover:border-brand-500/40 text-xs font-medium text-slate-800 hover:text-brand-700 dark:text-slate-200 dark:hover:text-white transition-all shadow-sm dark:shadow-none"
              >
                {t.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
