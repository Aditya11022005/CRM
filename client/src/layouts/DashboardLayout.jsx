import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Megaphone, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import OnboardingGuide from '../components/OnboardingGuide';
import api from '../services/api';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    // Show onboarding only once per user
    const userKey = `onboarding_completed_${user?._id || user?.email || 'guest'}`;
    const alreadyDone = localStorage.getItem(userKey);
    if (!alreadyDone) {
      const timer = setTimeout(() => setShowOnboarding(true), 600);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch active platform announcements
      api.get('/auth/announcements')
        .then((res) => {
          if (res.data.success) {
            setAnnouncements(res.data.announcements || []);
          }
        })
        .catch((err) => console.error('Error fetching announcements:', err));
    }
  }, [isAuthenticated]);

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    const userKey = `onboarding_completed_${user?._id || user?.email || 'guest'}`;
    localStorage.setItem(userKey, 'true');
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-slate-950 text-slate-100">

      {/* Onboarding Guide — shown only on first login */}
      {showOnboarding && (
        <OnboardingGuide onClose={handleOnboardingClose} />
      )}

      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Screen Frame */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header Navbar */}
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Dynamic Nested Screen Content */}
        <main className="flex-1 overflow-y-auto bg-glow p-4 md:p-6">
          
          {/* Platform Broadcast Announcements */}
          {announcements.length > 0 && (
            <div className="mb-6 space-y-2">
              {announcements.map((ann) => {
                if (dismissedAnnouncements.includes(ann._id)) return null;
                return (
                  <div
                    key={ann._id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-sm animate-enter ${
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
          )}

          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default DashboardLayout;
