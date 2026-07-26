import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { BookOpen, Award, Bell, Shield, CheckCircle2, Clock, Calendar, ChevronRight, BarChart3, AlertCircle, FileSpreadsheet, Loader2 } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { StudentDashboardSummary } from '../../types/dashboard';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const [summary, setSummary] = useState<StudentDashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [startingExamId, setStartingExamId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = () => {
    setLoading(true);
    axiosClient.get('/student/dashboard/summary')
      .then((res: any) => {
        setSummary(res.data || res);
        setError(null);
      })
      .catch((err: any) => {
        console.error('Failed to load student dashboard:', err);
        setError(err?.message || 'Failed to load dashboard metrics');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleStartExam = (examId: string) => {
    setStartingExamId(examId);
    axiosClient.post(`/student/exams/${examId}/start`)
      .then((res: any) => {
        const attemptId = res.data?.attemptId || res.attemptId;
        if (attemptId) {
          navigate(`/exam/take/${attemptId}`);
        }
      })
      .catch((err: any) => {
        console.error('Failed to start exam:', err);
        setError(err?.message || 'Failed to start CBT session. Attempt limit reached or expired.');
      })
      .finally(() => {
        setStartingExamId(null);
      });
  };

  const getSubjectBadge = (subject: string) => {
    switch (subject) {
      case 'PHYSICS':
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">PHYSICS</span>;
      case 'CHEMISTRY':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">CHEMISTRY</span>;
      case 'MATHEMATICS':
        return <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold">MATHEMATICS</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold">FULL LENGTH MOCK</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 flex-1">
      {/* Welcome Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> ROLE_STUDENT Authenticated
          </div>
          <h2 className="text-3xl font-extrabold text-white">
            Welcome back, {user?.firstName} {user?.lastName}!
          </h2>
          <p className="text-slate-400 text-sm">
            NTA Candidate Registration ID: <span className="font-mono text-cyan-400">{user?.id}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
          <Shield className="w-5 h-5 text-blue-400 shrink-0" />
          <div>
            <div className="font-bold text-white">Single-Active-Session</div>
            <div className="text-slate-400 text-[11px]">Session ID: {user?.sessionId?.substring(0, 18)}...</div>
          </div>
        </div>
      </div>

      {/* Universal Document Upload & AI Exam Generator Callout */}
      <div className="glass-panel p-6 rounded-3xl border border-cyan-500/40 bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-slate-900 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider">
            Universal Exam Engine • JEE • SSC • NEET • Banking • GATE • UPSC
          </span>
          <h3 className="text-xl font-extrabold text-white">
            Upload PDF / DOCX Paper or Generate Custom Test
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Upload your own question paper in PDF or Word format, or select any competitive exam category (SSC CGL, NEET, Banking, UPSC) to generate an interactive CBT mock test with step-by-step solution explanations!
          </p>
        </div>

        <button
          onClick={() => navigate('/student/custom-exam')}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 shrink-0 flex items-center gap-2 transition-all"
        >
          Upload Paper & Start Test →
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Top Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tests Attempted</span>
            <FileSpreadsheet className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {loading ? '...' : summary?.totalAttempts || 0}
          </div>
          <p className="text-xs text-slate-400">Completed CBT Papers</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Accuracy Score</span>
            <BarChart3 className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {loading ? '...' : `${summary?.averageScore || 0} pts`}
          </div>
          <p className="text-xs text-slate-400">Calculated across attempts</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Highest Percentile</span>
            <Award className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {loading ? '...' : `${summary?.highestPercentile || 0}%`}
          </div>
          <p className="text-xs text-slate-400">NTA All-India Rank Metric</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unread Alerts</span>
            <Bell className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400">
            {loading ? '...' : summary?.unreadNotificationsCount || 0}
          </div>
          <p className="text-xs text-slate-400">Candidate notifications</p>
        </div>
      </div>

      {/* Main Grid: Upcoming Exams & Candidate Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upcoming Scheduled Exams (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              Upcoming Scheduled Exams
            </h3>
            <span className="text-xs text-slate-400">JEE Main / Advanced Pattern</span>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="p-8 glass-panel rounded-2xl text-center text-slate-400 text-xs">Loading scheduled exams...</div>
            ) : summary?.upcomingExams && summary.upcomingExams.length > 0 ? (
              summary.upcomingExams.map((exam) => (
                <div key={exam.id} className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getSubjectBadge(exam.subject)}
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                        {exam.durationMinutes} mins
                      </span>
                    </div>
                    <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Starts in ~2 hrs
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-white">{exam.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{exam.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-300 gap-4">
                    <div className="flex items-center gap-4">
                      <span>Questions: <strong className="text-white">{exam.totalQuestions}</strong></span>
                      <span>Total Marks: <strong className="text-white">{exam.totalMarks}</strong></span>
                    </div>

                    <button
                      onClick={() => handleStartExam(exam.id)}
                      disabled={startingExamId === exam.id}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {startingExamId === exam.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Initializing...
                        </>
                      ) : (
                        <>
                          Start CBT Examination
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 glass-panel rounded-2xl text-center text-slate-400 text-xs">No upcoming exams scheduled.</div>
            )}
          </div>
        </div>

        {/* Right Column: Notifications Drawer */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              Notifications & Alerts
            </h3>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 max-h-[500px] overflow-y-auto">
            {summary?.notifications && summary.notifications.length > 0 ? (
              summary.notifications.map((n) => (
                <div key={n.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-cyan-400">{n.title}</span>
                    <span className="text-[10px] text-slate-500">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-400 text-xs py-6">No notifications</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Past Attempt History & Scorecard */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          Test Attempt History & Scorecards
        </h3>

        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Test Title</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Score / Percentage</th>
                  <th className="px-6 py-4">Accuracy (Correct/Wrong/Unattempted)</th>
                  <th className="px-6 py-4">Percentile</th>
                  <th className="px-6 py-4">Feedback Summary</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {summary?.recentAttempts && summary.recentAttempts.length > 0 ? (
                  summary.recentAttempts.map((attempt) => (
                    <tr key={attempt.attemptId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-white">{attempt.examTitle}</td>
                      <td className="px-6 py-4">{getSubjectBadge(attempt.subject)}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-emerald-400">{attempt.score} pts</div>
                        <div className="text-[10px] text-slate-400">{attempt.percentage}% total</div>
                      </td>
                      <td className="px-6 py-4 font-mono">
                        <span className="text-emerald-400">{attempt.totalCorrect} Correct</span> /{' '}
                        <span className="text-red-400">{attempt.totalIncorrect} Wrong</span> /{' '}
                        <span className="text-slate-400">{attempt.totalUnattempted} Left</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold font-mono">
                          {attempt.percentile}%ile
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 max-w-xs">{attempt.feedbackSummary}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/student/attempts/${attempt.attemptId}/scorecard`)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all"
                        >
                          View Scorecard
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No past test attempts found.
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
