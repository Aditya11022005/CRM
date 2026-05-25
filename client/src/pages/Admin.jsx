import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, Landmark, CreditCard, ShieldCheck, Ban, Sparkles, CheckSquare } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [businesses, setBusinesses] = useState([]);

  // Active view: stats, users, businesses, payments
  const [activeTab, setActiveTab] = useState('stats');

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const statsRes = await api.get('/admin/stats');
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
        setPayments(statsRes.data.recentPayments);
        setBusinesses(statsRes.data.pendingBusinesses);
      }

      // Fetch users
      const usersRes = await api.get('/admin/users');
      if (usersRes.data.success) {
        setUsers(usersRes.data.users);
      }

      // Fetch all businesses
      const busRes = await api.get('/admin/businesses');
      if (busRes.data.success) {
        setBusinesses(busRes.data.businesses);
      }

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
        // Refresh users list
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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-900 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-900 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white font-outfit">Super Admin Control Room</h1>
        <p className="text-xs text-slate-500 mt-1">Audit platform revenue, lock/unlock accounts, and approve registered business tenants</p>
      </div>

      {/* Tabs selectors */}
      <div className="flex gap-2 border-b border-slate-800/60 pb-1">
        {['stats', 'users', 'businesses', 'payments'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === tab
                ? 'text-indigo-400 border-b-2 border-indigo-500 font-bold'
                : 'text-slate-500 hover:text-slate-350'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Admin metric summaries */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            
            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Total Users</span>
                <span className="text-xl font-bold text-white mt-1 block font-outfit">{stats?.totalUsers || 0}</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Users className="w-4.5 h-4.5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Registered Companies</span>
                <span className="text-xl font-bold text-white mt-1 block font-outfit">{stats?.totalBusinesses || 0}</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Landmark className="w-4.5 h-4.5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Active Subscriptions</span>
                <span className="text-xl font-bold text-white mt-1 block font-outfit">{stats?.activeSubscriptions || 0}</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Payments Complete</span>
                <span className="text-xl font-bold text-white mt-1 block font-outfit">{stats?.totalPayments || 0}</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <CheckSquare className="w-4.5 h-4.5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-indigo-400 block uppercase font-bold tracking-wider">Platform Revenue</span>
                <span className="text-xl font-extrabold text-white mt-1 block font-outfit">₹{(stats?.platformRevenue || 0).toLocaleString()}</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-white flex items-center justify-center">
                <CreditCard className="w-4.5 h-4.5" />
              </div>
            </div>

          </div>

          {/* Quick approvals banner */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <span className="text-xs font-bold text-slate-400 mb-4 block uppercase tracking-wide">Workspace Activation Requests</span>
            
            <div className="space-y-3">
              {businesses.filter(b => !b.isApproved).length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-550">
                  All registered workspaces are activated and clean.
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

      {/* Tab: Users */}
      {activeTab === 'users' && (
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col shadow-sm">
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
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col shadow-sm">
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
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col shadow-sm">
          <span className="text-xs font-bold text-slate-400 mb-4 block uppercase tracking-wide">Platform Billing Logs</span>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold">Transaction ID</th>
                  <th className="py-3 px-4 font-bold">Workspace</th>
                  <th className="py-3 px-4 font-bold">Tier Plan</th>
                  <th className="py-3 px-4 font-bold">Amount Paid</th>
                  <th className="py-3 px-4 font-bold">Date</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500">
                      No platform billing actions logged.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p._id} className="border-b border-slate-800/30">
                      <td className="py-3.5 px-4 font-mono text-slate-400">{p.razorpayPaymentId || 'pay_mock'}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200">{p.business?.name || 'Workspace'}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-350">{p.plan || 'Monthly'}</td>
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

    </div>
  );
};

export default Admin;
