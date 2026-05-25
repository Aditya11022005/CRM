import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Users, UserPlus, Shield, Check, Trash2, Eye, Lock } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Team = () => {
  const { activeBusinessId } = useSelector((state) => state.auth);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);

  // Invite states
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Employee');
  
  // page permission checkboxes
  const [permissions, setPermissions] = useState({
    leads: true,
    crm: true,
    quotes: true,
    invoices: true,
    analytics: true,
  });

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await api.get('/team');
      if (res.data.success) {
        setMembers(res.data.members);
      }
    } catch (err) {
      toast.error('Failed to load team workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBusinessId) {
      fetchTeam();
    }
  }, [activeBusinessId]);

  const handlePermissionToggle = (key) => {
    setPermissions({ ...permissions, [key]: !permissions[key] });
  };

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Enter team member email address');

    const loadingToast = toast.loading('Sending team invitation...');
    try {
      const res = await api.post('/team', {
        email,
        role,
        permissions,
      });

      if (res.data.success) {
        toast.dismiss(loadingToast);
        toast.success(res.data.message);
        setEmail('');
        setShowInviteForm(false);
        fetchTeam();
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.error || 'Failed to add team member');
    }
  };

  const handleRemoveMember = async (id) => {
    const confirm = window.confirm('Are you sure you want to remove this member from the workspace?');
    if (!confirm) return;

    try {
      const res = await api.delete(`/team/${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchTeam();
      }
    } catch (err) {
      toast.error('Failed to remove team member');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Team Workspace Management</h1>
          <p className="text-xs text-slate-500 mt-1">Manage team members, roles, and granular page access permissions</p>
        </div>
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Invite Member form */}
      {showInviteForm && (
        <form onSubmit={handleAddMemberSubmit} className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4 animate-enter">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-4.5 h-4.5 text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Invite Team Member</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Email Address</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Workspace Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-350 focus:outline-none focus:border-indigo-500"
              >
                <option value="Manager">Manager (Can invite & edit)</option>
                <option value="Employee">Employee (Restricted views)</option>
              </select>
            </div>
          </div>

          {/* Granular Permission Toggles */}
          <div className="space-y-2.5 pt-2">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Granular Page Permissions</span>
            
            <div className="flex flex-wrap gap-3">
              {Object.keys(permissions).map((key) => (
                <div
                  key={key}
                  onClick={() => handlePermissionToggle(key)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-all flex items-center gap-1.5 ${
                    permissions[key]
                      ? 'bg-indigo-600/10 border-indigo-500/35 text-indigo-400'
                      : 'bg-slate-950 border-slate-850 text-slate-500'
                  }`}
                >
                  {permissions[key] && <Check className="w-3.5 h-3.5" />}
                  <span className="capitalize">{key}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold uppercase tracking-wider font-outfit"
          >
            Add Team Member
          </button>
        </form>
      )}

      {/* Team list table */}
      <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col shadow-sm">
        <span className="text-xs font-bold text-slate-400 mb-4 block uppercase tracking-wide">Workspace Team Registry</span>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-bold">User</th>
                <th className="py-3 px-4 font-bold">Email</th>
                <th className="py-3 px-4 font-bold">Role</th>
                <th className="py-3 px-4 font-bold">Page Permissions</th>
                <th className="py-3 px-4 font-bold text-center">Remove</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500 font-semibold">
                    Loading team directory...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500 font-semibold">
                    No invited team members. Set up invitations above!
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m._id} className="border-b border-slate-800/30 hover:bg-slate-900/10 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-200">{m.user?.name || 'Pending Onboarding'}</td>
                    <td className="py-3.5 px-4 text-slate-400">{m.email}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-indigo-400 capitalize">
                        {m.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(m.permissions || {}).map(([key, val]) => (
                          <span
                            key={key}
                            className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${
                              val ? 'bg-indigo-600/10 text-indigo-300' : 'bg-slate-950 text-slate-600'
                            }`}
                          >
                            {key}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleRemoveMember(m._id)}
                        className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Team;
