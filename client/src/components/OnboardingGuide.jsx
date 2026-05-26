import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  X, ChevronRight, ChevronLeft, CheckCircle2, Circle,
  Building, Search, GitPullRequestArrow, FileText, Bell,
  Sparkles, Rocket, ArrowRight, PartyPopper
} from 'lucide-react';

// ── confetti helper ────────────────────────────────────────────────────────────
const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

function ConfettiCanvas({ active }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const pieces    = useRef([]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    pieces.current = Array.from({ length: 120 }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * -canvas.height,
      r:     Math.random() * 8 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot:   Math.random() * 360,
      vx:    (Math.random() - 0.5) * 4,
      vy:    Math.random() * 4 + 2,
      vr:    (Math.random() - 0.5) * 6,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.current.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.5);
        ctx.restore();
        p.x  += p.vx;
        p.y  += p.vy;
        p.rot += p.vr;
      });
      pieces.current = pieces.current.filter((p) => p.y < canvas.height + 20);
      if (pieces.current.length > 0) animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[999]"
    />
  );
}

// ── step definitions ───────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'welcome',
    icon: Rocket,
    iconColor: 'text-indigo-400',
    iconBg: 'bg-indigo-500/15',
    title: 'Welcome to Codeitz CRM! 🎉',
    subtitle: 'Your Lead Generation & CRM platform is ready.',
    desc: 'This 5-step quick start guide will help you configure your workspaces, scrape local leads, and manage contacts within minutes. Shall we start?',
    action: null,
    actionLabel: null,
  },
  {
    id: 'business',
    icon: Building,
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-500/15',
    title: 'Step 1: Create Business Workspace',
    subtitle: 'Configure your business workspace profile.',
    desc: 'Navigate to Settings to add your Business Name, logo assets, and custom billing parameters. Each workspace operates independently.',
    action: '/settings',
    actionLabel: 'Open Settings →',
    checkKey: 'onboarding_business_done',
  },
  {
    id: 'lead',
    icon: Search,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/15',
    title: 'Step 2: Collect First Leads',
    subtitle: 'Extract business leads from Google Maps.',
    desc: 'Navigate to "Leads Collection", input a business category and city (e.g., "Solar Companies Pune"), and click search to crawl leads in real-time. 🔍',
    action: '/leads',
    actionLabel: 'Open Leads Scraper →',
    checkKey: 'onboarding_leads_done',
  },
  {
    id: 'crm',
    icon: GitPullRequestArrow,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15',
    title: 'Step 3: Manage CRM Pipeline',
    subtitle: 'Track leads using the Kanban board.',
    desc: 'Drag and drop your extracted contacts across various stages: New → Contacted → Interested → Converted. Log activities, updates, and custom reminders.',
    action: '/crm',
    actionLabel: 'Open CRM Pipeline →',
    checkKey: 'onboarding_crm_done',
  },
  {
    id: 'whatsapp',
    icon: Bell,
    iconColor: 'text-green-400',
    iconBg: 'bg-green-500/15',
    title: 'Step 4: Contact via WhatsApp',
    subtitle: 'Send personalized WhatsApp messages.',
    desc: 'Go to "WhatsApp Sender", select your scraped leads, choose a messaging template, and click to dispatch messages directly. 📱',
    action: '/whatsapp',
    actionLabel: 'Open WhatsApp Sender →',
    checkKey: 'onboarding_whatsapp_done',
  },
  {
    id: 'done',
    icon: PartyPopper,
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-500/15',
    title: 'You\'re Ready to Roll! 🚀',
    subtitle: 'Setup completed successfully.',
    desc: 'Go to your main Dashboard to monitor lead performance, pipelines, conversions, and dynamic monthly revenue stats. Good luck! 🙏',
    action: '/dashboard',
    actionLabel: 'Open Dashboard →',
  },
];

// ── main component ─────────────────────────────────────────────────────────────
const OnboardingGuide = ({ onClose }) => {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [step, setStep]         = useState(0);
  const [checked, setChecked]   = useState({});
  const [confetti, setConfetti] = useState(false);
  const [closing, setClosing]   = useState(false);

  // Load previously checked steps
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('onboarding_checked') || '{}');
    setChecked(saved);
  }, []);

  const markChecked = (key) => {
    if (!key) return;
    const updated = { ...checked, [key]: true };
    setChecked(updated);
    localStorage.setItem('onboarding_checked', JSON.stringify(updated));
  };

  const current   = STEPS[step];
  const isLast    = step === STEPS.length - 1;
  const isFirst   = step === 0;
  const progress  = Math.round((step / (STEPS.length - 1)) * 100);

  const handleNext = () => {
    if (current.checkKey) markChecked(current.checkKey);
    if (isLast) {
      setConfetti(true);
      setTimeout(() => handleClose(), 3000);
      return;
    }
    setStep((s) => s + 1);
  };

  const handleAction = () => {
    if (current.checkKey) markChecked(current.checkKey);
    if (current.action) navigate(current.action);
    handleClose();
  };

  const handleClose = () => {
    setClosing(true);
    localStorage.setItem('onboarding_completed', 'true');
    setTimeout(() => onClose(), 300);
  };

  const Icon = current.icon;

  return (
    <>
      <ConfettiCanvas active={confetti} />

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
          closing ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      >
        {/* Modal */}
        <div
          className={`relative w-full max-w-lg bg-slate-900 border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${
            closing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          {/* Top gradient bar */}
          <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500" />

          {/* Progress bar */}
          <div className="px-6 pt-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500 font-medium">
                {step === 0 ? 'Welcome' : `Step ${step} of ${STEPS.length - 2}`}
              </span>
              <span className="text-xs text-indigo-400 font-semibold">{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Icon + Title */}
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${current.iconBg}`}>
                <Icon className={`w-7 h-7 ${current.iconColor}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold font-outfit text-white leading-tight">
                  {current.title}
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">{current.subtitle}</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/40 rounded-2xl p-4 border border-slate-700/40">
              {current.desc}
            </p>

            {/* Step checklist (shown from step 1 onwards) */}
            {step > 0 && step < STEPS.length - 1 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Progress</p>
                <div className="grid gap-1.5">
                  {STEPS.slice(1, STEPS.length - 1).map((s, i) => {
                    const done = checked[s.checkKey];
                    const StepIcon = s.icon;
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all ${
                          done
                            ? 'bg-emerald-500/8 border border-emerald-500/20'
                            : i + 1 === step
                            ? 'bg-indigo-500/8 border border-indigo-500/20'
                            : 'bg-slate-800/30 border border-slate-800/60'
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <Circle className={`w-4 h-4 flex-shrink-0 ${i + 1 === step ? 'text-indigo-400' : 'text-slate-600'}`} />
                        )}
                        <StepIcon className={`w-3.5 h-3.5 flex-shrink-0 ${done ? 'text-emerald-400' : i + 1 === step ? 'text-indigo-400' : 'text-slate-600'}`} />
                        <span className={done ? 'text-emerald-300 line-through' : i + 1 === step ? 'text-slate-200 font-semibold' : 'text-slate-500'}>
                          {s.title.replace(/Step \d+: /, '')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-1">
              {!isFirst && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm hover:bg-slate-800 hover:text-slate-200 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}

              {/* Quick nav action */}
              {current.action && !isLast && (
                <button
                  onClick={handleAction}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm border border-slate-700 transition-all flex-shrink-0"
                >
                  {current.actionLabel}
                </button>
              )}

              {/* Main CTA */}
              <button
                onClick={handleNext}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex-1 ${
                  isLast
                    ? 'bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25'
                }`}
              >
                {isLast ? (
                  <><Sparkles className="w-4 h-4" /> Go to Dashboard</>
                ) : isFirst ? (
                  <>Let's Start <ChevronRight className="w-4 h-4" /></>
                ) : (
                  <>Next <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>

            {/* Skip link */}
            {!isLast && (
              <div className="text-center">
                <button
                  onClick={handleClose}
                  className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
                >
                  Skip Onboarding — I know the basics
                </button>
              </div>
            )}
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 pb-5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-5 h-1.5 bg-indigo-500'
                    : 'w-1.5 h-1.5 bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingGuide;
