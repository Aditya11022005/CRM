import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, AlertTriangle, CheckCircle2, XCircle, Info, ShieldCheck } from 'lucide-react';

const GDPRNotice = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-jakarta">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

      <header className="border-b border-slate-800/60 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <span className="font-outfit font-bold text-white">Codeitz CRM</span>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Globe className="w-7 h-7 text-amber-400" />
          </div>
          <h1 className="text-4xl font-extrabold font-outfit text-white mb-3">GDPR & Scraper Notice</h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            Transparency about how our scraping tools collect publicly available business data,
            and your responsibilities as a platform user.
          </p>
          <p className="text-xs text-slate-600 mt-3">Last updated: May 25, 2026</p>
        </div>

        {/* Important Notice */}
        <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/30 mb-10 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300 mb-1">Important Notice for All Users</p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Codeitz CRM's scraping tools collect <strong className="text-slate-200">publicly visible</strong> business
              information from Google Maps and other directories. This data is collected under legitimate interest
              principles. However, you — the user — are solely responsible for how you use this data in your jurisdiction.
            </p>
          </div>
        </div>

        {/* What we scrape */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
              <Info className="w-4.5 h-4.5 text-blue-400" />
            </div>
            <h2 className="text-base font-bold font-outfit text-white">What Data Our Scrapers Collect</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Business Name (public listing)',
              'Phone Number (publicly listed)',
              'Business Address (public)',
              'Website URL (publicly listed)',
              'Google Maps Rating (public)',
              'Review Count (public)',
              'Business Category (public)',
              'Opening Hours (public)',
              'Google Maps URL (public link)',
              'Email (extracted from website HTML)',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/40 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* What we do NOT scrape */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/15 flex items-center justify-center">
              <XCircle className="w-4.5 h-4.5 text-rose-400" />
            </div>
            <h2 className="text-base font-bold font-outfit text-white">What We Do NOT Collect</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Personal home addresses',
              'Individual (non-business) profiles',
              'Private phone numbers',
              'Financial or banking data',
              'Medical or health records',
              'Data from login-protected pages',
              'User account credentials',
              'Children\'s data (under 18)',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/10 text-sm text-slate-400">
                <XCircle className="w-4 h-4 text-rose-500/70 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* GDPR Compliance */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <h2 className="text-base font-bold font-outfit text-white">GDPR Compliance Framework</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                title: 'Lawful Basis — Legitimate Interest',
                desc: 'Business contact information displayed publicly on Google Maps is collected under "Legitimate Interest" (Article 6(1)(f) GDPR). The data subjects are businesses, not private individuals.',
              },
              {
                title: 'Data Minimisation',
                desc: 'We only collect the minimum data necessary for B2B lead generation purposes. No sensitive personal data (Article 9) is collected.',
              },
              {
                title: 'Right to Erasure',
                desc: 'If a business owner requests removal of their data from your CRM, you can delete individual leads from the Leads page at any time.',
              },
              {
                title: 'User Responsibility',
                desc: 'You (the CRM user) act as the Data Controller for leads you collect. You are responsible for obtaining consent if required by local law before sending marketing communications.',
              },
              {
                title: 'Data Retention',
                desc: 'You control how long lead data is stored. You may delete individual leads or export and remove all leads at any time.',
              },
            ].map((item, i) => (
              <div key={i} className="border-l-2 border-emerald-500/30 pl-4">
                <p className="text-sm font-semibold text-slate-200 mb-1">{item.title}</p>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Opt-out */}
        <div className="bg-slate-900/40 border border-amber-500/20 rounded-2xl p-6 mb-6">
          <h2 className="text-base font-bold font-outfit text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-400" /> Business Opt-Out / Data Removal
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            If you are a business owner whose information appears in a user's Codeitz CRM and you wish
            to have it removed, please contact us. We will notify the relevant CRM user and assist in data removal.
          </p>
          <a
            href="mailto:gdpr@codeitz.com"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm hover:bg-amber-500/15 transition-all"
          >
            <Globe className="w-4 h-4" /> Submit Opt-Out Request → gdpr@codeitz.com
          </a>
        </div>

        {/* Note for Indian users */}
        <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-sm text-slate-400 leading-relaxed">
          <p className="font-semibold text-blue-300 mb-2">Note for Indian Users (DPDP Act 2023)</p>
          <p>
            Codeitz CRM is designed to comply with India's Digital Personal Data Protection Act 2023.
            Business contact data displayed publicly is not considered "personal data" under DPDP Act
            when used for legitimate B2B outreach. However, sending unsolicited bulk messages may
            violate TRAI regulations — please ensure your outreach is consensual and opt-out friendly.
          </p>
        </div>
      </div>

      <footer className="border-t border-slate-800/40 py-6 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Codeitz. All rights reserved.
      </footer>
    </div>
  );
};

export default GDPRNotice;
