import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Bell, Search, User, CheckCircle, Award, Volume2, Trash2 } from 'lucide-react';
import api from '../services/api';
import socketIOClient from 'socket.io-client';
import toast from 'react-hot-toast';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, activeBusinessId } = useSelector((state) => state.auth);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Get Page Title from Pathname
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Overview Dashboard';
    if (path.startsWith('/leads')) return 'Lead Generation Engine';
    if (path.startsWith('/crm')) return 'CRM Status Board';
    if (path.startsWith('/quotes')) return 'Quotes & Estimates';
    if (path.startsWith('/invoices')) return 'Invoices & Payments';
    if (path.startsWith('/team')) return 'Team Workspace';
    if (path.startsWith('/settings')) return 'Settings Panel';
    if (path.startsWith('/subscription')) return 'Billing Portal';
    if (path.startsWith('/admin')) return 'Super Admin Dashboard';
    return 'Codeitz CRM';
  };

  // Fetch initial notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/auth/me'); // simple fetch, or customized notifications
      // Let's seed mock notifications for a beautiful empty state demo
      const mockNotifs = [
        {
          _id: 'n1',
          title: 'Welcome to Codeitz!',
          message: 'Explore lead collection using scraper fallbacks.',
          type: 'System',
          createdAt: new Date(),
          isRead: false,
        },
        {
          _id: 'n2',
          title: '3 Days Trial Activated',
          message: 'Your free trial limits are set to 100 leads.',
          type: 'Reminder',
          createdAt: new Date(Date.now() - 3600000),
          isRead: true,
        },
      ];
      setNotifications(mockNotifs);
      setUnreadCount(mockNotifs.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (!activeBusinessId) return;

    // Connect to websocket server
    const socket = socketIOClient(import.meta.env.VITE_SOCKET_URL || window.location.origin || 'http://localhost:5000');
    
    // Join business room
    socket.emit('join_business', activeBusinessId);

    // Listen to real-time events
    socket.on('scraping_log', (data) => {
      // If success or warning, throw a toast alert
      if (data.type === 'success' && data.progress === 100) {
        toast.success(`Scraper: ${data.message}`);
        // Add new notification
        const newN = {
          _id: Math.random().toString(),
          title: 'Scraping Completed',
          message: data.message,
          type: 'Lead',
          createdAt: new Date(),
          isRead: false,
        };
        setNotifications((prev) => [newN, ...prev]);
        setUnreadCount((c) => c + 1);
      }
    });

    socket.on('invoice_payment', (data) => {
      toast.success(`Payment Alert: Invoice ${data.invoiceNumber} is marked ${data.status}!`);
      const newN = {
        _id: Math.random().toString(),
        title: `Invoice ${data.status}`,
        message: `Invoice ${data.invoiceNumber} for INR ${data.total} was updated.`,
        type: 'Payment',
        createdAt: new Date(),
        isRead: false,
      };
      setNotifications((prev) => [newN, ...prev]);
      setUnreadCount((c) => c + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [activeBusinessId]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    toast.success('Marked all as read');
  };

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    toast(`Searching for "${searchQuery}"...`);
    // Redirect or trigger filters
    if (location.pathname !== '/leads') {
      navigate(`/leads?query=${encodeURIComponent(searchQuery)}`);
    } else {
      // already on leads page, dispatch query parameter via state or reload
      window.location.search = `?query=${encodeURIComponent(searchQuery)}`;
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    toast.success('Notifications cleared');
  };

  return (
    <div className="h-16 border-b border-slate-800/40 px-6 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-md z-20">
      
      {/* Dynamic Title */}
      <div>
        <h2 className="text-lg font-outfit font-bold text-white tracking-wide">{getPageTitle()}</h2>
      </div>

      {/* Right controls: Search, Notification Bell, Profile */}
      <div className="flex items-center gap-4">
        
        {/* Global Search Bar */}
        <form onSubmit={handleGlobalSearch} className="relative hidden md:block">
          <input
            type="text"
            placeholder="Search leads, cities, etc..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 pl-9 pr-4 py-1.5 rounded-full text-xs bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
        </form>

        {/* Notifications Icon and Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors relative border border-slate-800/60"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-3 animate-enter text-slate-200">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60 text-xs font-semibold">
                <span>Alert Inbox</span>
                <div className="flex gap-2">
                  <button onClick={markAllAsRead} className="text-[10px] text-indigo-400 hover:underline">
                    Read All
                  </button>
                  <button onClick={clearNotifications} className="text-[10px] text-rose-400 hover:underline flex items-center gap-0.5">
                    <Trash2 className="w-2.5 h-2.5" /> Clear
                  </button>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No new alerts
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-2 rounded-lg text-xs leading-relaxed transition-colors border ${
                        n.isRead ? 'bg-slate-950/20 border-slate-950' : 'bg-slate-900/60 border-slate-800/80 font-medium'
                      }`}
                    >
                      <div className="flex justify-between font-semibold mb-0.5">
                        <span className="text-[11px] text-indigo-300">{n.title}</span>
                        <span className="text-[9px] text-slate-500 font-normal">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[10px]">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info Capsule */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-[10px]">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <span className="hidden sm:inline text-slate-200 font-medium">{user?.name}</span>
        </div>

      </div>
    </div>
  );
};

export default Navbar;
