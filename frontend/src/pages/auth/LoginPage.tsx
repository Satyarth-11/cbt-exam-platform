import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, Lock, User as UserIcon, AlertCircle, ArrowRight } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setCredentials, setError } from '../../store/slices/authSlice';
import { TokenResponse } from '../../types/auth';

export const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { error, isAuthenticated, user } = useAppSelector((state) => state.auth);

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('reason') === 'session_invalidated') {
      setInfoMessage('Your active session was invalidated because you logged in from another device.');
    }
  }, [location]);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.roles.includes('ROLE_ADMIN') || user.roles.includes('ROLE_EXAMINER')) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    dispatch(setError(null));
    setInfoMessage(null);

    try {
      // axiosClient interceptor returns the axios response.data (the ApiResponse envelope).
      // Backend wraps token in ApiResponse<TokenResponse>, so we must access .data to get the TokenResponse.
      const apiResponse: any = await axiosClient.post('/auth/login', {
        usernameOrEmail,
        password,
      });

      const tokenData: TokenResponse = apiResponse.data ?? apiResponse;
      dispatch(setCredentials(tokenData));

      if (tokenData.roles.includes('ROLE_ADMIN') || tokenData.roles.includes('ROLE_EXAMINER')) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    } catch (err: any) {
      // err may be an ApiResponse object {success, message} or a plain string
      const errMsg = typeof err === 'string' ? err
        : err?.message || err?.data?.message || 'Invalid username or password';
      dispatch(setError(errMsg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 flex-1 flex flex-col md:flex-row items-center justify-center gap-12">
      {/* Left Column: Platform Branding & Single Active Session Info */}
      <div className="flex-1 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5" />
          Single-Active-Session Protection Enabled
        </div>

        <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
          Secure Candidate & Admin Access Portal
        </h2>
        <p className="text-slate-300 text-base leading-relaxed">
          Log in with your assigned examination credentials. For security, establishing a session on a new device automatically invalidates previous session tokens.
        </p>
      </div>

      {/* Right Column: Login Card */}
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-white">Sign In</h3>
          <p className="text-xs text-slate-400 mt-1">Enter your candidate email or username</p>
        </div>

        {infoMessage && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{infoMessage}</div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Username or Email</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="student@exam.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-slate-300">Password</label>
              <Link to="/forgot-password" className="text-xs text-cyan-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold text-sm hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to CBT Platform'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          New student?{' '}
          <Link to="/register" className="text-cyan-400 font-semibold hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};
