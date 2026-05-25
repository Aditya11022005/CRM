import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, UserCheck, CreditCard, AlertTriangle, Scale, Ban } from 'lucide-react';

const sections = [
  {
    icon: UserCheck,
    title: '1. Acceptance of Terms',
    content: [
      'By creating an account or using the Codeitz CRM platform, you agree to be bound by these Terms of Service.',
      'If you are using the Service on behalf of a business, you represent that you have the authority to bind that business to these Terms.',
      'We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.',
      'Users must be at least 18 years of age to create an account.',
    ],
  },
  {
    icon: FileText,
    title: '2. Service Description',
    content: [
      'Codeitz CRM is a multi-tenant SaaS platform providing Lead Generation, CRM pipeline management, Quote and Invoice creation, and team collaboration tools.',
      'The Service includes dual-method lead scraping via Google Places API and Puppeteer browser automation.',
      'We provide access to the Service on a subscription basis with plans: Monthly (₹299), 6 Months (₹3,000), and Yearly (₹5,000).',
      'A 3-day free trial is available upon registration. No credit card is required for the trial period.',
    ],
  },
  {
    icon: CreditCard,
    title: '3. Payments & Subscriptions',
    content: [
      'All payments are processed securely through Razorpay. We do not store your card or banking information.',
      'Subscriptions are non-refundable once activated, except in cases of service unavailability exceeding 72 consecutive hours.',
      'Subscriptions auto-expire at the end of the plan period. There is no automatic renewal without your explicit action.',
      'In case of payment disputes, please contact us at billing@codeitz.com within 7 days of the transaction.',
    ],
  },
  {
    icon: AlertTriangle,
    title: '4. Acceptable Use Policy',
    content: [
      'You agree NOT to use the Service to collect data for illegal purposes, spam, harassment, or violation of any applicable law.',
      'You agree NOT to resell, sublicense, or redistribute access to the platform or scraped data without explicit written permission.',
      'You agree NOT to attempt to reverse engineer, decompile, or extract the source code of the platform.',
      'You agree NOT to upload malicious files, run denial-of-service attacks, or attempt to gain unauthorized access to other accounts.',
      'Violation of this policy may result in immediate account termination without refund.',
    ],
  },
  {
    icon: Scale,
    title: '5. Data Ownership & Liability',
    content: [
      'All lead data collected through the platform remains your property. We do not claim ownership of your business data.',
      'You are solely responsible for ensuring your use of scraped data complies with applicable local, national, and international laws.',
      'Codeitz CRM is provided "as is" without warranties of any kind. We are not liable for business losses resulting from use of the platform.',
      'Our maximum liability for any claim related to the Service is limited to the amount paid by you in the last 30 days.',
    ],
  },
  {
    icon: Ban,
    title: '6. Termination',
    content: [
      'We reserve the right to suspend or terminate accounts that violate these Terms without prior notice.',
      'You may terminate your account at any time by contacting support@codeitz.com.',
      'Upon termination, your data will be retained for 30 days before permanent deletion, giving you time to export your leads.',
      'Super Admin accounts may be terminated for abuse of platform-wide privileges.',
    ],
  },
];

const TermsOfService = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-jakarta">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-blue-500 to-indigo-500" />

      <header className="border-b border-slate-800/60 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <span className="font-outfit font-bold text-white">Codeitz CRM</span>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
            <Scale className="w-7 h-7 text-violet-400" />
          </div>
          <h1 className="text-4xl font-extrabold font-outfit text-white mb-3">Terms of Service</h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            These terms govern your use of Codeitz CRM. Please read them carefully before
            creating an account or using the platform.
          </p>
          <p className="text-xs text-slate-600 mt-3">Last updated: May 25, 2026 · Governed by Indian Law</p>
        </div>

        <div className="p-5 rounded-2xl bg-violet-500/5 border border-violet-500/20 mb-10 text-sm text-slate-300 leading-relaxed">
          This agreement is between you ("User") and Codeitz ("the Company"), the operator of the
          Codeitz CRM platform. By accessing or using the Service, you confirm that you have read,
          understood, and agreed to be bound by these Terms of Service.
        </div>

        <div className="space-y-8">
          {sections.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4.5 h-4.5 text-violet-400" />
                  </div>
                  <h2 className="text-base font-bold font-outfit text-white">{s.title}</h2>
                </div>
                <ul className="space-y-2.5">
                  {s.content.map((c, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-slate-400 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500/60 mt-2 flex-shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-10 p-6 rounded-2xl bg-slate-900/30 border border-slate-800/60 text-center space-y-2">
          <p className="text-sm text-slate-400">Questions? Reach out to our legal team:</p>
          <a href="mailto:legal@codeitz.com" className="text-violet-400 hover:underline text-sm">legal@codeitz.com</a>
          <p className="text-xs text-slate-600">These Terms are governed by the laws of India. Disputes subject to jurisdiction of Pune, Maharashtra courts.</p>
        </div>
      </div>

      <footer className="border-t border-slate-800/40 py-6 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Codeitz. All rights reserved.
      </footer>
    </div>
  );
};

export default TermsOfService;
