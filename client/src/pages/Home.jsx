import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass, Zap, LineChart, FileSpreadsheet, MessageSquare,
  CalendarDays, ShieldCheck, ArrowRight, CheckCircle2,
  Users, Building, Star, Globe, Phone, Mail, TrendingUp,
  BarChart3, Clock, Sparkles, Megaphone, X
} from 'lucide-react';
import api from '../services/api';

const Home = () => {
  const navigate = useNavigate();

  const [packages, setPackages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [pkgRes, annRes] = await Promise.all([
          api.get('/subscriptions/packages'),
          api.get('/auth/announcements/public')
        ]);
        if (pkgRes.data.success) {
          setPackages(pkgRes.data.packages || []);
        }
        if (annRes.data.success) {
          setAnnouncements(annRes.data.announcements || []);
        }
      } catch (err) {
        console.error('Failed to retrieve active plans or broadcasts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const features = [
    { icon: Compass, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', title: 'Dual Lead Scraper', desc: 'Google Maps API + Puppeteer browser automation. Extract business name, phone, email, website from any city.' },
    { icon: LineChart, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', title: 'Kanban CRM Pipeline', desc: 'Drag-and-drop leads across stages: New → Contacted → Interested → Converted. Full activity timeline.' },
    { icon: MessageSquare, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', title: 'WhatsApp Bulk Sender', desc: 'Send personalised WhatsApp messages to 100+ leads in one click using smart message templates.' },
    { icon: CalendarDays, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', title: 'Follow-up Calendar', desc: 'Never miss a follow-up. Visual monthly calendar with overdue alerts and reminder notifications.' },
    { icon: FileSpreadsheet, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', title: 'GST Quotes & Invoices', desc: 'Generate professional GST-compliant quotes and invoices with Razorpay payment links and UPI QR codes.' },
    { icon: Users, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20', title: 'Multi-User Workspaces', desc: 'Add team members with custom roles and permissions. Manage multiple businesses from one account.' },
    { icon: BarChart3, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', title: 'Analytics Dashboard', desc: 'Real-time conversion metrics, revenue charts, team performance, and lead source breakdown.' },
    { icon: ShieldCheck, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', title: 'Secure & Scalable', desc: 'JWT auth, OTP verification, role-based access control, rate limiting, and encrypted data storage.' },
  ];

  const fallbackPlans = [
    { name: 'Monthly', price: 299, durationDays: 30, limitLeads: 1000, description: 'For growing freelancers & small teams', features: ['1,000 Leads / month', 'CRM Pipeline', 'WhatsApp Sender', 'Quotes & Invoices', 'Follow-up Calendar'], isPopular: false },
    { name: '6 Month', price: 3000, durationDays: 180, limitLeads: 8000, description: 'Best value for agencies & consultants', features: ['8,000 Leads / 6 months', 'Everything in Monthly', 'Multi-Workspace', 'Custom Brand Colors', 'Priority Scraping'], isPopular: true },
    { name: 'Yearly', price: 5000, durationDays: 365, limitLeads: 999999, description: 'For scaling companies & sales teams', features: ['Unlimited Leads', 'Everything in 6 Months', 'White-Label Ready', 'Dedicated Support', 'API Access'], isPopular: false },
  ];

  const displayedPackages = (packages && packages.length > 0)
    ? packages.filter(p => p.name !== 'Free Trial')
    : fallbackPlans;

  const useCases = [
    { icon: '☀️', title: 'Solar Companies', desc: 'Find residential & commercial solar leads city-wise.' },
    { icon: '🏢', title: 'Real Estate Agencies', desc: 'Scrape builders, brokers & property listings.' },
    { icon: '💼', title: 'Digital Agencies', desc: 'Prospect local businesses needing websites & SEO.' },
    { icon: '💇', title: 'Salons & Spas', desc: 'Build B2B client base for beauty product suppliers.' },
    { icon: '⚖️', title: 'Legal & CA Firms', desc: 'Target MSMEs for compliance & accounting services.' },
    { icon: '🔧', title: 'Service Providers', desc: 'HVAC, pest control, plumbing — find local leads fast.' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-jakarta overflow-x-hidden">

      {/* Ambient glows */}
      <div className="fixed top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/8 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-500/8 blur-[120px] pointer-events-none" />

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md px-6 sm:px-12 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-extrabold shadow-lg shadow-indigo-500/25">C</div>
          <span className="font-outfit font-bold text-white tracking-wide">Codeitz CRM</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#usecases" className="hover:text-white transition-colors">Use Cases</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="text-sm text-slate-400 hover:text-white transition-colors">Sign In</button>
          <button onClick={() => navigate('/register')} className="px-4 py-2 rounded-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all">
            Start Free Trial
          </button>
        </div>
      </header>

      {/* ── Announcements Banner ── */}
      {announcements.length > 0 && (
        <div className="bg-slate-950 border-b border-slate-900 py-3 px-6 text-center">
          <div className="max-w-6xl mx-auto space-y-2">
            {announcements.map((ann) => {
              if (dismissedAnnouncements.includes(ann._id)) return null;
              return (
                <div
                  key={ann._id}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-sm animate-enter ${
                    ann.type === 'danger' ? 'bg-rose-500/10 border-rose-500/25 text-rose-350' :
                    ann.type === 'warning' ? 'bg-amber-500/10 border-amber-500/25 text-amber-350' :
                    ann.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-350' :
                    'bg-indigo-500/10 border-indigo-500/25 text-indigo-350'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Megaphone className="w-4 h-4 shrink-0 text-indigo-400 animate-bounce" />
                    <span>{ann.message}</span>
                  </div>
                  <button
                    onClick={() => setDismissedAnnouncements(prev => [...prev, ann._id])}
                    className="p-1 hover:bg-slate-900/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-xs font-semibold text-indigo-400 mb-6">
          <Sparkles className="w-3.5 h-3.5" /> India's #1 Lead Generation + CRM SaaS Platform
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight font-outfit text-white max-w-4xl mx-auto leading-[1.08]">
          Scrape Leads.{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-500">
            Close Deals.
          </span>
          <br />Grow Faster.
        </h1>

        <p className="text-slate-400 text-base max-w-2xl mx-auto mt-6 leading-relaxed">
          The complete B2B sales toolkit — scrape 1000s of leads from Google Maps, manage them in a Kanban CRM, send bulk WhatsApp messages, and close deals with GST invoices. Built for Indian businesses.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-3.5 rounded-full text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white shadow-2xl shadow-indigo-500/25 flex items-center justify-center gap-2 group transition-all"
          >
            Launch Free Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <a href="#pricing" className="px-8 py-3.5 rounded-full text-sm font-semibold bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 transition-all flex items-center justify-center">
            View Pricing Plans
          </a>
        </div>

        <p className="text-xs text-slate-600 mt-4">3-day free trial · No credit card required · Cancel anytime</p>

        {/* Mock UI */}
        <div className="mt-16 w-full rounded-2xl border border-slate-800/80 p-2 bg-slate-900/30 backdrop-blur-sm shadow-2xl">
          <div className="w-full rounded-xl bg-slate-950 overflow-hidden">
            <div className="h-8 border-b border-slate-900 px-4 flex items-center gap-2 bg-slate-900/40">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-600 ml-3 font-mono">app.codeitz.com/leads</span>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { name: 'Apex Solar Pvt Ltd', phone: '+91 98765 43210', city: 'Pune', status: 'Interested', rating: '4.5⭐' },
                { name: 'SunLight Energy Mumbai', phone: '+91 87654 32109', city: 'Mumbai', status: 'Contacted', rating: '4.2⭐' },
                { name: 'GreenTech Solutions', phone: '+91 76543 21098', city: 'Nashik', status: 'New', rating: '4.8⭐' },
              ].map((lead) => (
                <div key={lead.name} className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 text-left space-y-2">
                  <div className="flex items-start justify-between">
                    <p className="text-xs font-semibold text-slate-200">{lead.name}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${lead.status === 'Interested' ? 'bg-yellow-500/15 text-yellow-400' : lead.status === 'Contacted' ? 'bg-blue-500/15 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>{lead.status}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">📞 {lead.phone}</p>
                  <p className="text-[10px] text-slate-500">📍 {lead.city} · {lead.rating}</p>
                  <div className="flex gap-1.5 pt-1">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">WhatsApp</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">CRM →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold font-outfit text-white mb-3">
            Everything You Need to Close More Deals
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            From lead discovery to payment collection — one platform, zero compromises.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className={`p-5 rounded-2xl border ${f.bg} hover:-translate-y-1 transition-all duration-200 group`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.bg}`}>
                  <Icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 bg-slate-900/30 border-y border-slate-800/60">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold font-outfit text-white text-center mb-3">How It Works</h2>
          <p className="text-slate-400 text-sm text-center mb-14">Get from zero to 1000 leads in under 10 minutes.</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', icon: '🔍', title: 'Search Any Category', desc: 'Type "Solar companies Pune" — our scraper does the rest.' },
              { step: '02', icon: '📋', title: 'Leads Auto-Saved', desc: 'Phone, email, website, rating — all saved to your CRM database.' },
              { step: '03', icon: '📱', title: 'Send WhatsApp', desc: 'Select 100 leads → choose template → send in one click.' },
              { step: '04', icon: '💰', title: 'Close with Invoice', desc: 'Generate GST invoice → share Razorpay link → get paid.' },
            ].map((item) => (
              <div key={item.step} className="relative text-center p-5 rounded-2xl bg-slate-900 border border-slate-800/60">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-600 text-white">{item.step}</span>
                <div className="text-3xl mb-3 mt-2">{item.icon}</div>
                <h3 className="text-sm font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section id="usecases" className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold font-outfit text-white mb-3">Built for Every Indian Business</h2>
          <p className="text-slate-400 text-sm">Whether you sell solar panels or legal services — LeadOrbit works for you.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {useCases.map((u) => (
            <div key={u.title} className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/60 hover:border-slate-700 transition-all hover:-translate-y-0.5 flex items-start gap-4">
              <span className="text-2xl flex-shrink-0">{u.icon}</span>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">{u.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{u.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 bg-slate-900/30 border-y border-slate-800/60">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold font-outfit text-white mb-3">Simple, Honest Pricing</h2>
            <p className="text-slate-400 text-sm">No hidden fees. Start free for 3 days — no card needed.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayedPackages.map((p) => (
              <div key={p.name} className={`relative flex flex-col rounded-2xl p-6 border transition-all ${p.isPopular ? 'bg-gradient-to-b from-indigo-950/60 to-slate-900 border-indigo-500 shadow-2xl shadow-indigo-500/10 scale-[1.02]' : 'bg-slate-900/50 border-slate-800/60'}`}>
                {p.isPopular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-indigo-600 text-white shadow-lg">
                    Most Popular
                  </span>
                )}
                <h3 className="font-outfit font-bold text-white text-lg mb-1 uppercase tracking-wide">{p.name}</h3>
                <p className="text-xs text-slate-500 mb-5">{p.description || 'Premium SaaS Plan'}</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold font-outfit text-white">₹{p.price.toLocaleString()}</span>
                  <span className="text-xs text-slate-500"> / {p.durationDays} days</span>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-xs text-slate-350 font-semibold border-b border-slate-850 pb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    {p.limitLeads === 999999 ? 'Unlimited Leads' : `${p.limitLeads.toLocaleString()} Leads`}
                  </li>
                  {p.features && p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/register')}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${p.isPopular ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}
                >
                  Start {p.name}
                </button>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-600 mt-8">All plans include 3-day free trial on signup · Powered by Razorpay</p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 max-w-4xl mx-auto px-6 text-center">
        <div className="p-10 rounded-3xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/20 shadow-2xl">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-3xl font-extrabold font-outfit text-white mb-3">Ready to 10x Your Lead Pipeline?</h2>
          <p className="text-slate-400 text-sm mb-8 max-w-xl mx-auto">Join 500+ businesses already using Codeitz CRM to scrape, manage, and convert leads daily.</p>
          <button
            onClick={() => navigate('/register')}
            className="px-10 py-4 rounded-full text-base font-bold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white shadow-2xl shadow-indigo-500/30 flex items-center gap-2 mx-auto transition-all group"
          >
            Start Free — No Card Needed <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-xs text-slate-600 mt-4">3-day trial · Cancel anytime · Indian payment support (Razorpay)</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800/60 bg-slate-950 py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">C</div>
                <span className="font-outfit font-bold text-white">Codeitz CRM</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">India's most powerful Lead Generation + CRM SaaS. Built for agencies, freelancers & sales teams.</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Product</h4>
              <ul className="space-y-2 text-xs text-slate-500">
                <li><a href="#features" className="hover:text-slate-300 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-slate-300 transition-colors">Pricing</a></li>
                <li><a href="#usecases" className="hover:text-slate-300 transition-colors">Use Cases</a></li>
                <li><button onClick={() => navigate('/register')} className="hover:text-slate-300 transition-colors text-left">Free Trial</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Legal</h4>
              <ul className="space-y-2 text-xs text-slate-500">
                <li><button onClick={() => navigate('/privacy')} className="hover:text-slate-300 transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => navigate('/terms')} className="hover:text-slate-300 transition-colors">Terms of Service</button></li>
                <li><button onClick={() => navigate('/gdpr')} className="hover:text-slate-300 transition-colors">GDPR Scraper Notice</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Contact</h4>
              <ul className="space-y-2 text-xs text-slate-500">
                <li className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> support@codeitz.com</li>
                <li className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> app.codeitz.com</li>
                <li className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> +91 98765 00000</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <span>© {new Date().getFullYear()} Codeitz. All rights reserved. Made with ❤️ in India.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
