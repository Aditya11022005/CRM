import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Building, Upload, Shield, Palette, FileText, Check, User, Lock } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { switchBusiness, updateUserProfile } from '../redux/authSlice';

const THEMES = [
  { name: 'Default Violet', primary: '#8b5cf6', class: 'theme-violet' },
  { name: 'Ocean Indigo', primary: '#6366f1', class: 'theme-indigo' },
  { name: 'Emerald Forest', primary: '#10b981', class: 'theme-emerald' },
  { name: 'Crimson Sunset', primary: '#f43f5e', class: 'theme-rose' },
];

const Settings = () => {
  const dispatch = useDispatch();
  const { activeBusinessId, user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState('');
  
  // User profile states
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [colorTheme, setColorTheme] = useState('theme-violet');
  const [aiContext, setAiContext] = useState('');
  
  // logo state
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  // Business Owner Register Workspace forms helper
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  const fetchBusinessSettings = async () => {
    if (!activeBusinessId) return;
    try {
      const res = await api.get(`/businesses/${activeBusinessId}`);
      if (res.data.success) {
        const b = res.data.business;
        setBusinessName(b.name);
        setAddress(b.address || '');
        setGstNumber(b.gstNumber || '');
        setColorTheme(b.colorTheme || 'theme-violet');
        setLogoPreview(b.logo || '');
        setAiContext(b.aiContext || '');
      }
    } catch (err) {
      toast.error('Failed to load workspace settings');
    }
  };

  useEffect(() => {
    fetchBusinessSettings();
  }, [activeBusinessId]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileName || !profileEmail) {
      return toast.error('Name and Email are required');
    }
    
    setProfileLoading(true);
    try {
      const payload = {
        name: profileName,
        email: profileEmail,
      };
      
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      
      const res = await api.put('/auth/profile', payload);
      if (res.data.success) {
        toast.success(res.data.message || 'Profile updated successfully!');
        dispatch(updateUserProfile(res.data.user));
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogoUploadChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('name', businessName);
    formData.append('address', address);
    formData.append('gstNumber', gstNumber);
    formData.append('colorTheme', colorTheme);
    formData.append('aiContext', aiContext);
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    try {
      const res = await api.put(`/businesses/${activeBusinessId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        toast.success('Workspace updated successfully!');
        fetchBusinessSettings();
      }
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName) return toast.error('Enter workspace name');

    try {
      const res = await api.post('/businesses', { name: newWorkspaceName });
      if (res.data.success) {
        toast.success('New workspace created! Switching...');
        setNewWorkspaceName('');
        dispatch(switchBusiness(res.data.business._id || res.data.business.id));
      }
    } catch (err) {
      toast.error('Failed to create workspace');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white font-outfit">Workspace Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Configure company logos, branding colors, tax codes, and register new company profiles</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: forms */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Edit current business */}
          {activeBusinessId ? (
            <form onSubmit={handleSaveSettings} className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-4.5 h-4.5 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Workspace Profile & Brand</h3>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Corporate Logo</label>
                <div className="flex items-center gap-4 mt-1.5">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="brand logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building className="w-6 h-6 text-slate-700" />
                    )}
                  </div>
                  <label className="px-3 py-2 rounded-xl border border-slate-800 hover:bg-slate-950 text-xs font-semibold text-slate-300 cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5 text-slate-500" /> Choose File
                    <input type="file" onChange={handleLogoUploadChange} className="hidden" accept="image/*" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">GSTIN Number (Optional)</label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="27AAAAA1111A1Z1"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Branding Accent Color</label>
                  <div className="flex gap-2 mt-1">
                    {THEMES.map((theme) => (
                      <button
                        key={theme.class}
                        type="button"
                        onClick={() => setColorTheme(theme.class)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                          colorTheme === theme.class ? 'scale-110 ring-2 ring-indigo-500' : ''
                        }`}
                        style={{ backgroundColor: theme.primary }}
                      >
                        {colorTheme === theme.class && <Check className="w-3 h-3 text-slate-950 font-bold" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Company Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street details..."
                  rows="3"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-indigo-400 block mb-1 uppercase tracking-wide">AI Niche Pitch Target (Offering Context)</label>
                <textarea
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  placeholder="Describe what services you pitch (e.g. We build premium WordPress sites, run Facebook Ads, and set up automated review tools)..."
                  rows="3"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-indigo-950/40 focus:border-indigo-500 text-slate-200 focus:outline-none resize-none"
                />
                <span className="text-[9px] text-slate-500 block mt-1 leading-normal">Our AI assistant reads this context to write highly personalized cold outreach proposals matching your exact business niche.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold uppercase tracking-wider font-outfit"
              >
                {loading ? 'Saving details...' : 'Save Workspace branding'}
              </button>

            </form>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-center text-xs text-slate-500 font-semibold">
              Select or register a workspace first.
            </div>
          )}

        </div>

        {/* Right side: Add Workspace & Profile Updates */}
        <div className="space-y-6">
          
          {/* User Profile Settings */}
          <form onSubmit={handleUpdateProfile} className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4.5 h-4.5 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">User Account Profile</h3>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Full Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Email Address</label>
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-850">
              <span className="text-[10px] font-bold text-slate-500 block mb-3 uppercase tracking-wide flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-600" /> Change Security Password
              </span>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase tracking-wide">Current Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-950 border border-slate-850 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase tracking-wide">New Password</label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-950 border border-slate-850 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold uppercase tracking-wider font-outfit"
            >
              {profileLoading ? 'Updating Profile...' : 'Save Profile changes'}
            </button>
          </form>

          {/* New Workspace */}
          <form onSubmit={handleCreateWorkspace} className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Building className="w-4.5 h-4.5 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">New Workspace</h3>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Company Name</label>
              <input
                type="text"
                placeholder="e.g. Solar Agencies Mumbai"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold uppercase tracking-wider font-outfit"
            >
              Add New Tenant
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default Settings;
