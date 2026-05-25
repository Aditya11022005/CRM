import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { CreditCard, Check, ShieldCheck, Zap, AlertTriangle, HelpCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Subscription = () => {
  const { activeBusinessId } = useSelector((state) => state.auth);

  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subscriptions');
      if (res.data.success) {
        setSubscription(res.data.subscription);
        setPlans(res.data.plans);
      }
    } catch (err) {
      toast.error('Failed to load subscription status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBusinessId) {
      fetchSubscription();
    }
  }, [activeBusinessId]);

  const handleUpgradePlan = async (planName) => {
    const loadingToast = toast.loading('Opening payment order...');
    try {
      const res = await api.post('/subscriptions/order', { planName });
      if (res.data.success) {
        const { orderId, amount, currency, keyId } = res.data;
        
        toast.dismiss(loadingToast);

        // Configure checkout
        const options = {
          key: keyId,
          amount,
          currency,
          name: 'Codeitz SaaS Upgrade',
          description: `Subscribe to plan: ${planName}`,
          order_id: orderId,
          handler: async (response) => {
            const verifyToast = toast.loading('Activating subscription tier...');
            try {
              const verifyRes = await api.post('/subscriptions/verify', {
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              });

              if (verifyRes.data.success) {
                toast.dismiss(verifyToast);
                toast.success(verifyRes.data.message);
                fetchSubscription();
              }
            } catch (err) {
              toast.dismiss(verifyToast);
              toast.error('Subscription verification failed.');
            }
          },
          prefill: {
            name: 'Workspace Owner',
          },
          theme: {
            color: '#6366f1',
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Billing order creation failed.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-900 rounded-lg" />
        <div className="h-32 bg-slate-900 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-slate-900 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white font-outfit">SaaS Billing Portal</h1>
        <p className="text-xs text-slate-500 mt-1">Upgrade subscription plans, review leads collection limits, and inspect active invoices</p>
      </div>

      {/* Active Subscription Status Banner */}
      {subscription && (
        <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm ${
          subscription.status === 'Active'
            ? 'bg-emerald-600/10 border-emerald-500/25 text-emerald-300'
            : 'bg-indigo-600/10 border-indigo-500/25 text-indigo-300'
        }`}>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-950/40 rounded-xl text-white">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider">Active Subscription</h3>
              <p className="text-2xl font-extrabold font-outfit text-white mt-1 capitalize">{subscription.plan} Plan</p>
              <div className="text-[10px] text-slate-400 mt-1 flex flex-wrap gap-x-4">
                <span>Status: <b>{subscription.status}</b></span>
                <span>Renewal Date: <b>{new Date(subscription.endDate).toLocaleDateString()}</b></span>
                <span>Monthly Scrape Limit: <b>{subscription.limitLeads === 999999 ? 'Unlimited' : `${subscription.limitLeads} Leads`}</b></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950 text-xs font-bold text-slate-200 self-start sm:self-center">
            <CreditCard className="w-3.5 h-3.5 text-indigo-400" /> Active Workspace
          </div>
        </div>
      )}

      {/* Upgrade options grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Monthly Plan */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col shadow-sm relative">
          <h3 className="text-sm font-bold text-white mb-2 font-outfit">Monthly Tier</h3>
          <p className="text-[11px] text-slate-500 mb-6">Best for growing teams and active freelancers.</p>
          
          <div className="mb-6">
            <span className="text-3xl font-bold text-white font-outfit">₹299</span>
            <span className="text-xs text-slate-500"> / month</span>
          </div>

          <ul className="space-y-3 mb-8 flex-1">
            <li className="flex items-center gap-2 text-xs text-slate-300">
              <Check className="w-3.5 h-3.5 text-indigo-400" /> 1,000 Scraped Leads / month
            </li>
            <li className="flex items-center gap-2 text-xs text-slate-300">
              <Check className="w-3.5 h-3.5 text-indigo-400" /> Real-time Scraper logs console
            </li>
            <li className="flex items-center gap-2 text-xs text-slate-300">
              <Check className="w-3.5 h-3.5 text-indigo-400" /> Invoices & Quote tools
            </li>
          </ul>

          <button
            onClick={() => handleUpgradePlan('Monthly')}
            className="w-full py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold uppercase tracking-wider font-outfit transition-all"
          >
            Upgrade Monthly
          </button>
        </div>

        {/* 6 Months Plan */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-indigo-950/40 to-slate-900/60 border border-indigo-500/80 flex flex-col shadow-lg relative">
          <span className="absolute top-[-10px] left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-indigo-600 text-white tracking-wide">
            Popular Value
          </span>
          <h3 className="text-sm font-bold text-white mb-2 font-outfit">Semi-Annual Deal</h3>
          <p className="text-[11px] text-slate-500 mb-6">Perfect for agencies running medium outbound workflows.</p>
          
          <div className="mb-6">
            <span className="text-3xl font-bold text-white font-outfit">₹3,000</span>
            <span className="text-xs text-slate-500"> / 6 Months</span>
          </div>

          <ul className="space-y-3 mb-8 flex-1">
            <li className="flex items-center gap-2 text-xs text-slate-300">
              <Check className="w-3.5 h-3.5 text-indigo-400" /> 8,000 Scraped Leads / month
            </li>
            <li className="flex items-center gap-2 text-xs text-slate-300">
              <Check className="w-3.5 h-3.5 text-indigo-400" /> Custom theme workspace colors
            </li>
            <li className="flex items-center gap-2 text-xs text-slate-300">
              <Check className="w-3.5 h-3.5 text-indigo-400" /> Multi-Workspace switching
            </li>
          </ul>

          <button
            onClick={() => handleUpgradePlan('6 Month')}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold uppercase tracking-wider font-outfit transition-all shadow-md"
          >
            Activate 6 Months
          </button>
        </div>

        {/* Yearly Plan */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col shadow-sm relative">
          <h3 className="text-sm font-bold text-white mb-2 font-outfit">Yearly Enterprise</h3>
          <p className="text-[11px] text-slate-500 mb-6">Ultimate package for unlimited maps crawling actions.</p>
          
          <div className="mb-6">
            <span className="text-3xl font-bold text-white font-outfit">₹5,000</span>
            <span className="text-xs text-slate-500"> / Year</span>
          </div>

          <ul className="space-y-3 mb-8 flex-1">
            <li className="flex items-center gap-2 text-xs text-slate-300">
              <Check className="w-3.5 h-3.5 text-indigo-400" /> Unlimited Leads generation
            </li>
            <li className="flex items-center gap-2 text-xs text-slate-300">
              <Check className="w-3.5 h-3.5 text-indigo-400" /> Priority Puppeteer sandbox slots
            </li>
            <li className="flex items-center gap-2 text-xs text-slate-300">
              <Check className="w-3.5 h-3.5 text-indigo-400" /> Full White-label logo assets support
            </li>
          </ul>

          <button
            onClick={() => handleUpgradePlan('Yearly')}
            className="w-full py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold uppercase tracking-wider font-outfit transition-all"
          >
            Upgrade Yearly
          </button>
        </div>

      </div>

    </div>
  );
};

export default Subscription;
