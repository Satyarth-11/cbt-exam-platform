import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { ShieldCheck, Users, Activity, FileText, Monitor, AlertTriangle, Layers, TrendingUp, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import axiosClient from '../../api/axiosClient';
import { AdminDashboardSummary } from '../../types/dashboard';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminSummary = () => {
    setLoading(true);
    axiosClient.get('/admin/dashboard/summary')
      .then((res: any) => {
        setSummary(res.data || res);
        setError(null);
      })
      .catch((err: any) => {
        console.error('Failed to load admin summary:', err);
        setError(err?.message || 'Failed to fetch admin metrics');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAdminSummary();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 flex-1">
      {/* Welcome Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> Administrative & Proctoring Portal
          </div>
          <h2 className="text-3xl font-extrabold text-white">
            Welcome, {user?.firstName} {user?.lastName}!
          </h2>
          <p className="text-slate-400 text-sm">
            Administrator Account ID: <span className="font-mono text-purple-400">{user?.id}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
          <Monitor className="w-5 h-5 text-purple-400 shrink-0" />
          <div>
            <div className="font-bold text-white">Active Single Session</div>
            <div className="text-slate-400 text-[11px]">Session ID: {user?.sessionId?.substring(0, 18)}...</div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Students</span>
          <div className="text-2xl font-extrabold text-white">{loading ? '...' : summary?.totalActiveStudents || 0}</div>
          <div className="text-[10px] text-slate-400">Registered candidates</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Exams Configured</span>
          <div className="text-2xl font-extrabold text-cyan-400">{loading ? '...' : summary?.totalExams || 0}</div>
          <div className="text-[10px] text-slate-400">Mock & Chapter papers</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live Active Exams</span>
          <div className="text-2xl font-extrabold text-emerald-400">{loading ? '...' : summary?.liveExamsCount || 0}</div>
          <div className="text-[10px] text-slate-400">Real-time candidate sessions</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Submitted Attempts</span>
          <div className="text-2xl font-extrabold text-purple-400">{loading ? '...' : summary?.totalCompletedAttempts || 0}</div>
          <div className="text-[10px] text-slate-400">Completed & scored</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2 bg-amber-500/5 border-amber-500/20">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Violations
          </span>
          <div className="text-2xl font-extrabold text-amber-300">{loading ? '...' : summary?.violationCountPlaceholder || 0}</div>
          <div className="text-[10px] text-amber-400/80">Wired in Phase 4 Proctoring</div>
        </div>
      </div>

      {/* Analytics Charts Grid (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Monthly Test Attempt Trends */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Monthly Attempt Growth Trends
            </h3>
            <span className="text-xs text-slate-400">Candidate Participation</span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary?.monthlyAttemptTrends || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                <Area type="monotone" dataKey="attempts" stroke="#0284C7" fillOpacity={1} fill="url(#colorAttempts)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Subject Accuracy & Performance Spread */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-purple-400" />
              Subject Accuracy & Score Spread
            </h3>
            <span className="text-xs text-slate-400">Average % Score</span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.subjectScoreSpread || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="subject" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="avgAccuracy" fill="#A855F7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Exams Overview Table */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          Configured Exams Overview
        </h3>

        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Exam Title</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Questions / Duration</th>
                  <th className="px-6 py-4">Total Marks</th>
                  <th className="px-6 py-4">Scheduled Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {summary?.recentExams && summary.recentExams.length > 0 ? (
                  summary.recentExams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-white">{exam.title}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-mono">
                          {exam.subject}
                        </span>
                      </td>
                      <td className="px-6 py-4">{exam.totalQuestions} Qs ({exam.durationMinutes} mins)</td>
                      <td className="px-6 py-4 font-bold text-emerald-400">{exam.totalMarks} pts</td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(exam.scheduledStartTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        {exam.status === 'SCHEDULED' && (
                          <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                            SCHEDULED
                          </span>
                        )}
                        {exam.status === 'LIVE' && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold animate-pulse">
                            LIVE
                          </span>
                        )}
                        {exam.status === 'COMPLETED' && (
                          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-bold">
                            COMPLETED
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/admin/exams/${exam.id}/analytics`)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all"
                        >
                          View Analytics
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No exams configured yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
