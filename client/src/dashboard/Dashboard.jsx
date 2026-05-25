import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Compass, Users, CheckCircle, Clock, Calendar, Plus, ChevronRight, BarChart2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { activeBusinessId } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBusinessId) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [activeBusinessId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-900 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-900 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-900 rounded-2xl" />
          <div className="h-80 bg-slate-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!activeBusinessId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-slate-900/30 border border-slate-800/80 rounded-2xl animate-enter">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/10">
          <Compass className="w-8 h-8 animate-spin-slow" />
        </div>
        <h2 className="text-lg font-bold text-white font-outfit">Welcome to Codeitz CRM</h2>
        <p className="text-slate-400 text-xs max-w-sm mt-2 leading-relaxed">
          Create a new workspace or switch your business profile in the sidebar menu to retrieve B2B target scraper graphs.
        </p>
        <button
          onClick={() => navigate('/settings')}
          className="mt-6 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold uppercase tracking-wider font-outfit transition-colors"
        >
          Setup Workspace Settings
        </button>
      </div>
    );
  }

  const { widgets, charts, teamPerformance, recentActivities } = data || {};
  
  // Custom styling elements
  const COLORS = ['#6366f1', '#a78bfa', '#f43f5e', '#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6">
      
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Workspace Overview</h1>
          <p className="text-xs text-slate-500 mt-1">Review active leads and pending followups</p>
        </div>
        <button
          onClick={() => navigate('/leads')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start shadow-lg shadow-indigo-600/10 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Generate Leads</span>
        </button>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total Leads */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">Total Leads</span>
            <span className="text-2xl font-bold text-white block mt-1 font-outfit">{widgets?.totalLeads || 0}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center border border-indigo-500/10">
            <Compass className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Total Revenue */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">Total Revenue</span>
            <span className="text-2xl font-bold text-white block mt-1 font-outfit">₹{(widgets?.totalRevenue || 0).toLocaleString()}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center border border-emerald-500/10">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Conversion Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">Conversion Rate</span>
            <span className="text-2xl font-bold text-white block mt-1 font-outfit">{widgets?.conversionRate || 0}%</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-600/10 text-violet-400 flex items-center justify-center border border-violet-500/10">
            <BarChart2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Pending Follow-ups */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">Pending Reminders</span>
            <span className="text-2xl font-bold text-white block mt-1 font-outfit">{widgets?.pendingFollowUps || 0}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-600/10 text-amber-400 flex items-center justify-center border border-amber-500/10">
            <Clock className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Growth Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col shadow-sm">
          <span className="text-xs font-semibold text-slate-400 mb-4 block">Leads & Revenue Growth</span>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.growth || []}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="leads" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorLeads)" name="Leads" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col shadow-sm">
          <span className="text-xs font-semibold text-slate-400 mb-4 block">Lead pipeline breakdown</span>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.statusDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(charts?.statusDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-4">
            {(charts?.statusDistribution || []).map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span>{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Feed & Team section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Timeline activity log */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400">Recent CRM Activities</span>
            <button onClick={() => navigate('/crm')} className="text-[10px] text-indigo-400 flex items-center gap-0.5 hover:underline">
              Timeline Board <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
            {recentActivities?.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No recent activity logged.
              </div>
            ) : (
              recentActivities?.map((act) => (
                <div key={act._id} className="flex gap-3 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-slate-200">
                      <b className="text-slate-400 font-semibold">{act.user?.name || 'Someone'}</b> logged {act.type.toLowerCase()} for{' '}
                      <span className="text-indigo-300 font-medium">{act.lead?.name || 'Lead'}</span>
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{act.description}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 flex-shrink-0">
                    {new Date(act.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Team Performance leaderboard */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400">Team Lead Generation Leaderboard</span>
            <button onClick={() => navigate('/team')} className="text-[10px] text-indigo-400 flex items-center gap-0.5 hover:underline">
              Manage Staff <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {teamPerformance?.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No active performance records.
              </div>
            ) : (
              teamPerformance?.map((tm, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/40">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-400 w-4">#{idx + 1}</span>
                    <span className="text-xs font-semibold text-slate-200">{tm.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{tm.leadsCollected} leads</span>
                    <div className="w-20 bg-slate-800 rounded-full h-1.5 hidden sm:block">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(100, (tm.leadsCollected / (widgets?.totalLeads || 10)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
