'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

export default function TermsOfServicePage() {
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

        {/* Content */}
        <div className="bg-white dark:bg-dark-800/80 border border-slate-200 dark:border-white/10 rounded-3xl p-8 sm:p-12 shadow-sm mb-8">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-6">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {lang === 'BN' ? 'ব্যবহারের শর্তাবলী (Terms of Service)' : 'Terms of Service'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
            {lang === 'BN' ? 'কার্যকর তারিখ: সেপ্টেম্বর ২০২৬' : 'Effective Date: September 2026 • Plotify Marketplace Technologies'}
          </p>

          <div className="mt-8 prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-6 leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-500" />
                1. Acceptance of Terms & User Roles
              </h2>
              <p>
                By accessing or registering on Plotify, you agree to comply with all applicable laws of the People's Republic of Bangladesh. Our platform enforces strict Role-Based Access Control (RBAC):
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Personal Users:</strong> Permitted to browse approved listings, save favorite properties, submit inquiries, and interact with sellers. Personal accounts cannot publish property listings without upgrading.</li>
                <li><strong>Business Users:</strong> Real estate developers, agency brokers, and verified property owners authorized to post listings, track lead analytics, and manage property assets.</li>
                <li><strong>Administrators:</strong> Platform moderators who review NID identity verification, audit listings, approve/reject property submissions, and ensure fraud prevention.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-500" />
                2. Listing Submission & Approval Workflow
              </h2>
              <p>
                All properties submitted by business users enter a <strong>'pending'</strong> approval state. Plotify administrators review every submission for accurate pricing in BDT, legal ownership veracity, authentic photos, and accurate geographic coordinates. Only listings designated with <strong>'approved'</strong> status appear publicly on our homepage and search engine.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-teal-500" />
                3. Prohibited Conduct
              </h2>
              <p>
                Users are strictly prohibited from submitting fake listings, deceptive pricing, duplicate posts, or misleading photos. Submissions with invalid contact information or fraudulent claims will result in immediate permanent account termination and potential reporting to law enforcement authorities.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                4. Ploti AI Real Estate Guidance
              </h2>
              <p>
                Ploti AI provides automated estimations, land unit conversions (e.g. Katha, Bigha, Shotangsho to square feet), and neighborhood guidance. Ploti AI outputs are for informational reference and do not constitute certified legal title deeds or formal financial appraisals.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
