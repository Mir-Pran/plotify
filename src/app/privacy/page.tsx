'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, Eye, Database, FileText } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

export default function PrivacyPolicyPage() {
  const { lang } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900 py-16 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {lang === 'BN' ? 'হোমপেজে ফিরে যান' : 'Back to Home'}
        </Link>

        {/* Header */}
        <div className="bg-white dark:bg-dark-800/80 border border-slate-200 dark:border-white/10 rounded-3xl p-8 sm:p-12 shadow-sm mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-6">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {lang === 'BN' ? 'গোপনীয়তা নীতি (Privacy Policy)' : 'Privacy Policy'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
            {lang === 'BN' ? 'সর্বশেষ আপডেট: সেপ্টেম্বর ২০২৬' : 'Last Updated: September 2026 • Effective immediately'}
          </p>

          <div className="mt-8 prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-6 leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Database className="w-4 h-4 text-brand-500" />
                1. Information We Collect
              </h2>
              <p>
                When you register, list a property, or contact sellers on Plotify, we collect personal identifying details such as:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Account Data:</strong> Full Name, Email Address, and verified Bangladeshi Mobile Number (11 digits, starting with 01).</li>
                <li><strong>Business Verification Data:</strong> National Identity Card (NID) number and photo identification for users requesting upgrade to a Business Account.</li>
                <li><strong>Listing Data:</strong> Property title, exact geographic coordinates (GPS), photos, pricing, and ownership documentation.</li>
                <li><strong>Usage & AI Interactions:</strong> Anonymous search queries and questions submitted to our Ploti AI assistant to improve real estate guidance.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-500" />
                2. How We Use and Protect Your Data
              </h2>
              <p>
                We do not sell, rent, or lease your private personal contact details to third-party telemarketers. Your information is strictly utilized to:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Facilitate direct, authentic communication between genuine property buyers and verified owners or developers.</li>
                <li>Verify ownership authenticity to prevent fraudulent, duplicate, or scam real estate listings in Bangladesh.</li>
                <li>Maintain isolated, secure sessions preventing unauthorized cross-device credential bleeding.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4 text-brand-500" />
                3. Read-Only Contact Field Guarantees
              </h2>
              <p>
                For anti-fraud security and KYC integrity, your verified Email Address and Bangladeshi Phone Number are permanently locked as read-only on your user profile. To update these credentials, users must submit an official identity verification review to the Plotify administrative moderation team.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-500" />
                4. Contact & Compliance
              </h2>
              <p>
                If you have questions regarding our data protection standards or wish to request data deletion, contact our Data Privacy Officer at <a href="mailto:support@plotify.com.bd" className="text-brand-600 dark:text-brand-400 font-bold underline">support@plotify.com.bd</a> or phone <strong>+880 9612 000 888</strong>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
