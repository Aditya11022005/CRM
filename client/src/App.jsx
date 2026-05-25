import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './dashboard/Dashboard';
import Leads from './leads/Leads';
import CRM from './crm/CRM';
import Quotes from './quotes/Quotes';
import Invoices from './invoices/Invoices';
import Settings from './pages/Settings';
import Subscription from './pages/Subscription';
import Admin from './pages/Admin';
import WhatsApp from './whatsapp/WhatsApp';
import FollowUpCalendar from './calendar/FollowUpCalendar';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import GDPRNotice from './pages/GDPRNotice';

function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/gdpr" element={<GDPRNotice />} />

      {/* Protected Dashboard Layout */}
      <Route path="/" element={<DashboardLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="crm" element={<CRM />} />
        <Route path="quotes" element={<Quotes />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="settings" element={<Settings />} />
        <Route path="subscription" element={<Subscription />} />
        <Route path="whatsapp" element={<WhatsApp />} />
        <Route path="calendar" element={<FollowUpCalendar />} />
        <Route path="admin" element={<Admin />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
