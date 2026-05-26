import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { CreditCard, Check, ShieldCheck, Zap, AlertTriangle, HelpCircle, Ticket, Percent, Sparkles, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Subscription = () => {
  const { activeBusinessId } = useSelector((state) => state.auth);

  const [subscription, setSubscription] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Promo Code coupon states
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null); // { code, discountPercent, description }
  const [checkingPromo, setCheckingPromo] = useState(false);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subscriptions');
      if (res.data.success) {
        setSubscription(res.data.subscription);
        // Save packages list
        setPackages(res.data.packages || []);
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

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    try {
      setCheckingPromo(true);
      const res = await api.post('/subscriptions/validate-promo', { code: promoInput.toUpperCase().trim() });
      if (res.data.success) {
        setAppliedPromo(res.data.offer);
        toast.success(`Coupon Applied! ${res.data.offer.discountPercent}% Discount Activated`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired promo code');
      setAppliedPromo(null);
    } finally {
      setCheckingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    toast.success('Promo coupon removed');
  };

  const handleUpgradePlan = async (planName) => {
    const loadingToast = toast.loading('Opening payment order...');
    try {
      const payload = { planName };
      if (appliedPromo) {
        payload.promoCode = appliedPromo.code;
      }

      const res = await api.post('/subscriptions/order', payload);
      if (res.data.success) {
        const { orderId, amount, currency, keyId } = res.data;
        
        toast.dismiss(loadingToast);

        // Configure Razorpay checkout
        const options = {
          key: keyId,
          amount,
          currency,
          name: 'Codeitz SaaS Upgrade',
          description: `Subscribe to plan: ${planName} ${appliedPromo ? `(Promo: ${appliedPromo.code})` : ''}`,
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
                setAppliedPromo(null);
                setPromoInput('');
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
      toast.error(err.response?.data?.error || 'Billing order creation failed.');
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

  // Filter out 'Free Trial' from purchase cards to keep list clean (Free Trial is only given at registration)
  const purchasePackages = packages.filter(pkg => pkg.name !== 'Free Trial');

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

      {/* Coupon Application Box */}
      <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Ticket className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wide">Have a Promotional Promo Code?</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Enter a valid coupon below to unlock exclusive subscription discounts.</p>
          </div>
        </div>

        <form onSubmit={handleApplyPromo} className="flex gap-2 w-full md:w-auto max-w-sm shrink-0">
          <input
            type="text"
            disabled={appliedPromo !== null}
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
            placeholder={appliedPromo ? appliedPromo.code : "e.g. WELCOME20"}
            className={`px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500 w-full md:w-48 font-mono tracking-wider ${
              appliedPromo ? 'text-emerald-450 border-emerald-500/30' : ''
            }`}
          />
          {appliedPromo ? (
            <button
              type="button"
              onClick={handleRemovePromo}
              className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600/25 border border-rose-600/20 text-rose-455 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <X className="w-3.5 h-3.5" /> Remove
            </button>
          ) : (
            <button
              type="submit"
              disabled={checkingPromo}
              className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all whitespace-nowrap"
            >
              {checkingPromo ? 'Checking...' : 'Apply Coupon'}
            </button>
          )}
        </form>
      </div>

      {/* Upgrade options grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {purchasePackages.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-xs text-slate-500 bg-slate-900/20 border border-slate-850 rounded-2xl">
            No premium pricing packages loaded. Contact support.
          </div>
        ) : (
          purchasePackages.map((pkg) => {
            const originalPrice = pkg.price;
            let discountedPrice = originalPrice;
            if (appliedPromo) {
              discountedPrice = Math.max(0, Math.round(originalPrice - (originalPrice * appliedPromo.discountPercent) / 100));
            }
            
            return (
              <div key={pkg._id} className={`p-6 rounded-2xl border flex flex-col shadow-sm relative ${
                pkg.isPopular 
                  ? 'bg-gradient-to-b from-indigo-950/40 to-slate-900/60 border-indigo-500/80 shadow-lg' 
                  : 'bg-slate-900/50 border-slate-800/80'
              }`}>
                {pkg.isPopular && (
                  <span className="absolute top-[-10px] left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-indigo-600 text-white tracking-wide">
                    Popular Value
                  </span>
                )}
                
                <h3 className="text-sm font-bold text-white mb-2 font-outfit uppercase tracking-wide">{pkg.name}</h3>
                <p className="text-[11px] text-slate-500 mb-6">{pkg.description || 'Premium CRM Outbound access'}</p>
                
                <div className="mb-6">
                  {appliedPromo ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-extrabold text-emerald-450 font-outfit">₹{discountedPrice.toLocaleString()}</span>
                        <span className="text-xs text-slate-550 line-through">₹{originalPrice.toLocaleString()}</span>
                      </div>
                      <span className="text-[10px] text-emerald-450 font-bold block">
                        Applied {appliedPromo.discountPercent}% Coupon Discount!
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-3xl font-extrabold text-white font-outfit">₹{originalPrice.toLocaleString()}</span>
                      <span className="text-xs text-slate-500"> / {pkg.durationDays} days</span>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-xs text-slate-300">
                    <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> {pkg.limitLeads === 999999 ? 'Unlimited' : `${pkg.limitLeads.toLocaleString()} Leads`} scraped total
                  </li>
                  {pkg.features && pkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> {feat}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgradePlan(pkg.name)}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider font-outfit transition-all ${
                    pkg.isPopular 
                      ? 'bg-indigo-650 hover:bg-indigo-600 text-white shadow-md' 
                      : 'bg-slate-850 hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  Activate {pkg.name}
                </button>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default Subscription;
