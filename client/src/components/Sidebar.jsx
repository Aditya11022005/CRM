import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser, switchBusiness, toggleTheme } from '../redux/authSlice';
import api from '../services/api';
import {
  LayoutDashboard,
  Users,
  Search,
  CheckSquare,
  FileText,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  CreditCard,
  Bell,
  LogOut,
  Moon,
  Sun,
  Building,
  ChevronDown,
  Plus,
  Briefcase,
  Compass,
  MessageSquare,
  CalendarDays
} from 'lucide-react';
import toast from 'react-hot-toast';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const { user, activeBusinessId, theme } = useSelector((state) => state.auth);
  
  const [businesses, setBusinesses] = useState([]);
  const [showBusinessSelect, setShowBusinessSelect] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  // Fetch user businesses
  const fetchBusinesses = async () => {
    try {
      const res = await api.get('/businesses');
      if (res.data.success) {
        setBusinesses(res.data.businesses);
        
        // If no active business ID is set, default to first one
        if (!activeBusinessId && res.data.businesses.length > 0) {
          dispatch(switchBusiness(res.data.businesses[0].id || res.data.businesses[0]._id));
        }
      }
    } catch (err) {
      console.error('Error fetching businesses:', err);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [activeBusinessId]);

  useEffect(() => {
    if (businesses.length > 0) {
      const current = businesses.find(
        (b) => (b.id || b._id) === activeBusinessId
      );
      setSelectedBusiness(current || businesses[0]);
    }
  }, [businesses, activeBusinessId]);

  const handleBusinessChange = (id) => {
    dispatch(switchBusiness(id));
    setShowBusinessSelect(false);
    toast.success('Switched Workspace!');
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // ignore logout API failure
    }
    dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', permission: 'analytics' },
    { name: 'Leads Collection', icon: Compass, path: '/leads', permission: 'leads' },
    { name: 'CRM Pipeline', icon: CheckSquare, path: '/crm', permission: 'crm' },
    { name: 'WhatsApp Sender', icon: MessageSquare, path: '/whatsapp', permission: 'leads' },
    { name: 'Follow-up Calendar', icon: CalendarDays, path: '/calendar', permission: 'crm' },
    { name: 'Quote Builder', icon: FileSpreadsheet, path: '/quotes', permission: 'quotes' },
    { name: 'Invoices', icon: FileText, path: '/invoices', permission: 'invoices' },
    { name: 'Subscription Plan', icon: CreditCard, path: '/subscription', permission: null },
    { name: 'Workspace Settings', icon: Settings, path: '/settings', permission: null },
  ];

  // Check if team member has permission
  const hasMenuPermission = (item) => {
    if (user?.role === 'Super Admin' || user?.role === 'Business Owner') return true;
    if (!item.permission) return true;
    
    // Look at selected business teamContext permissions
    const permissions = selectedBusiness?.teamContext?.permissions;
    if (permissions && permissions[item.permission] === false) {
      return false;
    }
    return true;
  };

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <div
        className={`fixed md:static inset-y-0 left-0 w-64 h-screen flex flex-col glass-panel border-r border-slate-800/60 text-slate-300 select-none z-50 transition-transform duration-300 transform md:transform-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
      
      {/* SaaS Branding */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-800/40">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-indigo-500/20">
          C
        </div>
        <div>
          <span className="font-outfit font-bold text-lg text-white tracking-wide">Codeitz</span>
          <span className="text-xs block text-slate-500 -mt-1">SaaS CRM</span>
        </div>
      </div>

      {/* Business switcher dropdown */}
      {user?.role !== 'Super Admin' && (
        <div className="px-4 py-3 relative border-b border-slate-800/40">
          <div
            onClick={() => setShowBusinessSelect(!showBusinessSelect)}
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 cursor-pointer transition-all duration-200"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              {selectedBusiness?.logo ? (
                <img
                  src={selectedBusiness.logo}
                  alt="logo"
                  className="w-5 h-5 rounded-md object-cover"
                />
              ) : (
                <Building className="w-4 h-4 text-indigo-400" />
              )}
              <span className="text-xs font-semibold text-slate-200 truncate">
                {selectedBusiness?.name || 'Create Business...'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {showBusinessSelect && (
            <div className="absolute left-4 right-4 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 p-1.5 animate-enter">
              <div className="max-h-40 overflow-y-auto">
                {businesses.map((b) => (
                  <div
                    key={b.id || b._id}
                    onClick={() => handleBusinessChange(b.id || b._id)}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer ${
                      activeBusinessId === (b.id || b._id)
                        ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                        : 'hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="truncate">{b.name}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {b.teamContext?.role === 'Business Owner' ? 'Owner' : b.teamContext?.role}
                    </span>
                  </div>
                ))}
              </div>
              <div
                onClick={() => {
                  setShowBusinessSelect(false);
                  navigate('/settings');
                }}
                className="flex items-center gap-2 p-2 mt-1 rounded-lg text-xs text-indigo-400 hover:bg-slate-800 cursor-pointer border-t border-slate-800/60"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Workspace</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation menu list */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {user?.role === 'Super Admin' ? (
          <>
            <div className="px-3 text-[10px] uppercase font-bold text-slate-600 tracking-wider mb-2">
              Super Admin Area
            </div>
            <div
              onClick={() => {
                navigate('/admin');
                if (onClose) onClose();
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 ${
                location.pathname === '/admin'
                  ? 'bg-gradient-to-r from-violet-600/30 to-indigo-600/10 text-violet-300 border-l-2 border-violet-500 font-semibold'
                  : 'hover:bg-slate-900/40 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-violet-400" />
              <span>Platform Control</span>
            </div>
          </>
        ) : (
          <>
            <div className="px-3 text-[10px] uppercase font-bold text-slate-600 tracking-wider mb-2">
              Workspace Options
            </div>
            {menuItems.filter(hasMenuPermission).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <div
                  key={item.name}
                  onClick={() => {
                    navigate(item.path);
                    if (onClose) onClose();
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-300 border-l-2 border-indigo-500 font-semibold'
                      : 'hover:bg-slate-900/40 hover:text-slate-200 text-slate-400'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span>{item.name}</span>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Footer controls: Logout, Theme toggle */}
      <div className="p-4 border-t border-slate-800/40 bg-slate-950/20 flex flex-col gap-2">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/30 border border-slate-800/60">
          <div className="flex items-center gap-2 truncate">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase">
              {user?.name?.substring(0, 2) || 'US'}
            </div>
            <div className="truncate">
              <span className="text-xs block font-semibold text-slate-200 truncate">{user?.name}</span>
              <span className="text-[10px] block text-slate-500 capitalize">{user?.role}</span>
            </div>
          </div>
          <button
            onClick={() => dispatch(toggleTheme())}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full p-2.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-600/20 text-xs font-semibold tracking-wide transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

    </div>
    </>
  );
};

export default Sidebar;
