import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../redux/authSlice';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ShieldCheck, Mail, Lock, KeyRound, AlertTriangle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // OTP Verification overlay states
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState(''); // helper to show generated OTP locally if SMTP failed

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please enter email and password');
    }

    dispatch(loginStart());
    try {
      const res = await api.post('/auth/login', { email, password });
      
      if (res.data.requiresVerification) {
        setRequiresOtp(true);
        setDevOtp(res.data.devOtp || '');
        toast.success(res.data.message);
      } else if (res.data.success) {
        dispatch(loginSuccess({
          user: res.data.user,
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
        }));
        
        toast.success('Logged in successfully!');
        if (res.data.user.role === 'Super Admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Authentication failed. Please verify credentials.';
      dispatch(loginFailure(errMsg));
      toast.error(errMsg);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      return toast.error('Please enter 6-digit OTP');
    }

    try {
      const res = await api.post('/auth/verify-otp', { email, otp: otpCode });
      
      if (res.data.success) {
        dispatch(loginSuccess({
          user: res.data.user,
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
        }));

        toast.success('Account verified and logged in!');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP code');
    }
  };

  const handleResendOtp = async () => {
    try {
      const res = await api.post('/auth/resend-otp', { email });
      if (res.data.success) {
        setDevOtp(res.data.devOtp || '');
        toast.success('A new OTP has been dispatched to your email.');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Resend failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-jakarta p-6 relative">
      <div className="absolute w-[400px] h-[400px] rounded-full bg-indigo-600/5 blur-[80px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md rounded-2xl glass-panel p-8 border border-slate-800/80 shadow-2xl relative z-10">
        
        {/* Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg mb-3">
            L
          </div>
          <h2 className="text-xl font-bold font-outfit text-white">Welcome back</h2>
          <p className="text-xs text-slate-500 mt-1">Sign in to manage lead collection pipelines</p>
        </div>

        {/* Regular Login Form */}
        {!requiresOtp ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <Mail className="w-3.5 h-3.5 text-slate-600 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <Lock className="w-3.5 h-3.5 text-slate-600 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/10 transition-all font-outfit uppercase tracking-wider mt-6"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
            
            <p className="text-center text-xs text-slate-500 mt-6">
              Don't have an account?{' '}
              <span onClick={() => navigate('/register')} className="text-indigo-400 font-semibold hover:underline cursor-pointer">
                Register Workspace
              </span>
            </p>
          </form>
        ) : (
          /* OTP Verification Form Overlay */
          <form onSubmit={handleOtpVerify} className="space-y-4">
            <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-xl mb-4 flex items-start gap-2.5 text-xs text-indigo-300">
              <KeyRound className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
              <p>We've dispatched a 6-digit OTP code to verify your profile: <b>{email}</b>.</p>
            </div>

            {/* Offline Mail Dev Warning helper */}
            {devOtp && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4 flex items-start gap-2.5 text-xs text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p>SMTP Offline Helper: Your OTP code is <b className="text-amber-200 tracking-widest">{devOtp}</b></p>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wide">
                OTP Verification Code
              </label>
              <input
                type="text"
                maxLength="6"
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-center text-lg font-mono tracking-widest bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10 transition-all font-outfit uppercase tracking-wider mt-4"
            >
              Verify OTP & Sign In
            </button>

            <div className="flex justify-between items-center text-xs text-slate-500 mt-6">
              <span onClick={() => setRequiresOtp(false)} className="hover:underline cursor-pointer">
                Back to Sign In
              </span>
              <span onClick={handleResendOtp} className="text-indigo-400 font-semibold hover:underline cursor-pointer">
                Resend OTP
              </span>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default Login;
