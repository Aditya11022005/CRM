import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Landmark,
  CreditCard,
  ShieldCheck,
  Ban,
  Sparkles,
  CheckSquare,
  Plus,
  Edit,
  Trash2,
  Megaphone,
  Ticket,
  Percent,
  Calendar,
  Check,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [planDistribution, setPlanDistribution] = useState([]);

  // Dynamic CRUD states
  const [packages, setPackages] = useState([]);
  const [offers, setOffers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Active view: stats, packages, offers, announcements, users, businesses, payments
  const [activeTab, setActiveTab] = useState('stats');

  // Form Modals states
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    price: '',
    durationDays: '',
    limitLeads: '',
    description: '',
    features: '',
    isPopular: false,
    isActive: true
  });

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerForm, setOfferForm] = useState({
    code: '',
    discountPercent: '',
    description: '',
    isActive: true,
    expiresAt: ''
  });

  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annForm, setAnnForm] = useState({
    message: '',
    type: 'info',
    isActive: true
  });

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const statsRes = await api.get('/admin/stats');
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
        setPayments(statsRes.data.recentPayments || []);
        setBusinesses(statsRes.data.pendingBusinesses || []);
        setRevenueTrend(statsRes.data.revenueTrend || []);
        setPlanDistribution(statsRes.data.planDistribution || []);
      }

      // Fetch dynamic collections
      const [usersRes, busRes, pkgRes, offerRes, annRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/businesses'),
        api.get('/admin/packages'),
        api.get('/admin/offers'),
        api.get('/admin/announcements')
      ]);

      if (usersRes.data.success) setUsers(usersRes.data.users);
      if (busRes.data.success) setBusinesses(busRes.data.businesses);
      if (pkgRes.data.success) setPackages(pkgRes.data.packages);
      if (offerRes.data.success) setOffers(offerRes.data.offers);
      if (annRes.data.success) setAnnouncements(annRes.data.announcements);

    } catch (err) {
      toast.error('Failed to load Super Admin controls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const handleToggleBlock = async (userId) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/block`);
      if (res.data.success) {
        toast.success(res.data.message);
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, status: u.status === 'active' ? 'blocked' : 'active' } : u))
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to toggle block status');
    }
  };

  const handleToggleApprove = async (busId) => {
    try {
      const res = await api.patch(`/admin/businesses/${busId}/approve`);
      if (res.data.success) {
        toast.success(res.data.message);
        setBusinesses((prev) =>
          prev.map((b) => (b._id === busId ? { ...b, isApproved: !b.isApproved } : b))
        );
      }
    } catch (err) {
      toast.error('Failed to update business approval status');
    }
  };

  // ================= PACKAGE ACTIONS =================

  const openAddPackage = () => {
    setEditingPackage(null);
    setPackageForm({
      name: '',
      price: '',
      durationDays: '',
      limitLeads: '',
      description: '',
      features: '',
      isPopular: false,
      isActive: true
    });
    setShowPackageModal(true);
  };

  const openEditPackage = (pkg) => {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name,
      price: pkg.price,
      durationDays: pkg.durationDays,
      limitLeads: pkg.limitLeads,
      description: pkg.description || '',
      features: pkg.features ? pkg.features.join(', ') : '',
      isPopular: pkg.isPopular,
      isActive: pkg.isActive
    });
    setShowPackageModal(true);
  };

  const handlePackageSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...packageForm,
      price: Number(packageForm.price),
      durationDays: Number(packageForm.durationDays),
      limitLeads: Number(packageForm.limitLeads),
      features: packageForm.features.split(',').map(f => f.trim()).filter(f => f.length > 0)
    };

    try {
      if (editingPackage) {
        const res = await api.put(`/admin/packages/${editingPackage._id}`, payload);
        if (res.data.success) {
          toast.success('Package updated successfully');
          setPackages(prev => prev.map(p => p._id === editingPackage._id ? res.data.package : p));
        }
      } else {
        const res = await api.post('/admin/packages', payload);
        if (res.data.success) {
          toast.success('Package created successfully');
          setPackages(prev => [...prev, res.data.package]);
        }
      }
      setShowPackageModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save package');
    }
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscription package?')) return;
    try {
      const res = await api.delete(`/admin/packages/${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        setPackages(prev => prev.filter(p => p._id !== id));
      }
    } catch (err) {
      toast.error('Failed to delete package');
    }
  };

  // ================= OFFERS ACTIONS =================

  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/offers', {
        ...offerForm,
        discountPercent: Number(offerForm.discountPercent)
      });
      if (res.data.success) {
        toast.success('Coupon offer code created successfully');
        setOffers(prev => [res.data.offer, ...prev]);
        setShowOfferModal(false);
        setOfferForm({ code: '', discountPercent: '', description: '', isActive: true, expiresAt: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create promo offer');
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promo coupon?')) return;
    try {
      const res = await api.delete(`/admin/offers/${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        setOffers(prev => prev.filter(o => o._id !== id));
      }
    } catch (err) {
      toast.error('Failed to delete promo coupon');
    }
  };

  const handleToggleOfferActive = async (offer) => {
    try {
      const res = await api.put(`/admin/offers/${offer._id}`, { isActive: !offer.isActive });
      if (res.data.success) {
        toast.success(`Coupon set to ${!offer.isActive ? 'Active' : 'Inactive'}`);
        setOffers(prev => prev.map(o => o._id === offer._id ? res.data.offer : o));
      }
    } catch (err) {
      toast.error('Failed to update promo status');
    }
  };

  // ================= ANNOUNCEMENT ACTIONS =================

  const handleAnnSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/announcements', annForm);
      if (res.data.success) {
        toast.success('Broadcast live!');
        setAnnouncements(prev => [res.data.announcement, ...prev]);
        setShowAnnModal(false);
        setAnnForm({ message: '', type: 'info', isActive: true });
      }
    } catch (err) {
      toast.error('Failed to broadcast announcement');
    }
  };

  const handleToggleAnnActive = async (ann) => {
    try {
      const res = await api.patch(`/admin/announcements/${ann._id}/toggle`);
      if (res.data.success) {
        toast.success(res.data.message);
        setAnnouncements(prev => prev.map(a => a._id === ann._id ? res.data.announcement : a));
      }
    } catch (err) {
      toast.error('Failed to toggle status');
    }
  };

  const handleDeleteAnn = async (id) => {
    if (!window.confirm('Delete this broadcast?')) return;
    try {
      const res = await api.delete(`/admin/announcements/${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        setAnnouncements(prev => prev.filter(a => a._id !== id));
      }
    } catch (err) {
      toast.error('Failed to delete announcement');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-900 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-slate-900 rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-900 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-500" />
            Super Admin Control Room
          </h1>
          <p className="text-xs text-slate-500 mt-1">Audit platform revenue, configure SaaS subscription packages, distribute promo codes, and broadcast live alerts</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'packages' && (
            <button
              onClick={openAddPackage}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/10"
            >
              <Plus className="w-4 h-4" /> Add Package
            </button>
          )}
          {activeTab === 'offers' && (
            <button
              onClick={() => setShowOfferModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/10"
            >
              <Plus className="w-4 h-4" /> Add Promo Code
            </button>
          )}
          {activeTab === 'announcements' && (
            <button
              onClick={() => setShowAnnModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/10"
            >
              <Plus className="w-4 h-4" /> Send Announcement
            </button>
          )}
        </div>
      </div>

      {/* Tabs selectors */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-800/60 pb-1 scrollbar-none">
        {[
          { id: 'stats', label: 'Dashboard Stats' },
          { id: 'packages', label: 'SaaS Packages' },
          { id: 'offers', label: 'Offers & Coupons' },
          { id: 'announcements', label: 'System Broadcasts' },
          { id: 'users', label: 'User Directory' },
          { id: 'businesses', label: 'Workspaces (Tenants)' },
          { id: 'payments', label: 'Payments Log' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-indigo-400 border-b-2 border-indigo-500 font-bold'
                : 'text-slate-500 hover:text-slate-350'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Dashboard Stats */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Key Metrics cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            
            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Total Users</span>
                <span className="text-xl font-bold text-white mt-1 block font-outfit">{stats?.totalUsers || 0}</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Users className="w-4.5 h-4.5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Registered Companies</span>
                <span className="text-xl font-bold text-white mt-1 block font-outfit">{stats?.totalBusinesses || 0}</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Landmark className="w-4.5 h-4.5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Active Subscriptions</span>
                <span className="text-xl font-bold text-white mt-1 block font-outfit">{stats?.activeSubscriptions || 0}</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Payments Complete</span>
                <span className="text-xl font-bold text-white mt-1 block font-outfit">{stats?.totalPayments || 0}</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <CheckSquare className="w-4.5 h-4.5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-indigo-400 block uppercase font-bold tracking-wider">Platform Revenue</span>
                <span className="text-xl font-extrabold text-white mt-1 block font-outfit">₹{(stats?.platformRevenue || 0).toLocaleString()}</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-white flex items-center justify-center">
                <CreditCard className="w-4.5 h-4.5" />
              </div>
            </div>

          </div>

          {/* Interactive Charts Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend Area Chart */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Revenue Growth Trend</h3>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Aggregated monthly transactions (INR)</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                  <TrendingUp className="w-3.5 h-3.5" /> Platform Scale
                </div>
              </div>
              
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '11px' }}
                      itemStyle={{ color: '#818cf8', fontSize: '11px' }}
                      formatter={(value) => [`₹${value}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Plan Distribution Pie Chart */}
            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">SaaS Tier Distribution</h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {planDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff', fontSize: '11px' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Quick approvals section */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <span className="text-xs font-bold text-slate-400 mb-4 block uppercase tracking-wide">Workspace Approval Actions</span>
            
            <div className="space-y-3">
              {businesses.filter(b => !b.isApproved).length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  All registered workspaces are activated and healthy.
                </div>
              ) : (
                businesses.filter(b => !b.isApproved).map(b => (
                  <div key={b._id} className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-850">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">{b.name}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Owner: {b.owner?.name || 'N/A'} ({b.owner?.email})</span>
                    </div>
                    <button
                      onClick={() => handleToggleApprove(b._id)}
                      className="px-3 py-1 bg-emerald-600/10 hover:bg-emerald-650/20 text-emerald-400 border border-emerald-600/25 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                    >
                      Approve Workspace
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Packages Management */}
      {activeTab === 'packages' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-enter">
          {packages.map((pkg) => (
            <div key={pkg._id} className={`p-6 rounded-2xl border flex flex-col justify-between shadow-sm relative ${
              pkg.isPopular ? 'bg-gradient-to-b from-indigo-950/20 to-slate-900/60 border-indigo-500/60' : 'bg-slate-900/50 border-slate-800/80'
            }`}>
              {pkg.isPopular && (
                <span className="absolute top-[-10px] right-4 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-indigo-600 text-white tracking-wide">
                  Popular Plan
                </span>
              )}
              
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-white font-outfit uppercase tracking-wide">{pkg.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-1">{pkg.description || 'Custom SaaS Package'}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    pkg.isActive ? 'bg-emerald-600/10 text-emerald-400' : 'bg-rose-600/10 text-rose-400'
                  }`}>
                    {pkg.isActive ? 'Active' : 'Draft'}
                  </span>
                </div>

                <div className="my-6">
                  <span className="text-3xl font-extrabold text-white font-outfit">₹{pkg.price}</span>
                  <span className="text-xs text-slate-500"> / {pkg.durationDays} days</span>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs border-b border-slate-800/40 pb-1.5">
                    <span className="text-slate-400">Lead Scrape Limit:</span>
                    <span className="font-semibold text-white">{pkg.limitLeads === 999999 ? 'Unlimited' : pkg.limitLeads.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-slate-800/40 pb-1.5">
                    <span className="text-slate-400">Duration Period:</span>
                    <span className="font-semibold text-white">{pkg.durationDays} Days</span>
                  </div>
                </div>

                {pkg.features && pkg.features.length > 0 && (
                  <div className="space-y-2 mb-8">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Included Features</span>
                    <ul className="space-y-1.5">
                      {pkg.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-2 border-t border-slate-850 pt-4 mt-auto">
                <button
                  onClick={() => openEditPackage(pkg)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDeletePackage(pkg._id)}
                  className="px-3 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-600/20 rounded-xl transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Offers / Discount Codes */}
      {activeTab === 'offers' && (
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col shadow-sm animate-enter">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold">Promo Coupon Code</th>
                  <th className="py-3 px-4 font-bold">Discount Percentage</th>
                  <th className="py-3 px-4 font-bold">Details Description</th>
                  <th className="py-3 px-4 font-bold">Expiry Deadline</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-center">Toggle / Delete</th>
                </tr>
              </thead>
              <tbody>
                {offers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500">
                      No active promo codes configured. Click "Add Promo Code" to get started.
                    </td>
                  </tr>
                ) : (
                  offers.map((offer) => (
                    <tr key={offer._id} className="border-b border-slate-800/30 hover:bg-slate-900/10">
                      <td className="py-3.5 px-4 font-mono font-bold text-white tracking-wider flex items-center gap-1.5">
                        <Ticket className="w-3.5 h-3.5 text-indigo-400" /> {offer.code}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-400 flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5" /> {offer.discountPercent}% OFF
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{offer.description || 'Promotional Discount'}</td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {offer.expiresAt ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-550" /> {new Date(offer.expiresAt).toLocaleDateString()}
                          </span>
                        ) : 'Never Expires'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          offer.isActive ? 'bg-emerald-600/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {offer.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleToggleOfferActive(offer)}
                            className="text-slate-450 hover:text-indigo-400 transition-colors"
                          >
                            {offer.isActive ? <ToggleRight className="w-6 h-6 text-indigo-450" /> : <ToggleLeft className="w-6 h-6 text-slate-650" />}
                          </button>
                          <button
                            onClick={() => handleDeleteOffer(offer._id)}
                            className="text-rose-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: System Announcements */}
      {activeTab === 'announcements' && (
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col shadow-sm animate-enter">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold">Broadcast Message</th>
                  <th className="py-3 px-4 font-bold">Banner Type</th>
                  <th className="py-3 px-4 font-bold">Date Created</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-center">Toggle / Delete</th>
                </tr>
              </thead>
              <tbody>
                {announcements.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-500">
                      No global announcements created. Broadcast info to all users with "Send Announcement".
                    </td>
                  </tr>
                ) : (
                  announcements.map((ann) => (
                    <tr key={ann._id} className="border-b border-slate-800/30">
                      <td className="py-3.5 px-4 text-slate-200 font-medium flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-indigo-400 shrink-0" />
                        {ann.message}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${
                          ann.type === 'danger' ? 'bg-rose-500/10 text-rose-450 border border-rose-500/20' :
                          ann.type === 'warning' ? 'bg-amber-500/10 text-amber-455 border border-amber-500/20' :
                          ann.type === 'success' ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20' :
                          'bg-indigo-500/10 text-indigo-450 border border-indigo-500/20'
                        }`}>
                          {ann.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-550">{new Date(ann.createdAt).toLocaleString()}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          ann.isActive ? 'bg-emerald-600/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {ann.isActive ? 'Live' : 'Archived'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleToggleAnnActive(ann)}
                            className="text-slate-450 hover:text-indigo-400 transition-colors"
                          >
                            {ann.isActive ? <ToggleRight className="w-6 h-6 text-indigo-450" /> : <ToggleLeft className="w-6 h-6 text-slate-650" />}
                          </button>
                          <button
                            onClick={() => handleDeleteAnn(ann._id)}
                            className="text-rose-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Users */}
      {activeTab === 'users' && (
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col shadow-sm animate-enter">
          <span className="text-xs font-bold text-slate-400 mb-4 block uppercase tracking-wide">Registered Accounts Directory</span>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold">User Name</th>
                  <th className="py-3 px-4 font-bold">Email</th>
                  <th className="py-3 px-4 font-bold">Global Role</th>
                  <th className="py-3 px-4 font-bold text-center">Block status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-slate-800/30 hover:bg-slate-900/10">
                    <td className="py-3.5 px-4 font-semibold text-slate-200">{u.name}</td>
                    <td className="py-3.5 px-4 text-slate-400">{u.email}</td>
                    <td className="py-3.5 px-4 capitalize font-medium text-indigo-400">{u.role}</td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleBlock(u._id)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          u.status === 'active'
                            ? 'border-emerald-600/20 text-emerald-400 hover:bg-rose-500/10 hover:text-rose-400'
                            : 'border-rose-600/20 text-rose-400 hover:bg-emerald-500/10 hover:text-emerald-400'
                        }`}
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Businesses */}
      {activeTab === 'businesses' && (
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col shadow-sm animate-enter">
          <span className="text-xs font-bold text-slate-400 mb-4 block uppercase tracking-wide">Workspace Tenants Registry</span>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold">Business Name</th>
                  <th className="py-3 px-4 font-bold">Owner Email</th>
                  <th className="py-3 px-4 font-bold">Active Status</th>
                  <th className="py-3 px-4 font-bold text-center">Approval status</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => (
                  <tr key={b._id} className="border-b border-slate-800/30 hover:bg-slate-900/10">
                    <td className="py-3.5 px-4 font-semibold text-slate-200">{b.name}</td>
                    <td className="py-3.5 px-4 text-slate-400">{b.owner?.email || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        b.isApproved ? 'bg-emerald-600/10 text-emerald-400' : 'bg-rose-600/10 text-rose-400'
                      }`}>
                        {b.isApproved ? 'Approved' : 'Pending Approval'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleApprove(b._id)}
                        className={`px-3 py-1 rounded-lg border text-[9px] font-bold uppercase transition-colors ${
                          b.isApproved
                            ? 'border-rose-500/20 text-rose-400 hover:bg-rose-500/10'
                            : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                      >
                        {b.isApproved ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Payments */}
      {activeTab === 'payments' && (
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col shadow-sm animate-enter">
          <span className="text-xs font-bold text-slate-400 mb-4 block uppercase tracking-wide">Platform Billing Logs</span>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold">Transaction ID</th>
                  <th className="py-3 px-4 font-bold">Workspace</th>
                  <th className="py-3 px-4 font-bold">Tier Plan</th>
                  <th className="py-3 px-4 font-bold">Coupon Code</th>
                  <th className="py-3 px-4 font-bold">Amount Paid</th>
                  <th className="py-3 px-4 font-bold">Date</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">
                      No platform billing actions logged.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p._id} className="border-b border-slate-800/30">
                      <td className="py-3.5 px-4 font-mono text-slate-400">{p.razorpayPaymentId || 'pay_mock'}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200">{p.business?.name || 'Workspace'}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-350">{p.plan}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-indigo-400">{p.promoApplied || '-'}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-200">₹{p.amount}</td>
                      <td className="py-3.5 px-4 text-slate-500">{new Date(p.date || p.createdAt).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600/10 text-emerald-400">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL: PACKAGES CRUD ================= */}
      {showPackageModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-enter">
            <div className="flex justify-between items-center p-5 border-b border-slate-850">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-outfit">
                {editingPackage ? `Edit SaaS Package: ${editingPackage.name}` : 'Create New Pricing Package'}
              </h3>
              <button
                onClick={() => setShowPackageModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handlePackageSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={packageForm.name}
                    onChange={(e) => setPackageForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Starter, Premium"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Price (INR)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={packageForm.price}
                    onChange={(e) => setPackageForm(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. 499"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={packageForm.durationDays}
                    onChange={(e) => setPackageForm(prev => ({ ...prev, durationDays: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. 30, 365"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Lead Scrape Limit</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={packageForm.limitLeads}
                    onChange={(e) => setPackageForm(prev => ({ ...prev, limitLeads: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. 1000"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Description</label>
                <input
                  type="text"
                  value={packageForm.description}
                  onChange={(e) => setPackageForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Short description of this tier"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Features (Comma separated)</label>
                <textarea
                  value={packageForm.features}
                  onChange={(e) => setPackageForm(prev => ({ ...prev, features: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 h-20"
                  placeholder="e.g. 1000 Leads, Live Tracking, Premium Support"
                />
              </div>

              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-350 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={packageForm.isPopular}
                    onChange={(e) => setPackageForm(prev => ({ ...prev, isPopular: e.target.checked }))}
                    className="rounded border-slate-850 bg-slate-950 text-indigo-500 focus:ring-0 w-4 h-4"
                  />
                  Highlight Popular Tag
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-350 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={packageForm.isActive}
                    onChange={(e) => setPackageForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-slate-850 bg-slate-950 text-indigo-500 focus:ring-0 w-4 h-4"
                  />
                  Publish Immediately (Active)
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-850 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowPackageModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-650/10"
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: OFFER PROMO CODE ================= */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-enter">
            <div className="flex justify-between items-center p-5 border-b border-slate-850">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-outfit">
                Add Coupon Code Promo Offer
              </h3>
              <button
                onClick={() => setShowOfferModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleOfferSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={offerForm.code}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono tracking-widest"
                    placeholder="e.g. MATCH50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Discount %</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={offerForm.discountPercent}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, discountPercent: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. 20"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Description</label>
                <input
                  type="text"
                  required
                  value={offerForm.description}
                  onChange={(e) => setOfferForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Get 20% off on first upgrade"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={offerForm.expiresAt}
                  onChange={(e) => setOfferForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-850 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  Create Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: BROADCAST ANNOUNCEMENT ================= */}
      {showAnnModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-enter">
            <div className="flex justify-between items-center p-5 border-b border-slate-850">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-outfit">
                Broadcast System Announcement
              </h3>
              <button
                onClick={() => setShowAnnModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAnnSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Banner Type (Alert Theme)</label>
                <select
                  value={annForm.type}
                  onChange={(e) => setAnnForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="info">Info (Blue)</option>
                  <option value="success">Success (Green)</option>
                  <option value="warning">Warning (Orange)</option>
                  <option value="danger">Danger (Red)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Broadcast Message</label>
                <textarea
                  required
                  value={annForm.message}
                  onChange={(e) => setAnnForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 h-28"
                  placeholder="Write message to display as announcement banner for all users..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-850 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAnnModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  Go Live (Broadcast)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Admin;
