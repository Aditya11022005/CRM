import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import OnboardingGuide from '../components/OnboardingGuide';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    // Show onboarding only once per user (keyed by user email/id)
    const userKey = `onboarding_completed_${user?._id || user?.email || 'guest'}`;
    const alreadyDone = localStorage.getItem(userKey);
    if (!alreadyDone) {
      // Small delay so dashboard renders first
      const timer = setTimeout(() => setShowOnboarding(true), 600);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigate, user]);

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    // Mark as completed for this specific user
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
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default DashboardLayout;
