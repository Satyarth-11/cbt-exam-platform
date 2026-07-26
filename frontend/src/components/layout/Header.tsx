import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import axiosClient from '../../api/axiosClient';

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      if (user?.sessionId) {
        await axiosClient.post(`/auth/logout?sessionId=${user.sessionId}`);
      }
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  };

  const getPrimaryRoleBadge = () => {
    if (!user?.roles || user.roles.length === 0) return null;
    if (user.roles.includes('ROLE_ADMIN')) {
      return <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">ADMIN</span>;
    }
    if (user.roles.includes('ROLE_EXAMINER')) {
      return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">EXAMINER</span>;
    }
    return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">STUDENT</span>;
  };

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 px-6 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Branding */}
        <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
          <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
            <img src="/logo.svg" alt="OmniTest Logo" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              OmniTest Engine
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                Universal CBT Mode
              </span>
            </h1>
            <p className="text-xs text-slate-400">JEE • SSC • NEET • Banking • GATE • UPSC • Railway CBT Platform</p>
          </div>
        </Link>

        {/* Navigation Links */}
        {isAuthenticated && user && (
          <nav className="flex items-center space-x-4 text-xs font-semibold text-slate-300">
            {user.roles.includes('ROLE_STUDENT') && (
              <>
                <Link to="/student/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                <Link to="/student/pyp" className="hover:text-cyan-400 text-slate-300 transition-colors">
                  Previous Year Papers
                </Link>
                <Link to="/student/custom-exam" className="hover:text-cyan-400 text-cyan-300 font-bold transition-colors">
                  Upload Paper & Custom Test
                </Link>
                <Link to="/student/purchase-credits" className="hover:text-amber-400 text-amber-300 font-bold transition-colors flex items-center gap-1 bg-amber-950/30 border border-amber-800/30 px-2.5 py-1 rounded-lg">
                  🪙 Buy Credits
                </Link>
              </>
            )}
            {(user.roles.includes('ROLE_ADMIN') || user.roles.includes('ROLE_EXAMINER')) && (
              <>
                <Link to="/admin/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                <Link to="/admin/exams" className="hover:text-white transition-colors">Exams</Link>
                {user.roles.includes('ROLE_ADMIN') && (
                  <>
                    <Link to="/admin/users" className="hover:text-white transition-colors">Users</Link>
                    <Link to="/admin/payment-requests" className="hover:text-amber-400 font-bold text-amber-300 transition-colors">
                      Payment Claims
                    </Link>
                  </>
                )}
                <Link to="/admin/audit-logs" className="hover:text-white transition-colors">Audit Logs</Link>
                <Link to="/admin/system-health" className="hover:text-white transition-colors">Telemetry</Link>
                <Link to="/admin/proctor" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-800/30 px-3 py-1.5 rounded-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                  Live Proctoring
                </Link>
              </>
            )}
          </nav>
        )}

        {/* User Profile Controls */}
        <div className="flex items-center space-x-4">

          {isAuthenticated && user ? (
            <div className="flex items-center space-x-3 bg-slate-800/90 border border-slate-700/80 px-3.5 py-1.5 rounded-xl shadow-inner">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-white leading-tight flex items-center gap-1.5">
                    {user.firstName} {user.lastName}
                    {getPrimaryRoleBadge()}
                  </div>
                  <div className="text-[10px] text-slate-400">{user.email}</div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Logout Session"
                className="p-1.5 rounded-lg bg-slate-700/50 text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-semibold hover:from-blue-500 hover:to-cyan-500 shadow-md transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
