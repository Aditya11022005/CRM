import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Lock, Database, Bell, Mail } from 'lucide-react';

const sections = [
  {
    icon: Eye,
    title: 'Information We Collect',
    content: [
      'Account Information: When you register, we collect your name, email address, and password (hashed using bcrypt).',
      'Business Information: Company name, GSTIN, logo, and workspace settings you provide.',
      'Lead Data: Business names, phone numbers, email addresses, and website URLs collected via our scraping tools or manually added by you.',
      'Usage Data: Login timestamps, feature interactions, and session tokens stored securely.',
      'Payment Data: Razorpay handles all payments. We store only order IDs and subscription status — never your card details.',
    ],
  },
  {
    icon: Database,
    title: 'How We Use Your Data',
    content: [
      'To provide, maintain, and improve the LeadOrbit CRM platform.',
      'To send OTP verification emails and important account notifications.',
      'To process subscription payments via Razorpay.',
      'To generate analytics and dashboard metrics visible only to you.',
      'We do NOT sell, rent, or share your personal data with third parties for marketing purposes.',
    ],
  },
  {
    icon: Lock,
    title: 'Data Security',
    content: [
      'All passwords are hashed using bcrypt with salt rounds — we never store plaintext passwords.',
      'JWT tokens are signed with a secret key and expire within 1 hour. Refresh tokens rotate on use.',
      'All data is transmitted over HTTPS/TLS encrypted connections.',
      'MongoDB Atlas provides at-rest encryption for all stored data.',
      'We conduct periodic security audits and maintain rate limiting to prevent brute-force attacks.',
    ],
  },
  {
    icon: Bell,
    title: 'Cookies & Local Storage',
    content: [
      'We use localStorage to store your JWT access token, refresh token, and active workspace ID.',
      'No third-party advertising cookies are used on this platform.',
      'Session data is cleared upon logout.',
      'You can clear all stored data by logging out or clearing your browser storage.',
    ],
  },
  {
    icon: Mail,
    title: 'Your Rights',
    content: [
      'Access: You can view all data associated with your account from your Settings page.',
      'Deletion: You may request deletion of your account and all associated data by contacting us.',
      'Portability: You can export your lead data as CSV at any time from the Leads page.',
      'Correction: You can update your name, email, and business details from Settings.',
      'To exercise any of these rights, email us at: privacy@codeitz.com',
    ],
  },
  {
    icon: Shield,
    title: 'Third-Party Services',
    content: [
      'Razorpay: Used for payment processing. Subject to Razorpay Privacy Policy.',
      'MongoDB Atlas: Cloud database hosting. Subject to MongoDB Privacy Policy.',
      'Cloudinary: Used for logo and file uploads. Subject to Cloudinary Privacy Policy.',
      'Google Places API: Used for business data retrieval. Subject to Google Privacy Policy.',
      'Nodemailer / Resend: Used for transactional email delivery.',
    ],
  },
];

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-jakarta">
      {/* Top gradient */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500" />

      {/* Header */}
      <header className="border-b border-slate-800/60 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <span className="font-outfit font-bold text-white">Codeitz CRM</span>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-indigo-400" />
          </div>
          <h1 className="text-4xl font-extrabold font-outfit text-white mb-3">Privacy Policy</h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            We take your privacy seriously. This policy explains how Codeitz CRM collects,
            uses, and protects your personal information.
          </p>
          <p className="text-xs text-slate-600 mt-3">Last updated: May 25, 2026 · Effective immediately</p>
        </div>

        {/* Intro box */}
        <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 mb-10 text-sm text-slate-300 leading-relaxed">
          By using Codeitz CRM ("the Service"), you agree to the collection and use of information
          in accordance with this Privacy Policy. This policy applies to all users of the platform
          including Business Owners, Managers, and Employees operating under a business workspace.
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4.5 h-4.5 text-indigo-400" />
                  </div>
                  <h2 className="text-base font-bold font-outfit text-white">{s.title}</h2>
                </div>
                <ul className="space-y-2.5">
                  {s.content.map((c, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-slate-400 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60 mt-2 flex-shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Contact */}
        <div className="mt-10 p-6 rounded-2xl bg-slate-900/30 border border-slate-800/60 text-center">
          <p className="text-sm text-slate-400">
            Questions about this Privacy Policy?{' '}
            <a href="mailto:privacy@codeitz.com" className="text-indigo-400 hover:underline">
              privacy@codeitz.com
            </a>
          </p>
        </div>
      </div>

      <footer className="border-t border-slate-800/40 py-6 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Codeitz. All rights reserved.
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
