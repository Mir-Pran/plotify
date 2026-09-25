'use client';

import React from 'react';
import Link from 'next/link';
import { RotateCcw, ArrowLeft, CheckCircle2, DollarSign, Clock, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

export default function RefundPolicyPage() {
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
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6">
            <RotateCcw className="w-6 h-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {lang === 'BN' ? 'রিফান্ড ও পেমেন্ট নীতি (Refund Policy)' : 'Refund & Cancellation Policy'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
            {lang === 'BN' ? 'সর্বশেষ সংস্করণ: সেপ্টেম্বর ২০২৬' : 'Last Updated: September 2026 • Transparent BDT Billing'}
          </p>

          <div className="mt-8 prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-6 leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-500" />
                1. Listing Fees & Service Activation
              </h2>
              <p>
                Plotify charges fixed, transparent listing fees (ranging between Tk 500 to Tk 5,000 depending on property type and promotion tier) to cover manual document verification, photography enhancement, and GPS positioning.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500" />
                2. Eligibility for Full Refund
              </h2>
              <p>
                You are entitled to a 100% full refund under the following conditions:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Admin Listing Rejection:</strong> If our administration team rejects your property submission during moderation for reasons other than fraudulent misrepresentation, your full fee will be refunded back to your payment source.</li>
                <li><strong>Duplicate Payment:</strong> In the event of an accidental double debit via bKash, Nagad, or credit card gateway.</li>
                <li><strong>Service Inactivation:</strong> If your approved listing fails to appear live due to a technical server outage persisting for more than 48 consecutive hours.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                3. Refund Processing Time
              </h2>
              <p>
                Once approved by our financial accounting desk, refunds are remitted to your original mobile wallet (bKash/Nagad/Rocket) or bank card within <strong>3 to 5 business days</strong> without any deduction.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-500" />
                4. Initiating a Refund Claim
              </h2>
              <p>
                To request a refund, please send your Transaction ID (TrxID), account email, and registered phone number to <a href="mailto:billing@plotify.com.bd" className="text-brand-600 dark:text-brand-400 font-bold underline">billing@plotify.com.bd</a> or WhatsApp us at <strong>+880 9612 000 888</strong>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
